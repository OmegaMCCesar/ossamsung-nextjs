// components/AIDashboard.js

import React from 'react';
// 1. Importaciones de Charts.js y React Chartjs 2
import { Doughnut, Bar } from 'react-chartjs-2';
import { 
    Chart as ChartJS, 
    ArcElement, 
    Tooltip, 
    Legend, 
    CategoryScale, 
    LinearScale, 
    BarElement, 
    Title 
} from 'chart.js';

// 2. Registro de los elementos necesarios para Chart.js
ChartJS.register(
    ArcElement, 
    Tooltip, 
    Legend, 
    CategoryScale, 
    LinearScale, 
    BarElement, 
    Title
);


// Componente simple para mostrar una tarjeta de métrica clave (Sin cambios)
const StatCard = ({ title, value, unit, color = '#004A99' }) => (
    <div style={{ 
        flex: 1, 
        padding: '20px', 
        borderRadius: '8px', 
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)', 
        minWidth: '200px',
        margin: '10px',
        textAlign: 'center',
        backgroundColor: '#FFF',
        borderLeft: `5px solid ${color}`
    }}>
        <h3 style={{ color: color, margin: '0 0 5px 0', fontSize: '1em' }}>{title}</h3>
        <p style={{ fontSize: '2.5em', fontWeight: 'bold', margin: '0', color: '#333' }}>
            {value} <span style={{ fontSize: '0.5em', fontWeight: 'normal' }}>{unit}</span>
        </p>
    </div>
);


const AIDashboard = ({ stats }) => {
    // Desestructurar datos del API
    const { 
        totalDiagnoses, 
        totalFeedback, 
        accuracyRate, 
        feedbackDistribution, 
        usageByProductType 
    } = stats;
    
    // --- PREPARACIÓN DE DATOS PARA GRÁFICOS ---
    
    // 1. Datos para el Gráfico de Torta (Precisión/Feedback)
    const feedbackData = {
        labels: ['Aciertos', 'Cerca', 'Fallos'],
        datasets: [{
            label: 'Distribución de Feedback',
            data: [feedbackDistribution.correcta, feedbackDistribution.cerca, feedbackDistribution.incorrecta],
            backgroundColor: [
                'rgba(40, 167, 69, 0.7)', // Verde para Aciertos
                'rgba(255, 193, 7, 0.7)', // Amarillo para Cerca
                'rgba(220, 53, 69, 0.7)', // Rojo para Fallos
            ],
            borderColor: [
                'rgba(40, 167, 69, 1)',
                'rgba(255, 193, 7, 1)',
                'rgba(220, 53, 69, 1)',
            ],
            borderWidth: 1,
        }],
    };

    // 2. Datos para el Gráfico de Barras (Uso por Producto)
    const productUsageArray = Object.entries(usageByProductType)
        .sort(([, a], [, b]) => b - a); // Ordenar por uso descendente
        
    const productLabels = productUsageArray.map(([type]) => type);
    const productCounts = productUsageArray.map(([, count]) => count);
    
    const usageBarData = {
        labels: productLabels,
        datasets: [{
            label: 'Número de Diagnósticos',
            data: productCounts,
            backgroundColor: 'rgba(0, 123, 255, 0.6)', // Azul
            borderColor: 'rgba(0, 123, 255, 1)',
            borderWidth: 1,
        }],
    };
    
    // Opciones comunes para el Gráfico de Barras
    const barOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Uso por Tipo de Producto',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Conteo de Usos',
                }
            }
        }
    };


    return (
        <div>
            {/* 1. SECCIÓN DE RESUMEN EJECUTIVO (KPIs) */}
            <h2 style={{ color: '#333', marginTop: '30px' }}>Resumen Ejecutivo</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                <StatCard 
                    title="Diagnósticos Totales" 
                    value={totalDiagnoses} 
                    unit="Usos" 
                    color="#007bff" 
                />
                <StatCard 
                    title="Precisión de la IA" 
                    value={accuracyRate} 
                    unit="%" 
                    color="#28a745" 
                />
                <StatCard 
                    title="Feedback Recibido" 
                    value={totalFeedback} 
                    unit="Registros" 
                    color="#ffc107" 
                />
            </div>

            {/* 2. DISTRIBUCIÓN DEL RENDIMIENTO (Feedback) */}
            <h2 style={{ color: '#333', marginTop: '30px' }}>Rendimiento y Precisión (Feedback)</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                <StatCard 
                    title="Aciertos" 
                    value={feedbackDistribution.correcta} 
                    unit="Casos" 
                    color="#28a745" 
                />
                <StatCard 
                    title="Cerca" 
                    value={feedbackDistribution.cerca} 
                    unit="Casos" 
                    color="#ffc107" 
                />
                <StatCard 
                    title="Fallos" 
                    value={feedbackDistribution.incorrecta} 
                    unit="Casos" 
                    color="#dc3545" 
                />
            </div>
            
            {/* --- 3. SECCIÓN DE GRÁFICOS --- */}
            <h2 style={{ color: '#333', marginTop: '30px' }}>Análisis Gráfico</h2>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'flex-start' }}>
                
                {/* GRÁFICO 1: DISTRIBUCIÓN DE PRECISION (Doughnut/Torta) */}
                <div style={{ width: '400px', padding: '20px', backgroundColor: '#FFF', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>Distribución de Feedback</h3>
                    {totalFeedback > 0 ? (
                        <Doughnut data={feedbackData} />
                    ) : (
                        <p style={{ textAlign: 'center' }}>No hay suficientes datos de feedback para mostrar el gráfico.</p>
                    )}
                </div>

                {/* GRÁFICO 2: USO POR TIPO DE PRODUCTO (Barras) */}
                <div style={{ flex: 1, minWidth: '450px', padding: '20px', backgroundColor: '#FFF', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>Uso por Producto</h3>
                    {totalDiagnoses > 0 ? (
                        <Bar options={barOptions} data={usageBarData} />
                    ) : (
                        <p style={{ textAlign: 'center' }}>No hay suficientes datos de uso para mostrar el gráfico.</p>
                    )}
                </div>
                
            </div>
            {/* Se elimina la lista de usos anterior ya que se usa el gráfico */}
        </div>
    );
};

export default AIDashboard;