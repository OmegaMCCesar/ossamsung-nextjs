import { GoogleGenAI } from '@google/genai';
import { db } from '@/lib/firebaseAdmin'; // Usamos Admin SDK directamente

// --- CONFIGURACIÓN Y CONSTANTES ---
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const modelName = "gemini-3-flash-preview"; 

const UNLIMITED_ROLES = ['Admin'];
const MAX_QUERIES_PER_DEVICE = 50;
const SCORE_WEIGHTS = {
    NAME: 0.6,
    KEYWORD: 0.4,
    BOOST: 0.25,
};

// --- FUNCIONES DE UTILIDAD ---

function normalizeTextKeepSpaces(text = "") {
    return String(text)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function wordsFrom(text = "") {
    return normalizeTextKeepSpaces(text)
        .split(" ")
        .filter(Boolean);
}

// --- FUNCIONES DE BASE DE DATOS (SINTAXIS ADMIN SDK) ---

async function getServiceBulletins(model) {
    if (!db || !model) return [];
    const normalizedModel = String(model).trim().toUpperCase();
    
    try {
        // Sintaxis Admin: db.collection().where().get()
        const snapshot = await db.collection("serviceBulletins")
            .where("models", "array-contains", normalizedModel)
            .get();

        const bulletins = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            bulletins.push({
                bulletinName: data.bulletinName || 'Sin nombre',
                bulletinNumber: data.bulletinNumber || 'N/A',
                issueSummary: data.issueSummary || 'Sin resumen disponible.',
            });
        });
        return bulletins;
    } catch (err) {
        console.error("Error consultando serviceBulletins:", err);
        return [];
    }
}

async function getCompatiblePartsFromFirebase(partName, model, iaReason) {
    if (!db) return [];

    const normalizedModel = String(model).trim().toUpperCase();
    const iaPartNormalized = normalizeTextKeepSpaces(partName || "");
    const iaReasonNormalized = normalizeTextKeepSpaces(iaReason || "");
    const iaWords = wordsFrom(iaPartNormalized);

    try {
        // 1. Traer partes compatibles con el modelo (Sintaxis Admin)
        const snapshot = await db.collection("partsForDiagnosis")
            .where("modelCompatibility", "array-contains", normalizedModel)
            .get();

        const candidates = [];
        
        // 2. Aplicar Scoring
        snapshot.forEach(doc => {
            const data = doc.data();
            const dbPartNameNormalized = normalizeTextKeepSpaces(data.partName || "");
            const dbPartWords = wordsFrom(dbPartNameNormalized);

            let dbKeywords = [];
            if (Array.isArray(data.partFunctionKeywords) && data.partFunctionKeywords.length > 0) {
                dbKeywords = data.partFunctionKeywords.map(k => normalizeTextKeepSpaces(k));
            } else if (data.partFunctionText) {
                dbKeywords = wordsFrom(data.partFunctionText);
            }

            // Scoring: Coincidencia de nombre
            let nameMatches = 0;
            for (const w of iaWords) {
                if (w && dbPartWords.includes(w)) nameMatches++;
            }
            const nameScore = iaWords.length ? nameMatches / iaWords.length : 0;

            // Scoring: Boost por inclusión directa
            let includeBoost = 0;
            if (dbPartNameNormalized.includes(iaPartNormalized) && iaPartNormalized.length > 2) includeBoost = SCORE_WEIGHTS.BOOST;
            if (iaPartNormalized.includes(dbPartNameNormalized) && dbPartNameNormalized.length > 2) includeBoost = SCORE_WEIGHTS.BOOST;

            // Scoring: Palabras clave (Función/Razón)
            let keywordMatch = false;
            for (const kw of dbKeywords) {
                if (!kw) continue;
                if (iaReasonNormalized.includes(kw) || iaPartNormalized.includes(kw)) {
                    keywordMatch = true;
                    break;
                }
            }
            const keywordScore = keywordMatch ? 0.8 : 0;

            const finalScore = Math.min(1, 
                (nameScore * SCORE_WEIGHTS.NAME) + 
                (keywordScore * SCORE_WEIGHTS.KEYWORD) + 
                includeBoost
            );

            if (finalScore > 0) {
                candidates.push({
                    partName: data.partName || "",
                    partNumber: data.partNumber || null,
                    imageUrl: data.imageUrl || null,
                    partFunction: data.partFunctionText || data.partFunction || null,
                    score: finalScore,
                    docId: doc.id,
                });
            }
        });

        // Ordenar por mejor puntuación
        candidates.sort((a, b) => b.score - a.score);
        return candidates;

    } catch (err) {
        console.error("Error consultando partsForDiagnosis:", err);
        return [];
    }
}

