
// pages/api/ai-diagnosis.js
import { GoogleGenAI } from '@google/genai';
import { db } from '@/lib/firebaseAdmin';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore'; 

// --- CONFIGURACIÓN Y CONSTANTES ---
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const modelName = "gemini-2.5-flash"; // Usaremos la versión más reciente por defecto

const UNLIMITED_ROLES = ['Admin'];
const MAX_QUERIES_PER_DEVICE = 50; 
const SCORE_WEIGHTS = {
    NAME: 0.6,
    KEYWORD: 0.4,
    BOOST: 0.25,
};

// --- FUNCIONES DE UTILIDAD ---

/**
 * Normaliza texto: pasa a minúsculas, quita tildes, deja letras/números y espacios.
 */
function normalizeTextKeepSpaces(text = "") {
    return String(text)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // quitar acentos
        .replace(/[^a-z0-9\s]/g, "") // conservar letras, números y espacios
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Convierte texto en array de palabras únicas (sin vacíos)
 */
function wordsFrom(text = "") {
    return normalizeTextKeepSpaces(text)
        .split(" ")
        .filter(Boolean);
}

// --- FUNCIONES DE BASE DE DATOS ---

/**
 * Busca boletines de servicio aplicables al modelo.
 * @param {string} model - El modelo de equipo a buscar.
 * @returns {Promise<Array<{bulletinName: string, bulletinNumber: string, issueSummary: string}>>}
 */
async function getServiceBulletins(model) {
    if (!db || !model) return [];

    const normalizedModel = String(model).trim().toUpperCase();
    
    try {
        const q = query(
            collection(db, "serviceBulletins"),
            where("models", "array-contains", normalizedModel)
        );

        const snapshot = await getDocs(q);
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
        console.error("Error consultando serviceBulletins en Firebase:", err);
        return [];
    }
}

/**
 * Buscar partes en Firestore que sean compatibles con el modelo (array-contains).
 * Retorna lista de objetos { docId?, partName, partNumber, imageUrl, partFunction, score } ordenada por score desc.
 */
async function getCompatiblePartsFromFirebase(partName, model, iaReason) {
    if (!db) return [];

    const normalizedModel = String(model).trim().toUpperCase();
    const iaPartNormalized = normalizeTextKeepSpaces(partName || "");
    const iaReasonNormalized = normalizeTextKeepSpaces(iaReason || "");
    const iaWords = wordsFrom(iaPartNormalized);

    try {
        // 1. Obtener todas las partes compatibles con el modelo
        const q = query(
            collection(db, "partsForDiagnosis"),
            where("modelCompatibility", "array-contains", normalizedModel)
        );

        const snapshot = await getDocs(q);
        const candidates = [];
        
        // 2. Aplicar el Scoring
        snapshot.forEach(doc => {
            const data = doc.data();
            
            const dbPartNameNormalized = normalizeTextKeepSpaces(data.partName || "");
            const dbPartWords = wordsFrom(dbPartNameNormalized);

            let dbKeywords = [];
            if (Array.isArray(data.partFunctionKeywords) && data.partFunctionKeywords.length > 0) {
                dbKeywords = data.partFunctionKeywords.map(k => normalizeTextKeepSpaces(k));
            } else if (data.partFunctionText) {
                dbKeywords = wordsFrom(data.partFunctionText);
            } else if (data.partFunction) {
                dbKeywords = wordsFrom(String(data.partFunction));
            }

            // Scoring: nameScore
            let nameMatches = 0;
            for (const w of iaWords) {
                if (w && dbPartWords.includes(w)) nameMatches++;
            }
            const nameScore = iaWords.length ? nameMatches / iaWords.length : 0;

            // Scoring: includeBoost
            let includeBoost = 0;
            if (dbPartNameNormalized.includes(iaPartNormalized) && iaPartNormalized.length > 2) includeBoost = SCORE_WEIGHTS.BOOST;
            if (iaPartNormalized.includes(dbPartNameNormalized) && dbPartNameNormalized.length > 2) includeBoost = SCORE_WEIGHTS.BOOST;

            // Scoring: keywordScore
            let keywordMatch = false;
            for (const kw of dbKeywords) {
                if (!kw) continue;
                if (iaReasonNormalized.includes(kw) || iaPartNormalized.includes(kw)) {
                    keywordMatch = true;
                    break;
                }
            }
            const keywordScore = keywordMatch ? 0.8 : 0; // Se mantiene 0.8 de match exacto

            // finalScore combina
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
                    rawKeywords: dbKeywords,
                    docId: doc.id,
                });
            }
        });

        // Ordenar por score descendente
        candidates.sort((a, b) => b.score - a.score);

        return candidates;

    } catch (err) {
        console.error("Error consultando partsForDiagnosis en Firebase:", err);
        return [];
    }
}

