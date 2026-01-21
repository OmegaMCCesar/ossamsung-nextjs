// pages/api/ods/check.js
import { db } from '@/lib/firebaseAdmin';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido. Solo POST.' });
    }
    
    const { odsNumber } = req.body;
    if (!odsNumber) {
        return res.status(400).json({ error: 'ODS es requerida.' });
    }

    const cleanOds = odsNumber.trim().toUpperCase();

    try {
        // Buscamos el último uso registrado para esta ODS
        const q = query(
            collection(db, "aiUsage"), 
            where("odsNumber", "==", cleanOds),
            orderBy("timestamp", "desc"), // El más reciente primero
            limit(1) 
        );

        const snapshot = await getDocs(q);
        
        let isRegistered = !snapshot.empty;
        let latestModel = null;
        let latestProductType = null;
        
        if (isRegistered) {
            const lastDoc = snapshot.docs[0].data();
            latestModel = lastDoc.model;
            latestProductType = lastDoc.productType;
        }

        return res.status(200).json({ 
            isRegistered, 
            latestModel, 
            latestProductType 
        });

    } catch (error) {
        console.error("Error al verificar ODS:", error);
        return res.status(500).json({ error: 'Fallo en la base de datos al verificar la ODS.' });
    }
}