// --- HANDLER PRINCIPAL ---

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { productType, model, symptoms, errorCode, odsNumber, browserDeviceId, userRole, ascId } = req.body || {};
    
    if (!productType || !model || !symptoms || !odsNumber || !browserDeviceId) {
        return res.status(400).json({ error: 'Datos incompletos.' });
    }

    const cleanModel = String(model).trim().toUpperCase();
    const cleanOds = odsNumber.trim().toUpperCase();
    const hasUnlimitedAccess = UNLIMITED_ROLES.includes(userRole);
    const isAnonymous = userRole === 'Anonymous';

    // 2. VERIFICAR LÍMITES (SINTAXIS ADMIN SDK)
    if (!hasUnlimitedAccess) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0); 
            
            // Sintaxis Admin
            const snapshotCount = await db.collection("aiUsage")
                .where("browserDeviceId", "==", browserDeviceId)
                .where("timestamp", ">=", today)
                .get();

            if (snapshotCount.size >= MAX_QUERIES_PER_DEVICE) {
                return res.status(429).json({ 
                    mainDiagnosis: `Límite diario alcanzado (${MAX_QUERIES_PER_DEVICE}).`,
                    error: "Límite diario excedido."
                });
            }
        } catch (e) {
            console.error("Error límite:", e);
        }
    }

    // 3. PROMPT Y CONTEXTO
    const instructionContext = {
        'Refrigerador': 'Enfócate en sistemas No-Frost, Inverter, sensores de deshielo y damper.',
        'Aire Acondicionado': 'Enfócate en compresor Inverter, fugas, termistores y códigos de comunicación.',
        'Pantalla': 'Enfocate en partes remplazables como main, panel(incluye display y leds), bocinas , modulo wifi, las prueban deben de ser solo de verificacion de funcionamiento correcto de estas partes, no repar partes '
    };
    const contextNote = instructionContext[productType] || 'Diagnóstico técnico preciso.';
    
    const roleContext = isAnonymous ? 
        'Asistente BÁSICO para usuario final. Respuestas cortas y sencillas.' :
        `Técnico Nivel 3 Samsung Experto en ${productType}. ${contextNote} Información para técnicos.`;

    const prompt = `
        **ROL:** ${roleContext}
        
        **INFORMACIÓN DEL EQUIPO:**
        - Producto: ${productType} Samsung
        - Modelo: ${model}
        - Síntomas: ${symptoms}
        - Código de Error: ${errorCode || 'Ninguno'}

        **REGLAS DE SEGURIDAD TÉCNICA (CRÍTICO - NO ALUCINAR DATOS):**
        1. **PROHIBIDO INVENTAR VALORES:** No proporciones valores específicos de resistencia (Ohmios), capacitancia o presiones a menos que sean estándares universales (ej: 120V/220V AC). 
        2. **PROCEDIMIENTO > VALOR:** En lugar de decir "Debe medir 3.5kΩ", di: "Verificar valor resistivo según hoja técnica" o "Comprobar continuidad".
        3. **NO ASUMIR:** Si no estás 100% seguro del valor exacto para este modelo específico "${model}", indica al técnico que consulte el diagrama eléctrico ("PCB Layout") o el "Fast Track Troubleshooting".
        4. **ENFOQUE:** Céntrate en la lógica de diagnóstico (qué probar y en qué orden), no en los datos de ingeniería específicos.

        **OBJETIVO:**
        Generar un diagnóstico técnico seguro y profesional en formato JSON.

        Responde SOLO JSON válido con esta estructura:
        {
          "mainDiagnosis": "Hipótesis técnica breve (Máx 2 frases).",
          "beginnerTips": "Consejos de seguridad básicos y validaciones visuales para el cliente (usa \\n para saltos).",
          "commonCauses": ["Causa técnica 1", "Causa técnica 2"],
          "advancedDiagnosisSteps": [
            "Paso 1: Acción concreta (Ej: Verificar voltaje de entrada en válvula).",
            "Paso 2: Acción concreta (Ej: Medir continuidad en bobina, consultar manual para valor exacto)."
          ],
          "potentialParts": [
            { "partName": "Nombre Técnico de la Parte", "reason": "Justificación breve del fallo", "isCritical": boolean }
          ]
        }
        
        Nota: Si el usuario es anónimo, devuelve arrays vacíos en commonCauses, advancedDiagnosisSteps y potentialParts.
    `;

    try {
        // 4. EJECUCIÓN PARALELA (Boletines + IA)
        const [applicableBulletins, aiResponse] = await Promise.all([
            getServiceBulletins(model), 
            ai.models.generateContent({
                model: modelName,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: { responseMimeType: "application/json" },
            })
        ]);
        
        let rawJsonText = aiResponse?.text || aiResponse?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        rawJsonText = rawJsonText.replace(/```json|```/g, "").trim();

        let diagnosisData;
        try {
             diagnosisData = JSON.parse(rawJsonText);
        } catch (e) {
             console.error("Error parseando JSON de IA", rawJsonText);
             throw new Error("La IA no devolvió un JSON válido");
        }
        
        // 5. ENRIQUECIMIENTO DE PARTES (Solo si no es anónimo)
        if (!isAnonymous && Array.isArray(diagnosisData.potentialParts)) {
            const enrichedParts = [];
            for (const iaPart of diagnosisData.potentialParts) {
                // Buscamos en Firebase con el algoritmo de scoring
                const candidates = await getCompatiblePartsFromFirebase(iaPart.partName, model, iaPart.reason);
                
                if (candidates.length > 0) {
                    const best = candidates[0];
                    enrichedParts.push({
                        ...iaPart,
                        partName: best.partName, 
                        partNumber: best.partNumber,
                        imageUrl: best.imageUrl,
                        partFunction: best.partFunction,
                        foundInDB: true
                    });
                } else {
                    enrichedParts.push({ ...iaPart, foundInDB: false, partNumber: "NO DISPONIBLE" });
                }
            }
            diagnosisData.potentialParts = enrichedParts;
        } else if (isAnonymous) {
            diagnosisData.potentialParts = [];
            diagnosisData.advancedDiagnosisSteps = [];
            diagnosisData.commonCauses = [];
        }

        // 6. GUARDAR Y RESPONDER (SINTAXIS ADMIN SDK)
        diagnosisData.serviceBulletins = applicableBulletins;
        
        await db.collection("aiUsage").add({
            odsNumber: cleanOds,
            browserDeviceId, 
            productType,
            model: cleanModel,
            userRole, 
            timestamp: new Date(),
        });

        return res.status(200).json(diagnosisData);

    } catch (err) {
        console.error("Error handler:", err);
        return res.status(500).json({
            mainDiagnosis: "Error interno del sistema.",
            beginnerTips: "Intenta más tarde.",
            commonCauses: [], advancedDiagnosisSteps: [], potentialParts: []
        });
    }
}