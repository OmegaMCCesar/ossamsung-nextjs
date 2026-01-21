// pages/api/bulletins/add.js
import { db } from '@/lib/firebaseAdmin';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido. Solo POST.' });
    }

    const { bulletinName, bulletinNumber, issueSummary, models } = req.body;

    // Validación básica
    if (!bulletinName || !bulletinNumber || !issueSummary || !Array.isArray(models) || models.length === 0) {
        return res.status(400).json({ error: 'Faltan campos requeridos o la lista de modelos está vacía.' });
    }

    try {
        // 1. Opcional: Verificar si el bulletinNumber ya existe (para evitar duplicados)
        const q = query(collection(db, "serviceBulletins"), where("bulletinNumber", "==", bulletinNumber.toUpperCase()));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            return res.status(409).json({ error: `El número de boletín ${bulletinNumber} ya existe.` });
        }

        // 2. Preparar el documento
        const newBulletinDoc = {
            bulletinName: bulletinName.trim(),
            bulletinNumber: bulletinNumber.toUpperCase().trim(),
            issueSummary: issueSummary.trim(),
            // Aseguramos que los modelos estén en mayúsculas y sean únicos
            models: Array.from(new Set(models.map(m => m.toUpperCase().trim()))), 
            createdAt: new Date(),
        };

        // 3. Guardar en Firestore
        await addDoc(collection(db, "serviceBulletins"), newBulletinDoc);

        return res.status(201).json({ success: true, message: 'Boletín guardado.' });

    } catch (error) {
        console.error("Error al guardar el boletín:", error);
        return res.status(500).json({ error: 'Error interno del servidor al procesar la base de datos.' });
    }
}