// pages/api/stats/dashboard.js
import { db } from '../../../lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método no permitido. Solo GET.' });
    }

    try {
        // --- 1. Obtener todos los usos para conteo de volumen ---
        const usageSnapshot = await getDocs(collection(db, "aiUsage"));
        const totalDiagnoses = usageSnapshot.size;
        
        // --- 2. Obtener todo el feedback para la precisión ---
        const feedbackSnapshot = await getDocs(collection(db, "aiFeedback"));
        const totalFeedback = feedbackSnapshot.size;

        // Estructuras para agregación
        let feedbackDistribution = { correcta: 0, cerca: 0, incorrecta: 0 };
        let usageByProductType = {};
        
        // --- 3. Procesar datos para agregaciones (temporalmente en el servidor) ---
        
        // Procesar Usos
        usageSnapshot.forEach(doc => {
            const data = doc.data();
            const type = data.productType || 'Desconocido';
            usageByProductType[type] = (usageByProductType[type] || 0) + 1;
        });

        // Procesar Feedback
        feedbackSnapshot.forEach(doc => {
            const data = doc.data();
            const rating = data.rating;
            if (rating in feedbackDistribution) {
                feedbackDistribution[rating]++;
            }
        });

        // --- 4. Calcular Métricas de Precisión ---
        const totalRated = feedbackDistribution.correcta + feedbackDistribution.cerca + feedbackDistribution.incorrecta;
        const accuracyRate = totalRated > 0 ? 
            ((feedbackDistribution.correcta + feedbackDistribution.cerca) / totalRated) * 100 
            : 0;

        
        return res.status(200).json({
            totalDiagnoses,
            totalFeedback,
            accuracyRate: parseFloat(accuracyRate.toFixed(2)),
            feedbackDistribution,
            usageByProductType
        });

    } catch (error) {
        console.error("Error al obtener las estadísticas del dashboard:", error);
        // Devolver una respuesta estructurada incluso en caso de error
        return res.status(500).json({ 
            error: 'Error al consultar la base de datos para el dashboard.',
            totalDiagnoses: 0,
            totalFeedback: 0,
            accuracyRate: 0,
            feedbackDistribution: { correcta: 0, cerca: 0, incorrecta: 0 },
            usageByProductType: {}
        });
    }
}