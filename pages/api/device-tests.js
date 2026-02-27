import { GoogleGenAI } from '@google/genai';
import { db } from '@/lib/firebaseAdmin'; 
import { FieldValue } from "firebase-admin/firestore"; 

// --- CONFIGURACIÓN ---
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const modelName = "gemini-3-flash-preview"; 

const PRODUCT_PREFIXES = {
    "REFRIGERADOR": ["RF", "RT", "RS", "RH"],
    "LAVADORA": ["WA", "WF"],
    "LAVASECADORA": ["WD"],
    "AIRE ACONDICIONADO": ["AR", "AS"],
    "MICROONDAS": ["MG", "MS", "MC"]
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { product, userId } = req.body || {};
    
    if (!product || !userId) {
        return res.status(400).json({ error: 'Datos incompletos.' });
    }

    try {
        const categoryKey = product.toUpperCase();
        const prefixes = PRODUCT_PREFIXES[categoryKey] || [];

        if (prefixes.length === 0) {
            return res.status(400).json({ error: "Categoría no configurada." });
        }

        // 1️⃣ CONSULTA DE PARTES POR PREFIJO
        // Traemos los documentos y filtramos por prefijo de modelo
        const partsSnap = await db.collection("partsForDiagnosis").get();
        let availableParts = [];

        partsSnap.forEach(doc => {
            const data = doc.data();
            const compatibility = Array.isArray(data.modelCompatibility) ? data.modelCompatibility : [];
            
            const isCompatible = compatibility.some(model => {
                const m = model.toUpperCase();
                return prefixes.some(p => m.startsWith(p));
            });

            if (isCompatible) {
                availableParts.push({
                    partName: data.partName,
                    partNumber: data.partNumber,
                    technicalData: data.technicalData || "Verificar manual de servicio"
                });
            }
        });

        if (availableParts.length === 0) {
            return res.status(404).json({ 
                error: "Contenido no disponible", 
                message: `No hay reactivos técnicos para la familia ${categoryKey} (${prefixes.join(", ")}).` 
            });
        }

        // 2️⃣ DETERMINAR NIVEL (HISTORIAL)
        const historySnap = await db.collection("examResults")
            .where("userId", "==", userId)
            .where("product", "==", product)
            .orderBy("createdAt", "desc")
            .limit(1)
            .get();

        const isFirstExam = historySnap.empty;
        let difficultyLevel = 1;
        if (!isFirstExam) {
            const lastData = historySnap.docs[0].data();
            const avg = lastData.averageScore || 0;
            difficultyLevel = avg >= 80 ? Math.min((lastData.difficultyReached || 1) + 1, 5) : (lastData.difficultyReached || 1);
        }

        // 3️⃣ SELECCIÓN DE TEMAS Y PROMPT
        const selectedParts = availableParts.sort(() => 0.5 - Math.random()).slice(0, 5);
        const technicalContext = selectedParts.map(p => 
            `- Parte: ${p.partName} (PN: ${p.partNumber}). Specs: ${p.technicalData}.`
        ).join("\n");

        const prompt = `
            Eres un EVALUADOR TÉCNICO SENIOR de Samsung.
            Genera un examen de 5 preguntas de nivel ${difficultyLevel} para el producto ${product}.

            CONTEXTO TÉCNICO (USA ESTO PARA LAS PREGUNTAS):
            ${technicalContext}

            OBJETIVO:
            Evaluar si el técnico conoce los procedimientos y valores de estos componentes específicos.
            Si hay Ohms o voltajes en el contexto, pregunta por ellos.

            Responde ÚNICAMENTE en formato JSON con esta estructura:
            {
              "questions": [
                {
                  "id": "Q1",
                  "prompt": "Enunciado técnico",
                  "subTopic": "Nombre de la parte",
                  "partNumber": "Número de parte",
                  "difficulty": ${difficultyLevel},
                  "maxPoints": 5
                }
              ]
            }
        `;

        // 4️⃣ LLAMADA A IA (Sintaxis @google/genai)
        const aiResponse = await ai.models.generateContent({
            model: modelName,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json" },
        });

        let rawText = aiResponse?.text || aiResponse?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        rawText = rawText.replace(/```json|```/g, "").trim();
        
        const examData = JSON.parse(rawText);

        // Aseguramos que la data coincida con las partes seleccionadas
        examData.questions = examData.questions.map((q, i) => ({
            ...q,
            difficulty: difficultyLevel,
            maxPoints: 5,
            subTopic: selectedParts[i]?.partName || q.subTopic,
            partNumber: selectedParts[i]?.partNumber || q.partNumber
        }));

        // 5️⃣ GUARDAR EXAMEN PENDIENTE
        const newTestRef = await db.collection("generatedTests").add({
            userId,
            product,
            questions: examData.questions,
            status: "pending",
            createdAt: FieldValue.serverTimestamp(),
            difficultyContext: { level: difficultyLevel }
        });

        return res.status(200).json({
            product,
            questions: examData.questions,
            testId: newTestRef.id,
            difficultyContext: { level: difficultyLevel },
            diagnostic: isFirstExam,
            cached: false
        });

    } catch (err) {
        console.error("device-tests error:", err);
        return res.status(500).json({ error: "Fallo en la generación", details: err.message });
    }
}