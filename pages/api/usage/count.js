// pages/api/usage/count.js
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido.' });
    }
    
    const { browserDeviceId } = req.body;
    
    if (!browserDeviceId) {
        return res.status(400).json({ error: 'Device ID es obligatorio.' });
    }

    try {
        const q = query(
            collection(db, "aiUsage"),
            where("browserDeviceId", "==", browserDeviceId)
        );
        const snapshot = await getDocs(q);
        
        const currentCount = snapshot.size;
        const MAX_QUERIES = 50; // Debe coincidir con ai-diagnosis.js

        return res.status(200).json({ 
            currentCount,
            remaining: MAX_QUERIES - currentCount,
            limit: MAX_QUERIES 
        });

    } catch (error) {
        console.error("Error al obtener el conteo de uso:", error);
        return res.status(500).json({ 
            error: 'No se pudo obtener el conteo de uso.',
            currentCount: 0, // Fallback
            remaining: 100 
        });
    }
}