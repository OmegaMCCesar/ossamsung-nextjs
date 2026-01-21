import { GoogleGenAI } from "@google/genai";
import { db } from "@/lib/firebaseAdmin";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL = "gemini-2.5-flash";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { userId, product, questions, answers } = req.body || {};

    if (!userId || !product || !Array.isArray(questions) || !answers) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    // ─────────────────────────────────────────────
    // 1️⃣ LOCK / CACHE DE EVALUACIÓN
    // ─────────────────────────────────────────────
    const evalQuery = query(
      collection(db, "examEvaluations"),
      where("userId", "==", userId),
      where("product", "==", product),
      where("status", "==", "pending")
    );

    const evalSnap = await getDocs(evalQuery);

    if (!evalSnap.empty) {
      return res.status(429).json({
        error: "Evaluación en proceso",
        details: "Evita múltiples envíos",
      });
    }

    // Registrar lock
    const evalRef = await addDoc(collection(db, "examEvaluations"), {
      userId,
      product,
      status: "pending",
      createdAt: serverTimestamp(),
    });

    // ─────────────────────────────────────────────
    // 2️⃣ PROMPT ULTRA ESTRICTO
    // ─────────────────────────────────────────────
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

RESPONDE SOLO JSON:

{
  "results": [
    { "questionId": "Q1", "score": 80, "feedback": "..." }
  ],
  "averageScore": 82
}
`;

    // ─────────────────────────────────────────────
    // 3️⃣ IA (1 sola llamada)
    // ─────────────────────────────────────────────
    const aiResponse = await genAI.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    let raw = aiResponse.text?.trim();
    if (!raw) throw new Error("Respuesta vacía de IA");

    raw = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(raw);

    // ─────────────────────────────────────────────
    // 4️⃣ NORMALIZAR RESULTADOS
    // ─────────────────────────────────────────────
    const scores = {};
    let total = 0;
    let count = 0;

    (parsed.results || []).forEach(r => {
      const score = Math.max(0, Math.min(100, Number(r.score) || 0));
      scores[r.questionId] = {
        score,
        feedback: r.feedback || "",
      };
      total += score;
      count++;
    });

    const averageScore = count ? Math.round(total / count) : 0;

    // ─────────────────────────────────────────────
    // 5️⃣ PROGRESIÓN REAL
    // ─────────────────────────────────────────────
    const currentDifficulty =
      Math.max(...questions.map(q => q.difficulty || 1)) || 1;

    let nextDifficulty = currentDifficulty;
    let mode = "normal";

    if (averageScore >= 80) {
      nextDifficulty = Math.min(currentDifficulty + 1, 5);
    }

    if (averageScore >= 90) {
      mode = "strict";
    }

    if (averageScore >= 85 && nextDifficulty >= 4) {
      nextDifficulty = 5;
      mode = "expert";
    }

    const finalResult = {
      scores,
      averageScore,
      progression: {
        currentDifficulty,
        nextDifficulty,
        mode,
        canAdvance: averageScore >= 80,
      },
    };

    // ─────────────────────────────────────────────
    // 6️⃣ CERRAR LOCK
    // ─────────────────────────────────────────────
    await updateDoc(evalRef, {
      status: "done",
      result: finalResult,
      completedAt: serverTimestamp(),
    });

    // ─────────────────────────────────────────────
    // 7️⃣ HISTORIAL REAL (CLAVE 🔥)
    // ─────────────────────────────────────────────
    await addDoc(collection(db, "examResults"), {
      userId,
      product,
      averageScore,
      difficultyReached: nextDifficulty,
      mode,
      createdAt: serverTimestamp(),
    });

    // ─────────────────────────────────────────────
    // 8️⃣ MARCAR EXAMEN GENERADO COMO COMPLETADO
    // ─────────────────────────────────────────────
    const testQuery = query(
      collection(db, "generatedTests"),
      where("userId", "==", userId),
      where("product", "==", product),
      where("status", "==", "pending")
    );

    const testSnap = await getDocs(testQuery);
    if (!testSnap.empty) {
      await updateDoc(testSnap.docs[0].ref, {
        status: "completed",
        completedAt: serverTimestamp(),
      });
    }

    return res.status(200).json(finalResult);

  } catch (err) {
    console.error("evaluate-exam error:", err);
    return res.status(500).json({
      error: "Error evaluando examen",
      details: err.message,
    });
  }
}
