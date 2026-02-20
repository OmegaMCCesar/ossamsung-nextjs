import { GoogleGenAI, Type } from "@google/genai";
import { db } from "@/lib/firebaseAdmin";
// Importamos FieldValue del Admin SDK para los timestamps
import { FieldValue } from "firebase-admin/firestore"; 

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL_NAME = "gemini-3-flash-preview";

const ATTEMPTS_BY_MODE = { normal: 3, strict: 2, expert: 1 };
const BLOCK_DAYS_BY_MODE = { normal: 7, strict: 14, expert: 30 };
const COOLDOWN_BY_MODE = {
  normal: 1000 * 60 * 60 * 0,
  strict: 1000 * 60 * 60 * 24,
  expert: 1000 * 60 * 60 * 72,
};

const examSchema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Identificador único, ej: Q1, Q2" },
          prompt: { type: Type.STRING, description: "Enunciado del problema técnico" },
          difficulty: { type: Type.NUMBER },
          maxPoints: { type: Type.NUMBER }
        },
        required: ["id", "prompt", "difficulty", "maxPoints"]
      }
    }
  },
  required: ["questions"]
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { product, userId } = req.body || {};

  if (!product || !userId) {
    return res.status(400).json({ error: "product y userId son obligatorios" });
  }

  try {
    // 1️⃣ DETECTAR SI ES PRIMER EXAMEN (SINTAXIS ADMIN SDK)
    const historySnap = await db.collection("examResults")
      .where("userId", "==", userId)
      .where("product", "==", product)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    const isFirstExam = historySnap.empty;

    let difficultyLevel = 1;
    let mode = "normal";

    if (!isFirstExam) {
      const lastResult = historySnap.docs[0].data();
      const avg = lastResult?.averageScore ?? 70;

      if (avg >= 90) { difficultyLevel = 5; mode = "expert"; }
      else if (avg >= 80) { difficultyLevel = 4; mode = "strict"; }
      else if (avg >= 70) { difficultyLevel = 3; mode = "normal"; }
      else if (avg >= 60) { difficultyLevel = 2; mode = "normal"; }
    }

    // 2️⃣ BLOQUEO POR INTENTOS (SINTAXIS ADMIN SDK)
    const attemptsSnap = await db.collection("examAttempts")
      .where("userId", "==", userId)
      .where("product", "==", product)
      .where("difficultyLevel", "==", difficultyLevel)
      .where("mode", "==", mode)
      .get();

    if (!attemptsSnap.empty) {
      const data = attemptsSnap.docs[0].data();
      const blockedUntil = data.blockedUntil?.toDate?.().getTime();

      if (blockedUntil && Date.now() < blockedUntil) {
        return res.status(403).json({
          error: "Nivel bloqueado",
          blockedUntil,
          message: "Has excedido el número de intentos permitidos",
        });
      }
    }

    // 3️⃣ CACHE DE EXAMEN PENDIENTE (SINTAXIS ADMIN SDK)
    const existingSnap = await db.collection("generatedTests")
      .where("userId", "==", userId)
      .where("product", "==", product)
      .where("status", "==", "pending")
      .where("difficultyContext.level", "==", difficultyLevel)
      .where("difficultyContext.mode", "==", mode)
      .get();

    if (!existingSnap.empty) {
      const cachedDoc = existingSnap.docs[0];
      const cached = cachedDoc.data();
      const createdAt = cached.createdAt?.toDate?.().getTime();
      const cooldown = COOLDOWN_BY_MODE[mode] || COOLDOWN_BY_MODE.normal;

      if (createdAt && Date.now() - createdAt < cooldown) {
        return res.status(429).json({
          error: "Cooldown activo",
          retryAfter: Math.ceil((cooldown - (Date.now() - createdAt)) / 1000),
        });
      }

      return res.status(200).json({
        product,
        questions: cached.questions,
        cached: true,
        testId: cachedDoc.id,
        difficultyContext: { level: difficultyLevel, mode },
      });
    }

    // 4️⃣ PROMPT IA BLINDADO
    const prompt = `
Eres un evaluador técnico senior en línea blanca y refrigeración.
Genera EXACTAMENTE 5 preguntas técnicas abiertas para "${product}".
Nivel de Dificultad: ${difficultyLevel}
Modo: ${mode}

Reglas estrictas:
- Casos reales de campo.
- Enfoque en diagnóstico, medición y criterio técnico.
- Nada genérico.
- Asigna a todas las preguntas difficulty=${difficultyLevel} y maxPoints=5.
`;

    const result = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: examSchema,
      },
    });

    let examData;
    try {
      examData = JSON.parse(result.text);
    } catch (e) {
      console.error("Error parseando IA:", result.text);
      return res.status(500).json({ error: "Fallo en la generación IA. Reintenta." });
    }

    examData.questions = examData.questions.map(q => ({
      ...q, difficulty: difficultyLevel, maxPoints: 5,
    }));

    // 5️⃣ REGISTRAR INTENTO (SINTAXIS ADMIN SDK)
    let nextAttempts = 1;
    let blockedUntil = null;

    if (attemptsSnap.empty) {
      if (nextAttempts >= ATTEMPTS_BY_MODE[mode]) {
        blockedUntil = new Date(Date.now() + BLOCK_DAYS_BY_MODE[mode] * 86400000);
      }
      await db.collection("examAttempts").add({
        userId, product, difficultyLevel, mode,
        attempts: nextAttempts, blockedUntil, 
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      const ref = attemptsSnap.docs[0].ref;
      const data = attemptsSnap.docs[0].data();
      nextAttempts = data.attempts + 1;

      if (nextAttempts >= ATTEMPTS_BY_MODE[mode]) {
        blockedUntil = new Date(Date.now() + BLOCK_DAYS_BY_MODE[mode] * 86400000);
      }
      await ref.update({
        attempts: nextAttempts, blockedUntil, 
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // 6️⃣ GUARDAR EXAMEN Y OBTENER SU ID (SINTAXIS ADMIN SDK)
    const newTestRef = await db.collection("generatedTests").add({
      userId,
      product,
      questions: examData.questions,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
      difficultyContext: { level: difficultyLevel, mode },
    });

    // 7️⃣ RESPUESTA
    return res.status(200).json({
      product,
      questions: examData.questions,
      testId: newTestRef.id,
      difficultyContext: { level: difficultyLevel, mode },
      diagnostic: isFirstExam,
      cached: false,
    });

  } catch (error) {
    console.error("device-tests error:", error);
    return res.status(500).json({
      error: "Error generando examen",
      details: error.message,
    });
  }
}