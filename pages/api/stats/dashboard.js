// pages/api/stats/dashboard.js
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

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
        // NUEVAS ESTRUCTURAS PARA ASC Y ANÓNIMOS
        let usageByASC = {};
        let anonymousUsageCount = 0;
        
        // --- 3. Procesar datos para agregaciones ---
        
        // Procesar Usos (Incluyendo ASC y Anónimos)
        usageSnapshot.forEach(doc => {
            const data = doc.data();
            const type = data.productType || 'Desconocido';
            const ascId = data.ascId || null; // Campo que identifica el Centro de Servicio

            // Conteo por Tipo de Producto
            usageByProductType[type] = (usageByProductType[type] || 0) + 1;

            // Conteo por ASC y Anónimos
            if (ascId) {
                // Si tiene ascId, es uso logueado (por centro)
                usageByASC[ascId] = (usageByASC[ascId] || 0) + 1;
            } else {
                // Si no tiene ascId, es uso anónimo/no logueado
                anonymousUsageCount++;
            }
        });

        // Procesar Feedback (Sin cambios)
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
        
        // Formatear los datos de uso por ASC a un array para el frontend
        const usageByServiceCenter = Object.entries(usageByASC).map(([ascId, queries]) => ({
            ascId,
            // NOTA: Para el nombre del ASC, necesitarás otra colección o mapa
            // Aquí se usa el ID como nombre temporal.
            name: `ASC ${ascId}`, 
            queries
        }));


        
        return res.status(200).json({
            totalDiagnoses,
            totalFeedback,
            accuracyRate: parseFloat(accuracyRate.toFixed(2)),
            feedbackDistribution,
            usageByProductType,
            // NUEVOS DATOS
            usageByServiceCenter, 
            anonymousUsage: {
                queries: anonymousUsageCount,
                percentageOfTotal: totalDiagnoses > 0 ? (anonymousUsageCount / totalDiagnoses) : 0
            }
        });

    } catch (error) {
        console.error("Error al obtener las estadísticas del dashboard:", error);
        return res.status(500).json({ 
            error: 'Error al consultar la base de datos para el dashboard.',
            totalDiagnoses: 0,
            totalFeedback: 0,
            accuracyRate: 0,
            feedbackDistribution: { correcta: 0, cerca: 0, incorrecta: 0 },
            usageByProductType: {},
            usageByServiceCenter: [], // Agregar por consistencia
            anonymousUsage: { queries: 0, percentageOfTotal: 0 } // Agregar por consistencia
        });
    }
}