// --- HANDLER PRINCIPAL ---

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    // 1. OBTENER Y VALIDAR CAMPOS
    const { productType, model, symptoms, errorCode, odsNumber, browserDeviceId, userRole, ascId } = req.body || {};
    
    if (!productType || !model || !symptoms || !odsNumber || !browserDeviceId) {
        return res.status(400).json({ error: 'Tipo de producto, modelo, síntomas, ODS e ID de dispositivo son obligatorios.' });
    }

    const cleanModel = String(model).trim().toUpperCase();
    const cleanOds = odsNumber.trim().toUpperCase();
    const cleanAscId = ascId ? String(ascId).trim().toUpperCase() : null; 
    
    const hasUnlimitedAccess = UNLIMITED_ROLES.includes(userRole);
    const isAnonymous = userRole === 'Anonymous';


    // 2. LÓGICA DE LÍMITE DE CONSULTAS POR ROL 
    if (!hasUnlimitedAccess) {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0); 

            const qCount = query(
                collection(db, "aiUsage"),
                where("browserDeviceId", "==", browserDeviceId),
                where("timestamp", ">=", today) 
            );
            const snapshotCount = await getDocs(qCount);

            if (snapshotCount.size >= MAX_QUERIES_PER_DEVICE) {
                return res.status(429).json({ 
                    mainDiagnosis: `Límite de ${MAX_QUERIES_PER_DEVICE} consultas diarias alcanzado para tu dispositivo. Inicia sesión o contacta a administración.`,
                    error: `Límite de ${MAX_QUERIES_PER_DEVICE} consultas diarias alcanzado.`
                });
            }
        } catch (e) {
            console.error("Error al verificar límite de consultas por rol:", e);
        }
    }

    // 3. CONSTRUCCIÓN DEL PROMPT Y CONTEXTO
    const instructionContext = {
        'Refrigerador': 'Tu diagnóstico debe enfocarse en sistemas No-Frost, sistemas Inverter, sensores de deshielo (Defrost), damper y fallas de fábrica comunes en modelos Samsung.',
        'Aire Acondicionado': 'Tu diagnóstico debe enfocarse en fallas de compresor Inverter, fugas de refrigerante, termistores NTC, y problemas de comunicación entre unidades (Eror E1, E4, etc.).',
        'Horno (Microondas/Eléctrico)': 'Tu diagnóstico debe enfocarse en Magnetrones, tarjetas de control, fusibles, termostatos de seguridad y problemas de alto voltaje.',
        'Lavasecadora': 'Tu diagnóstico debe enfocarse en fallas de motor, rodamientos, sistemas de secado por resistencia/condensación y la PCB principal.',
        'Lavadora': 'Tu diagnóstico debe enfocarse en fallas de motor, rodamientos (baleros), sensores de velocidad (Hall Sensor), fallas de válvulas de agua y problemas de drenaje.',
    };
    const contextNote = instructionContext[productType] || 'Tu diagnóstico debe ser 100% exacto, cubriendo fallas comunes, y evitando errores conceptuales.';
    
    const roleContext = isAnonymous ? 
        'Eres un asistente de diagnóstico BÁSICO, tu objetivo es dar una hipótesis y consejos de fácil seguimiento para el usuario final (no técnico).' :
        `Eres un Técnico Nivel 3 de Samsung con 25 años de experiencia, experto en la línea de ${productType}s. ${contextNote} La información que proporcionas es utilizada por técnicos para servicio y por la administración para preparar repuestos.`;

    // El prompt pide todos los campos, pero se le instruye dejarlos vacíos si es anónimo.
    const prompt = `
        **ROL Y CONTEXTO CRÍTICO:**
        ${roleContext}

        **INFORMACIÓN DEL EQUIPO:**
        - Tipo de Equipo: ${productType} Samsung
        - Modelo Analizado: Samsung ${model}
        - Síntomas Reportados: ${symptoms}
        - Código de Error: ${errorCode || 'Ninguno'}
        - ODS de Servicio: ${cleanOds}

        **OBJETIVO:**
        Proporcionar un diagnóstico preciso y estructurado en JSON.

        **REQUISITOS DE LA RESPUESTA JSON:**
        Proporciona un diagnóstico en el formato JSON EXACTO, sin texto adicional, sin excepción.
        Si el usuario es anónimo o básico, los campos 'commonCauses', 'advancedDiagnosisSteps', y 'potentialParts' **deben ser arrays vacíos ([])**.

        {
          "mainDiagnosis": "Hipótesis de la falla más probable y breve explicación específica para un ${productType}.",
          "beginnerTips": "Consejos claros y seguros para el usuario (Ej: qué revisar antes de llamar a un técnico. Usa saltos de línea \\n).",
          "commonCauses": ["Lista de 3 a 5 fallas mecánicas o electrónicas más probables y específicas para el tipo de equipo."],
          "advancedDiagnosisSteps": ["Paso 1: Instrucción precisa de verificación para el técnico."],
          "potentialParts": [
            {
              "partName": "Nombre del Componente",
              "reason": "Razón específica por la que se sospecha de esta pieza.",
              "isCritical": true
            }
          ]
        }
    `;

    try {
        // 4. EJECUCIÓN PARALELA DE CONSULTAS (Optimización)
        const [applicableBulletins, aiResponse] = await Promise.all([
            getServiceBulletins(model), 
            ai.models.generateContent({
                model: modelName,
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: { responseMimeType: "application/json" },
            })
        ]);
        
        // 5. POST-PROCESO Y ENRIQUECIMIENTO
        let rawJsonText = aiResponse?.text || aiResponse?.candidates?.[0]?.content || "";

        if (!rawJsonText) {
            throw new Error("Respuesta de la IA no tiene texto JSON esperable.");
        }

        // Limpiar fences ```json ... ```
        rawJsonText = rawJsonText.replace(/^\s*```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

        let diagnosisData;
        try {
            diagnosisData = JSON.parse(rawJsonText);
        } catch (err) {
            console.error("No se pudo parsear JSON de la IA:", err, "RAW:", rawJsonText);
            throw new Error("La IA no devolvió JSON válido.");
        }
        
        // El proceso de enriquecimiento de partes SÓLO se ejecuta si NO es anónimo
        if (!isAnonymous) {
            const partsFromIA = Array.isArray(diagnosisData.potentialParts) ? diagnosisData.potentialParts : [];
            const uniquePartsMap = new Map();

            for (const iaPart of partsFromIA) {
                const iaPartName = iaPart.partName || "";
                const iaReason = iaPart.reason || "";
                const uniqueKey = normalizeTextKeepSpaces(iaPartName).replace(/\s+/g, " ");

                const foundParts = await getCompatiblePartsFromFirebase(iaPartName, model, iaReason);

                let finalPart = {
                    partName: iaPartName,
                    reason: iaReason,
                    isCritical: !!iaPart.isCritical,
                    partNumber: "SIN INF. DE LA PARTE",
                    imageUrl: null,
                    partFunction: null,
                    foundInDB: false,
                    score: 0,
                };

                if (foundParts.length > 0) {
                    const best = foundParts[0];

                    const iaNorm = normalizeTextKeepSpaces(iaPartName);
                    const dbNameNorm = normalizeTextKeepSpaces(best.partName || "");
                    const iaWords = wordsFrom(iaNorm);
                    const dbWords = wordsFrom(dbNameNorm);
                    let commonWords = 0;
                    for (const w of iaWords) if (dbWords.includes(w)) commonWords++;
                    const wordMatchRatio = iaWords.length ? commonWords / iaWords.length : 0;

                    // Coincidencia fuerte
                    const isStrongNameMatch = wordMatchRatio >= 0.5 || dbNameNorm.includes(iaNorm) || iaNorm.includes(dbNameNorm) || best.score >= 0.8;

                    if (isStrongNameMatch) {
                        finalPart = {
                            ...finalPart,
                            partName: best.partName || finalPart.partName,
                            partNumber: best.partNumber || finalPart.partNumber,
                            imageUrl: best.imageUrl || null,
                            partFunction: best.partFunction || null,
                            foundInDB: true,
                            score: best.score,
                        };
                    } else {
                        // Coincidencia débil: inyectamos datos de parte, pero mantenemos nombre original de la IA
                        finalPart = {
                            ...finalPart,
                            partNumber: best.partNumber || finalPart.partNumber,
                            imageUrl: best.imageUrl || finalPart.imageUrl,
                            partFunction: best.partFunction || finalPart.partFunction,
                            foundInDB: !!best.partNumber || !!best.imageUrl || !!best.partFunction,
                            score: best.score,
                        };
                        // Lógica de promoción de candidato si hay mejor match de nombre
                        for (let i = 1; i < foundParts.length; i++) {
                            const candidate = foundParts[i];
                            const candNameNorm = normalizeTextKeepSpaces(candidate.partName || "");
                            const candWords = wordsFrom(candNameNorm);
                            let candCommon = 0;
                            for (const w of iaWords) if (candWords.includes(w)) candCommon++;
                            const candRatio = iaWords.length ? candCommon / iaWords.length : 0;
                            if (candRatio > wordMatchRatio && candidate.score >= best.score) {
                                finalPart = {
                                    ...finalPart,
                                    partName: candidate.partName,
                                    partNumber: candidate.partNumber || finalPart.partNumber,
                                    imageUrl: candidate.imageUrl || finalPart.imageUrl,
                                    partFunction: candidate.partFunction || finalPart.partFunction,
                                    foundInDB: true,
                                    score: candidate.score,
                                };
                                break;
                            }
                        }
                    }
                }
                uniquePartsMap.set(uniqueKey, finalPart);
            }
            diagnosisData.potentialParts = Array.from(uniquePartsMap.values());
        } // Fin del bloque ELSE (no anónimo)


        // 6. FINALIZAR RESPUESTA Y REGISTRO
        diagnosisData.serviceBulletins = applicableBulletins;
        
        await addDoc(collection(db, "aiUsage"), {
            odsNumber: cleanOds,
            browserDeviceId: browserDeviceId, 
            productType: productType,
            model: cleanModel,
            userRole: userRole, 
            ascId: cleanAscId, 
            timestamp: new Date(),
        });

        return res.status(200).json(diagnosisData);

    } catch (err) {
        console.error("Error en ai-diagnosis handler:", err);
        
        const defaultError = {
            mainDiagnosis: "Fallo interno en el sistema de Diagnóstico. Contactar a soporte.",
            commonCauses: [],
            beginnerTips: "Servicio de diagnóstico no disponible. Intenta más tarde.",
            advancedDiagnosisSteps: [],
            potentialParts: []
        };
        
        return res.status(500).json(defaultError);
    }
}