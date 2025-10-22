// pages/api/ai-diagnosis.js
// Para Next.js con Pages Router
// Requiere: npm install @google/genai y la clave GEMINI_API_KEY en .env.local

import { GoogleGenAI } from '@google/genai';

// Inicializa el cliente con la clave de API desde las variables de entorno
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); 

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // AHORA RECIBIMOS EL CAMPO 'productType' DEL FRONTEND
    const { productType, model, symptoms, errorCode } = req.body; 

    if (!productType || !model || !symptoms) {
        return res.status(400).json({ error: 'Tipo de producto, modelo y síntomas son obligatorios.' });
    }

    // --- CONTEXTOS ESPECÍFICOS PARA LA IA ---
    const instructionContext = {
        'Refrigerador': 'Tu diagnóstico debe enfocarse en sistemas No-Frost, sistemas Inverter, sensores de deshielo (Defrost), damper y fallas de fábrica comunes en modelos Samsung.',
        'Aire Acondicionado': 'Tu diagnóstico debe enfocarse en fallas de compresor Inverter, fugas de refrigerante, termistores NTC, y problemas de comunicación entre unidades (Eror E1, E4, etc.).',
        'Horno (Microondas/Eléctrico)': 'Tu diagnóstico debe enfocarse en Magnetrones, tarjetas de control, fusibles, termostatos de seguridad y problemas de alto voltaje.',
        'Lavasecadora': 'Tu diagnóstico debe enfocarse en fallas de motor, rodamientos, sistemas de secado por resistencia/condensación y la PCB principal.',
        'Lavadora': 'Tu diagnóstico debe enfocarse en fallas de motor, rodamientos (baleros), sensores de velocidad (Hall Sensor), fallas de válvulas de agua y problemas de drenaje.',
    };

    const contextNote = instructionContext[productType] || 'Tu diagnóstico debe ser 100% exacto, cubriendo fallas comunes, y evitando errores conceptuales.';

    // --- PROMPT DINÁMICO Y AVANZADO ---
    const prompt = `
    **ROL Y CONTEXTO CRÍTICO:**
    Eres un Técnico Nivel 3 de Samsung con 25 años de experiencia, experto en la línea de ${productType}s. ${contextNote} La información que proporcionas es utilizada por técnicos para servicio y por la administración para preparar repuestos.

    **INFORMACIÓN DEL EQUIPO:**
    - Tipo de Equipo: ${productType} Samsung
    - Modelo Analizado: Samsung ${model}
    - Síntomas Reportados: ${symptoms}
    - Código de Error: ${errorCode || 'Ninguno'}

    **OBJETIVO:**
    Proporcionar un diagnóstico preciso y estructurado en JSON que sirva tanto a usuarios novatos como a técnicos profesionales y administración de repuestos.

    **REQUISITOS DE LA RESPUESTA JSON (ESTRUCTURA AVANZADA):**
    El objeto JSON DEBE cumplir rigurosamente con el siguiente esquema y debe ser la ÚNICA respuesta (sin código markdown ni preámbulos). Los campos deben ser específicos para un equipo **${productType}**.

    {
        "mainDiagnosis": "Hipótesis de la falla más probable y breve explicación específica para un ${productType}.",
        "commonCauses": [
            "Lista de 3 a 5 fallas mecánicas o electrónicas más probables y específicas para el tipo de equipo.",
            // ... otros elementos
        ],
        "beginnerTips": "Consejos claros y seguros para el usuario (Ej: qué revisar antes de llamar a un técnico. Usa saltos de línea \\n).",
        "advancedDiagnosisSteps": [
            "Paso 1: Instrucción precisa de verificación para el técnico (Ej: 'Medir la resistencia del motor.').",
            "Paso 2: Acciones específicas a tomar o valores a esperar.",
            // ... otros pasos
        ],
        "potentialParts": [
            {
                "partName": "Nombre del Componente (Ej: Main PCB, Válvula de Agua Fría, Compresor Inverter)",
                "reason": "Razón específica por la que se sospecha de esta pieza en este tipo de equipo y falla.",
                "isCritical": true
            },
            // ... otros repuestos posibles
        ]
    }

    Tu respuesta DEBE ser solo el objeto JSON, sin preámbulos, código markdown o texto adicional.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", 
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                // El esquema de respuesta se ajusta a la nueva estructura.
                responseSchema: {
                    type: "object",
                    properties: {
                        mainDiagnosis: { type: "string" },
                        commonCauses: { type: "array", items: { type: "string" } },
                        beginnerTips: { type: "string" },
                        advancedDiagnosisSteps: { type: "array", items: { type: "string" } }, // Nuevo
                        potentialParts: { 
                            type: "array", 
                            items: {
                                type: "object",
                                properties: {
                                    partName: { type: "string" },
                                    reason: { type: "string" },
                                    isCritical: { type: "boolean" }
                                },
                                required: ["partName", "reason", "isCritical"],
                            }
                        }, // Nuevo
                    },
                    required: ["mainDiagnosis", "commonCauses", "beginnerTips", "advancedDiagnosisSteps", "potentialParts"],
                },
            },
        });

        // La respuesta ya viene como un string JSON que necesita ser parseado.
        const jsonText = response.text.trim();
        const diagnosisData = JSON.parse(jsonText);

        res.status(200).json(diagnosisData);

    } catch (error) {
        console.error('Error al llamar a la API de IA:', error);
        res.status(500).json({ 
            mainDiagnosis: "Fallo interno en el sistema de Diagnóstico Avanzado.", 
            commonCauses: ["Verificar logs del servidor.", "Confirmar que la clave GEMINI_API_KEY es válida.", "Revisar la conexión a Internet."],
            beginnerTips: "Lo sentimos, el servicio de diagnóstico avanzado no está disponible. Por favor, inténtalo más tarde.",
            advancedDiagnosisSteps: ["Verificar que el SDK '@google/genai' esté instalado y actualizado.", "Revisar la configuración de `responseSchema` en la llamada a la API de Gemini."],
            potentialParts: [{ partName: "Fallo de Sistema", reason: "Error de conexión o configuración del lado del servidor.", isCritical: true }]
        });
    }
}