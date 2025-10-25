// pages/api/feedback/submit.js
import { db } from '../../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido. Solo POST.' });
    }

    // Se espera recibir la ODS del frontend para asociar el feedback
    const { rating, comment, originalQuery, odsNumber } = req.body; 

    if (!rating || !originalQuery || !odsNumber) {
        return res.status(400).json({ error: 'Datos de feedback incompletos. Se requiere calificación, consulta original y ODS.' });
    }
    
    const cleanOds = odsNumber.trim().toUpperCase();

    try {
        await addDoc(collection(db, "aiFeedback"), {
            rating, // 'correcta', 'cerca', 'incorrecta'
            comment: comment || null,
            originalQuery, // El payload de modelo/síntomas que se envió a la IA
            odsNumber: cleanOds, // Identificador clave para el feedback
            timestamp: new Date(),
        });

        return res.status(201).json({ success: true, message: 'Feedback registrado exitosamente.' });
    } catch (error) {
        console.error("Error al registrar el feedback:", error);
        return res.status(500).json({ error: 'Error del servidor al guardar el feedback.' });
    }
}