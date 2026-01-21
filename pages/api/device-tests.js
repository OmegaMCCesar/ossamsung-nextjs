import { GoogleGenAI } from "@google/genai";
import { db } from "@/lib/firebaseAdmin";
import {
  addDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL_NAME = "gemini-2.5-flash";

// Intentos por modo
const ATTEMPTS_BY_MODE = {
  normal: 3,
  strict: 2,
  expert: 1,
};

const BLOCK_DAYS_BY_MODE = {
  normal: 7,
  strict: 14,
  expert: 30,
};

const COOLDOWN_BY_MODE = {
  normal: 1000 * 60 * 60 * 0,
  strict: 1000 * 60 * 60 * 24,
  expert: 1000 * 60 * 60 * 72,
};

// ─────────────────────────────────────────────
// HANDLER
// ─────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { product, userId } = req.body || {};

  if (!product || !userId) {
    return res.status(400).json({
      error: "product y userId son obligatorios",
    });
  }

  try {
    // ─────────────────────────────────────────────
    // 1️⃣ DETECTAR SI ES PRIMER EXAMEN (DIAGNÓSTICO)
    // ─────────────────────────────────────────────
    const historyQuery = query(
      collection(db, "examResults"), // ⚠️ colección de resultados evaluados
      where("userId", "==", userId),
      where("product", "==", product)
    );

    const historySnap = await getDocs(historyQuery);
    const isFirstExam = historySnap.empty;

    let difficultyLevel;
    let mode;

    if (isFirstExam) {
      // 🧪 EXAMEN DIAGNÓSTICO
      difficultyLevel = 1;
      mode = "normal";
    } else {
      // 📈 ESCALAMIENTO POR DESEMPEÑO REAL
      const lastResult = historySnap.docs
        .map(d => d.data())
        .sort(
          (a, b) =>
            b.createdAt?.toMillis?.() - a.createdAt?.toMillis?.()
        )[0];

      const avg = lastResult?.averageScore ?? 70;

      if (avg >= 90) {
        difficultyLevel = 5;
        mode = "expert";
      } else if (avg >= 80) {
        difficultyLevel = 4;
        mode = "strict";
      } else if (avg >= 70) {
        difficultyLevel = 3;
        mode = "normal";
      } else if (avg >= 60) {
        difficultyLevel = 2;
        mode = "normal";
      } else {
        difficultyLevel = 1;
        mode = "normal";
      } 
    }

    // ─────────────────────────────────────────────
    // 2️⃣ BLOQUEO POR INTENTOS
    // ─────────────────────────────────────────────
    const attemptsQuery = query(
      collection(db, "examAttempts"),
      where("userId", "==", userId),
      where("product", "==", product),
      where("difficultyLevel", "==", difficultyLevel),
      where("mode", "==", mode)
    );

    const attemptsSnap = await getDocs(attemptsQuery);

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

    // ─────────────────────────────────────────────
    // 3️⃣ CACHE DE EXAMEN PENDIENTE
    // ─────────────────────────────────────────────
    const existingQuery = query(
      collection(db, "generatedTests"),
      where("userId", "==", userId),
      where("product", "==", product),
      where("status", "==", "pending"),
      where("difficultyContext.level", "==", difficultyLevel),
      where("difficultyContext.mode", "==", mode)
    );

    const existingSnap = await getDocs(existingQuery);

    if (!existingSnap.empty) {
      const cached = existingSnap.docs[0].data();
      const createdAt = cached.createdAt?.toDate?.().getTime();
      const cooldown = COOLDOWN_BY_MODE[mode] || COOLDOWN_BY_MODE.normal;

      if (createdAt && Date.now() - createdAt < cooldown) {
        return res.status(429).json({
          error: "Cooldown activo",
          retryAfter: Math.ceil(
            (cooldown - (Date.now() - createdAt)) / 1000
          ),
        });
      }

      return res.status(200).json({
        product,
        questions: cached.questions,
        cached: true,
        difficultyContext: { level: difficultyLevel, mode },
      });
    }

    // ─────────────────────────────────────────────
    // 4️⃣ PROMPT IA
    // ─────────────────────────────────────────────
    const prompt = `
Eres un evaluador técnico senior en línea blanca y refrigeración.

Genera EXACTAMENTE 5 preguntas técnicas abiertas para "${product}".

Nivel: ${difficultyLevel}
Modo: ${mode}

Reglas estrictas:
- SOLO JSON válido
- Casos reales de campo
- Diagnóstico, medición y criterio técnico
- Nada genérico

Formato:
{
  "questions": [
    { "id": "Q1", "prompt": "...", "difficulty": ${difficultyLevel}, "maxPoints": 5 },
    { "id": "Q2", "prompt": "...", "difficulty": ${difficultyLevel}, "maxPoints": 5 },
    { "id": "Q3", "prompt": "...", "difficulty": ${difficultyLevel}, "maxPoints": 5 },
    { "id": "Q4", "prompt": "...", "difficulty": ${difficultyLevel}, "maxPoints": 5 },
    { "id": "Q5", "prompt": "...", "difficulty": ${difficultyLevel}, "maxPoints": 5 }
  ]
}
`;

    const result = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });

    let raw = result.text?.trim();
    raw = raw.replace(/```json|```/g, "");
    const examData = JSON.parse(raw);

    // 🛡️ Blindaje total
    examData.questions = examData.questions.map(q => ({
      ...q,
      difficulty: difficultyLevel,
      maxPoints: 5,
    }));

    // ─────────────────────────────────────────────
    // 5️⃣ REGISTRAR INTENTO
    // ─────────────────────────────────────────────
    if (attemptsSnap.empty) {
      await addDoc(collection(db, "examAttempts"), {
        userId,
        product,
        difficultyLevel,
        mode,
        attempts: 1,
        blockedUntil: null,
        updatedAt: serverTimestamp(),
      });
    } else {
      const ref = attemptsSnap.docs[0].ref;
      const data = attemptsSnap.docs[0].data();
      const nextAttempts = data.attempts + 1;

      let blockedUntil = null;
      if (nextAttempts >= ATTEMPTS_BY_MODE[mode]) {
        blockedUntil = new Date(
          Date.now() + BLOCK_DAYS_BY_MODE[mode] * 86400000
        );
      }

      await updateDoc(ref, {
        attempts: nextAttempts,
        blockedUntil,
        updatedAt: serverTimestamp(),
      });
    }

    // ─────────────────────────────────────────────
    // 6️⃣ GUARDAR EXAMEN
    // ─────────────────────────────────────────────
    await addDoc(collection(db, "generatedTests"), {
      userId,
      product,
      questions: examData.questions,
      status: "pending",
      createdAt: serverTimestamp(),
      difficultyContext: { level: difficultyLevel, mode },
    });

    // ─────────────────────────────────────────────
    // 7️⃣ RESPUESTA
    // ─────────────────────────────────────────────
    return res.status(200).json({
      product,
      questions: examData.questions,
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
