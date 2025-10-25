// pages/api/ai-diagnosis.js
import { GoogleGenAI } from '@google/genai';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore'; // Importar addDoc

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const modelName = "gemini-2.5-flash";

/**
 * Normaliza texto: pasa a minúsculas, quita tildes, deja letras/números y espacios.
 * Conservamos espacios para poder hacer split por palabras.
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

/**
 * Busca boletines de servicio aplicables al modelo.
 * @param {string} model - El modelo de equipo a buscar.
 * @returns {Promise<Array<{bulletinName: string, bulletinNumber: string, issueSummary: string}>>}
 */
async function getServiceBulletins(model) {
    if (!db || !model) return [];

    const normalizedModel = String(model).trim().toUpperCase();
    console.log("modelo normalizado para búsqueda de boletines:", normalizedModel);
    

    try {
        const q = query(
            collection(db, "serviceBulletins"),
            // La búsqueda utiliza el operador 'array-contains'
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

//Busca partes compatibles en Firestore basándose en el modelo y evalúa su relevancia según el nombre y la razón proporcionados por la IA.
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
        const q = query(
            collection(db, "partsForDiagnosis"),
            where("modelCompatibility", "array-contains", normalizedModel)
        );

        const snapshot = await getDocs(q);
        const candidates = [];

        snapshot.forEach(doc => {
            const data = doc.data();

            // Normalizar nombre y keywords de BD
            const dbPartNameNormalized = normalizeTextKeepSpaces(data.partName || "");
            const dbPartWords = wordsFrom(dbPartNameNormalized);

            // Keywords (array) o fallback a texto
            let dbKeywords = [];
            if (Array.isArray(data.partFunctionKeywords) && data.partFunctionKeywords.length > 0) {
                dbKeywords = data.partFunctionKeywords.map(k => normalizeTextKeepSpaces(k));
            } else if (data.partFunctionText) {
                dbKeywords = wordsFrom(data.partFunctionText);
            } else if (data.partFunction) {
                dbKeywords = wordsFrom(String(data.partFunction));
            }

            // Scoring:
            // - nameScore: proporción de palabras de iaWords que aparecen en dbPartWords
            // - keywordScore: si alguna keyword aparece en iaReasonNormalized o iaPartNormalized
            let nameMatches = 0;
            for (const w of iaWords) {
                if (w && dbPartWords.includes(w)) nameMatches++;
            }
            const nameScore = iaWords.length ? nameMatches / iaWords.length : 0;

            // También consideramos si dbPartName contiene iaPartNormalized o viceversa (includes) -> boost
            let includeBoost = 0;
            if (dbPartNameNormalized.includes(iaPartNormalized) && iaPartNormalized.length > 2) includeBoost = 0.25;
            if (iaPartNormalized.includes(dbPartNameNormalized) && dbPartNameNormalized.length > 2) includeBoost = 0.25;

            // keywordScore: 1 si alguna keyword aparece en reason o in name, 0 otherwise
            let keywordMatch = false;
            for (const kw of dbKeywords) {
                if (!kw) continue;
                if (iaReasonNormalized.includes(kw) || iaPartNormalized.includes(kw)) {
                    keywordMatch = true;
                    break;
                }
            }
            const keywordScore = keywordMatch ? 0.8 : 0;

            // finalScore combina nameScore (peso 0.6), keywordScore (peso 0.4) y includeBoost
            const finalScore = Math.min(1, (nameScore * 0.6) + (keywordScore * 0.4) + includeBoost);

            // Guardamos candidato solo si hay algo de score (evitar ruido)
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

/**
 * Handler principal
 */
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    // OBTENER NUEVOS CAMPOS: odsNumber y browserDeviceId
    const { productType, model, symptoms, errorCode, odsNumber, browserDeviceId } = req.body || {};

    if (!productType || !model || !symptoms || !odsNumber || !browserDeviceId) {
        return res.status(400).json({ error: 'Tipo de producto, modelo, síntomas, ODS e ID de dispositivo son obligatorios.' });
    }

    const cleanModel = String(model).trim().toUpperCase();
    const cleanOds = odsNumber.trim().toUpperCase();

    // ************ NUEVO: LÍMITE DE CONSULTAS POR DISPOSITIVO ************
    const MAX_QUERIES = 100;
    
    try {
        const qCount = query(
            collection(db, "aiUsage"),
            where("browserDeviceId", "==", browserDeviceId)
        );
        const snapshotCount = await getDocs(qCount);

        if (snapshotCount.size >= MAX_QUERIES) {
            // Error 429 para limitar el acceso
            return res.status(429).json({ 
                mainDiagnosis: `Límite de ${MAX_QUERIES} consultas alcanzado para este dispositivo (${browserDeviceId}). Por favor, usa una ODS o contacta a administración.`,
                error: `Límite de ${MAX_QUERIES} consultas alcanzado.`
            });
        }
    } catch (e) {
        console.error("Error al verificar límite de consultas:", e);
        // Continuar si falla el conteo, pero loguear el error
    }
    // *******************************************************************

    // Contextos por tipo de equipo
    const instructionContext = {
        'Refrigerador': 'Tu diagnóstico debe enfocarse en sistemas No-Frost, sistemas Inverter, sensores de deshielo (Defrost), damper y fallas de fábrica comunes en modelos Samsung.',
        'Aire Acondicionado': 'Tu diagnóstico debe enfocarse en fallas de compresor Inverter, fugas de refrigerante, termistores NTC, y problemas de comunicación entre unidades (Eror E1, E4, etc.).',
        'Horno (Microondas/Eléctrico)': 'Tu diagnóstico debe enfocarse en Magnetrones, tarjetas de control, fusibles, termostatos de seguridad y problemas de alto voltaje.',
        'Lavasecadora': 'Tu diagnóstico debe enfocarse en fallas de motor, rodamientos, sistemas de secado por resistencia/condensación y la PCB principal.',
        'Lavadora': 'Tu diagnóstico debe enfocarse en fallas de motor, rodamientos (baleros), sensores de velocidad (Hall Sensor), fallas de válvulas de agua y problemas de drenaje.',
    };
    const contextNote = instructionContext[productType] || 'Tu diagnóstico debe ser 100% exacto, cubriendo fallas comunes, y evitando errores conceptuales.';

    // Prompt (mantener estrictura JSON en la salida)
    const prompt = `
        **ROL Y CONTEXTO CRÍTICO:**
        Eres un Técnico Nivel 3 de Samsung con 25 años de experiencia, experto en la línea de ${productType}s. ${contextNote} La información que proporcionas es utilizada por técnicos para servicio y por la administración para preparar repuestos.

        **INFORMACIÓN DEL EQUIPO:**
        - Tipo de Equipo: ${productType} Samsung
        - Modelo Analizado: Samsung ${model}
        - Síntomas Reportados: ${symptoms}
        - Código de Error: ${errorCode || 'Ninguno'}
        - ODS de Servicio: ${cleanOds}

        **OBJETIVO:**
        Proporcionar un diagnóstico preciso y estructurado en JSON que sirva tanto a usuarios novatos como a técnicos profesionales y administración de repuestos.

        **REQUISITOS DE LA RESPUESTA JSON:**
        {
          "mainDiagnosis": "Hipótesis de la falla más probable y breve explicación específica para un ${productType}.",
          "commonCauses": ["Lista de 3 a 5 fallas mecánicas o electrónicas más probables y específicas para el tipo de equipo."],
          "beginnerTips": "Consejos claros y seguros para el usuario (Ej: qué revisar antes de llamar a un técnico. Usa saltos de línea \\n).",
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
        const applicableBulletins = await getServiceBulletins(model);
        // Llamada a Gemini
        const response = await ai.models.generateContent({
            model: modelName,
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json" },
        });

        // Normalizar la respuesta JSON (varios formatos posibles)
        let rawJsonText = "";
        if (typeof response?.text === "string" && response.text.trim()) {
            rawJsonText = response.text.trim();
        } else if (response?.candidates && response.candidates[0]?.content) {
            // fallback dependiendo del SDK
            rawJsonText = response.candidates[0].content;
        } else if (response?.output?.[0]?.content?.[0]?.text) {
            rawJsonText = response.output[0].content[0].text;
        } else {
            throw new Error("Respuesta de la IA no tiene texto JSON esperable.");
        }

        // quitar posibles fences ```json ... ```
        rawJsonText = rawJsonText.replace(/^\s*```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

        let diagnosisData;
        try {
            diagnosisData = JSON.parse(rawJsonText);
        } catch (err) {
            console.error("No se pudo parsear JSON de la IA:", err, "RAW:", rawJsonText);
            throw new Error("La IA no devolvió JSON válido.");
        }

        // Procesar partes sugeridas por la IA
        const partsFromIA = Array.isArray(diagnosisData.potentialParts) ? diagnosisData.potentialParts : [];
        const uniquePartsMap = new Map();

        for (const iaPart of partsFromIA) {
            const iaPartName = iaPart.partName || "";
            const iaReason = iaPart.reason || "";
            const uniqueKey = normalizeTextKeepSpaces(iaPartName).replace(/\s+/g, " ");

            // Buscar candidatos en Firebase (ordenados por score)
            const foundParts = await getCompatiblePartsFromFirebase(iaPartName, model, iaReason);

            // Estructura base que siempre devolvemos al frontend
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
                // Primer candidato (mejor puntuado)
                const best = foundParts[0];

                // Determinar si hay "coincidencia fuerte" (name includes IA name words)
                const iaNorm = normalizeTextKeepSpaces(iaPartName);
                const dbNameNorm = normalizeTextKeepSpaces(best.partName || "");
                const iaWords = wordsFrom(iaNorm);
                const dbWords = wordsFrom(dbNameNorm);
                let commonWords = 0;
                for (const w of iaWords) if (dbWords.includes(w)) commonWords++;
                const wordMatchRatio = iaWords.length ? commonWords / iaWords.length : 0;

                const isStrongNameMatch = wordMatchRatio >= 0.5 || dbNameNorm.includes(iaNorm) || iaNorm.includes(dbNameNorm) || best.score >= 0.8;

                if (isStrongNameMatch) {
                    // sobrescribimos con datos de BD (coincidencia fuerte)
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
                    // coincidencia débil -> inyectamos número de parte y función si existe, pero mantenemos nombre original de la IA
                    finalPart = {
                        ...finalPart,
                        partNumber: best.partNumber || finalPart.partNumber,
                        imageUrl: best.imageUrl || null,
                        partFunction: best.partFunction || finalPart.partFunction,
                        foundInDB: !!best.partNumber || !!best.imageUrl || !!best.partFunction,
                        score: best.score,
                    };

                    // Si hay otros candidatos con mejor match de nombre, verificarlos
                    for (let i = 1; i < foundParts.length; i++) {
                        const candidate = foundParts[i];
                        const candNameNorm = normalizeTextKeepSpaces(candidate.partName || "");
                        const candWords = wordsFrom(candNameNorm);
                        let candCommon = 0;
                        for (const w of iaWords) if (candWords.includes(w)) candCommon++;
                        const candRatio = iaWords.length ? candCommon / iaWords.length : 0;
                        if (candRatio > wordMatchRatio && candidate.score >= best.score) {
                            // promote candidate
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

            // Guardar en map por clave única (nombre IA limpio) para evitar duplicados
            uniquePartsMap.set(uniqueKey, finalPart);
        }

        // Reemplazamos potentialParts por la versión enriquecida
        diagnosisData.potentialParts = Array.from(uniquePartsMap.values());

        diagnosisData.serviceBulletins = applicableBulletins;
        
        // ************ NUEVO: REGISTRAR USO EXITOSO ************
        await addDoc(collection(db, "aiUsage"), {
            odsNumber: cleanOds,
            browserDeviceId: browserDeviceId, 
            productType: productType,
            model: cleanModel,
            timestamp: new Date(),
        });
        // ******************************************************


        // Enviar al frontend
        return res.status(200).json(diagnosisData);

    } catch (err) {
        console.error("Error en ai-diagnosis handler:", err);
        
        // Estructura de error para el frontend
        const defaultError = {
            mainDiagnosis: "Fallo interno en el sistema de Diagnóstico Avanzado. Contactar a soporte.",
            commonCauses: ["Verificar conexión de Firebase.", "Revisar logs del servidor."],
            beginnerTips: "Servicio de diagnóstico avanzado no disponible. Intenta más tarde.",
            advancedDiagnosisSteps: ["Verificar la función getCompatiblePartsFromFirebase y sus consultas.", "Asegurar que el modelo retorne JSON válido."],
            potentialParts: [{
                partName: "Fallo de Sistema",
                reason: "Error de conexión o configuración del lado del servidor.",
                isCritical: true,
                partNumber: "SYSTEM-ERR",
                foundInDB: false
            }]
        };
        
        return res.status(500).json(defaultError);
    }
}