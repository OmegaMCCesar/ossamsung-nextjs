import { GoogleGenAI, Type } from "@google/genai";
import { db } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL = "gemini-3-flash-preview";

const evaluationSchema = {
  type: Type.OBJECT,
  properties: {
    results: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          questionId: { type: Type.STRING },
          score: { type: Type.NUMBER },
          feedback: { type: Type.STRING }
        },
        required: ["questionId", "score", "feedback"]
      }
    },
    averageScore: { type: Type.NUMBER }
  },
  required: ["results", "averageScore"]
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  let evalRef = null;

  try {
    const { userId, product, questions, answers, testId } = req.body || {};

    if (!userId || !product || !Array.isArray(questions) || !answers || !testId) {
      return res.status(400).json({ error: "Datos incompletos o falta ID del examen" });
    }

    // 1️⃣ LOCK / CACHE DE EVALUACIÓN (SINTAXIS ADMIN SDK)
    const evalSnap = await db.collection("examEvaluations")
      .where("userId", "==", userId)
      .where("product", "==", product)
      .where("status", "==", "pending")
      .get();

    if (!evalSnap.empty) {
      return res.status(429).json({
        error: "Evaluación en proceso",
        details: "Evita múltiples envíos",
      });
    }

    evalRef = await db.collection("examEvaluations").add({
      userId, product, status: "pending", createdAt: FieldValue.serverTimestamp(),
    });

    // 2️⃣ PROMPT ULTRA ESTRICTO
    const questionsBlock = questions.map((q, i) => {
      const answer = (answers[q.id] || "").trim();
      const isShort = answer.length < 20;

      return `
Pregunta ${i + 1}
ID: ${q.id}
Dificultad: ${q.difficulty}/5
Enunciado: ${q.prompt}
Respuesta del técnico: "${answer}"
${isShort ? "⚠️ Respuesta demasiado corta, penalizar fuerte." : ""}
`;
    }).join("\n");

    const prompt = `
Eres un EVALUADOR TÉCNICO SENIOR EXTREMADAMENTE ESTRICTO de Samsung.
NO premies respuestas vagas.

CRITERIOS:
- 90–100: Diagnóstico claro + pruebas reales
- 70–89: Correcto pero incompleto
- 40–69: Genérico o sin método
- 0–39: Vago, incorrecto o sin sustento

REGLAS:
- Respuestas cortas o vagas → máximo 40%
- Sin método de diagnóstico → no superar 60%

Producto: ${product}
${questionsBlock}
`;

    // 3️⃣ IA
    const aiResponse = await genAI.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: evaluationSchema,
      },
    });

    let parsed;
    try {
      parsed = JSON.parse(aiResponse.text);
    } catch (e) {
      console.error("Error parseando IA:", aiResponse.text);
      throw new Error("Error procesando los resultados estructurados de la IA.");
    }

    // 4️⃣ NORMALIZAR RESULTADOS
    const scores = {};
    let total = 0;
    let count = 0;

    parsed.results.forEach(r => {
      const score = Math.max(0, Math.min(100, Number(r.score) || 0));
      scores[r.questionId] = { score, feedback: r.feedback || "" };
      total += score;
      count++;
    });

    const averageScore = parsed.averageScore !== undefined 
      ? parsed.averageScore 
      : (count ? Math.round(total / count) : 0);

    // 5️⃣ PROGRESIÓN REAL
    const currentDifficulty = Math.max(...questions.map(q => q.difficulty || 1)) || 1;
    let nextDifficulty = currentDifficulty;
    let mode = "normal";

    if (averageScore >= 80) nextDifficulty = Math.min(currentDifficulty + 1, 5);
    if (averageScore >= 90) mode = "strict";
    if (averageScore >= 85 && nextDifficulty >= 4) { nextDifficulty = 5; mode = "expert"; }

    const finalResult = {
      scores, averageScore,
      progression: { currentDifficulty, nextDifficulty, mode, canAdvance: averageScore >= 80 },
    };

    // 6️⃣ CERRAR LOCK EXITOSAMENTE (SINTAXIS ADMIN SDK)
    await evalRef.update({
      status: "done", result: finalResult, completedAt: FieldValue.serverTimestamp(),
    });

    // 7️⃣ HISTORIAL REAL (SINTAXIS ADMIN SDK)
    await db.collection("examResults").add({
      userId, product, averageScore, difficultyReached: nextDifficulty,
      mode, createdAt: FieldValue.serverTimestamp(),
    });

    // 8️⃣ MARCAR EXAMEN COMO COMPLETADO (SINTAXIS ADMIN SDK)
    await db.collection("generatedTests").doc(testId).update({
      status: "completed",
      completedAt: FieldValue.serverTimestamp(),
    });

    return res.status(200).json(finalResult);

  } catch (err) {
    console.error("evaluate-exam error:", err);

    if (evalRef) {
      try {
        await evalRef.update({
          status: "failed", error: err.message, completedAt: FieldValue.serverTimestamp(),
        });
      } catch (unlockErr) {
        console.error("No se pudo liberar el candado", unlockErr);
      }
    }

    return res.status(500).json({ error: "Error evaluando examen", details: err.message });
  }
}