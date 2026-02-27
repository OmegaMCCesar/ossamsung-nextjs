import { GoogleGenAI } from "@google/genai";
import { db } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY no configurada");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL_NAME = "gemini-3-flash-preview";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  let evalRef = null;

  try {
    const { userId, product, questions, answers, testId } = req.body || {};

    if (!userId || !product || !testId || !Array.isArray(questions) || typeof answers !== "object") {
      return res.status(400).json({ error: "Datos incompletos o inválidos" });
    }

    // 🔐 LOCK anti doble evaluación
    const pendingSnap = await db.collection("examEvaluations")
      .where("userId", "==", userId)
      .where("testId", "==", testId)
      .where("status", "==", "pending")
      .get();

    if (!pendingSnap.empty) {
      return res.status(429).json({ error: "Evaluación ya en proceso" });
    }

    evalRef = await db.collection("examEvaluations").add({
      userId, product, testId, status: "pending", createdAt: FieldValue.serverTimestamp(),
    });

    // 🧠 Construcción del bloque de preguntas con CONTEXTO TÉCNICO INYECTADO
    const questionsBlock = questions.map((q, i) => {
      const answer = (answers[q.id] || "").toString().trim();
      return `
Pregunta ${i + 1}
ID: ${q.id}
Componente Relacionado: ${q.subTopic} (PN: ${q.partNumber})
Enunciado: ${q.prompt}
Respuesta del técnico: "${answer}"
`;
    }).join("\n");

    const prompt = `
Eres un EVALUADOR TÉCNICO SENIOR de Samsung. Tu misión es calificar la precisión de un técnico.

REGLAS DE EVALUACIÓN:
1. Si la pregunta menciona valores técnicos específicos (Ohms, Voltios, Amperios), la respuesta del técnico DEBE coincidir con esos valores para obtener más de 70 puntos.
2. Penaliza respuestas vagas como "revisar", "verificar" o "cambiar pieza" si no explican el "cómo" o el "qué valor esperar".
3. Si el score de una pregunta es menor a 80, identifica el componente en 'suggestedPartKey'.

Responde ESTRICTAMENTE en JSON:
{
  "results": [
    {
      "questionId": "string",
      "score": number,
      "feedback": "string (explicar por qué el valor es correcto o incorrecto)",
      "suggestedPartKey": "string (nombre del componente fallado)"
    }
  ],
  "averageScore": number,
  "academyTopics": ["Lista de componentes a reforzar"]
}

${questionsBlock}
`;

    // 🤖 Llamada a Gemini
    const aiResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" },
    });

    const rawText = aiResponse?.text || aiResponse?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const cleanedText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    let parsed = JSON.parse(cleanedText);

    // 📚 Cruce de datos con la colección de Refacciones (Mejorado)
    const academySuggestions = [];
    const topicsToSearch = parsed.academyTopics || [];

    // Obtenemos las refacciones involucradas en el examen para un cruce más rápido
    const involvedPartNumbers = questions.map(q => q.partNumber);
    
    if (topicsToSearch.length > 0) {
      const partsSnap = await db.collection("partsForDiagnosis")
        .where("partNumber", "in", involvedPartNumbers)
        .get();

      const examParts = partsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      for (const topic of topicsToSearch) {
        const normalizedTopic = topic.toLowerCase();
        
        // Buscamos el match primero por las partes que sabemos que venían en el examen
        const match = examParts.find(p => 
          p.partName.toLowerCase().includes(normalizedTopic) || 
          normalizedTopic.includes(p.partName.toLowerCase())
        );

        if (match && !academySuggestions.some(s => s.partNumber === match.partNumber)) {
          academySuggestions.push({
            id: match.id,
            topic,
            partName: match.partName,
            partNumber: match.partNumber,
            imageUrl: match.imageUrl || null,
            technicalData: match.technicalData || "Ver especificaciones en Academia",
          });
        }
      }
    }

    const finalResult = {
      results: parsed.results,
      averageScore: parsed.averageScore,
      academySuggestions,
    };

    // 💾 Guardado y actualización de progreso
    await evalRef.update({
      status: "done",
      result: finalResult,
      completedAt: FieldValue.serverTimestamp(),
    });

    // Actualizamos el resultado oficial para el Dashboard de la Academia
    await db.collection("examResults").add({
      userId,
      product,
      testId,
      averageScore: parsed.averageScore,
      academySuggestions, // Crucial para el index de la academia
      difficultyReached: Math.max(...questions.map(q => q.difficulty || 1)),
      createdAt: FieldValue.serverTimestamp(),
    });

    return res.status(200).json(finalResult);

  } catch (err) {
    console.error("evaluate-exam error:", err);
    if (evalRef) await evalRef.update({ status: "failed", error: err.message });
    return res.status(500).json({ error: "Error en la evaluación", details: err.message });
  }
}