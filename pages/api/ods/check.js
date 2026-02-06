// pages/api/ods/check.js
import { db }from '@/lib/firebaseAdmin';

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
        const snapshot = await db
            .collection('aiUsage')
            .where('odsNumber', '==', cleanOds)
            .limit(1)
            .get();

        const isRegistered = !snapshot.empty;
        let latestModel = null;
        let latestProductType = null;

        if (isRegistered) {
            const docData = snapshot.docs[0].data();
            latestModel = docData.model || null;
            latestProductType = docData.productType || null;
        }

        return res.status(200).json({ isRegistered, latestModel, latestProductType });

    } catch (error) {
        console.error("Error al verificar ODS:", error);
        return res.status(500).json({ error: 'Fallo en la base de datos al verificar la ODS.' });
    }
}
