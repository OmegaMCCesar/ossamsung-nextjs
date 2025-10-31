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

// 2. Registro de los elementos necesarios para Chart.js (Sin cambios)
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

// --- NUEVO COMPONENTE: GRÁFICO DE USO POR ASC Y ANÓNIMOS ---
const ASCUsageChart = ({ usageByServiceCenter, anonymousUsage }) => {
    
    // 1. Preparar los datos combinados: ASCs + Anónimos
    const ascData = usageByServiceCenter.map(item => ({
        name: item.name,
        'Consultas (Logueadas)': item.queries,
    }));

    // Agregar la barra de uso Anónimo al final
    const chartData = [
        ...ascData,
        {
            name: "Anónimos/No Logueados",
            'Consultas (Logueadas)': anonymousUsage.queries, // Reutilizamos la misma clave para que aparezca en el mismo dataset
        }
    ];

    const labels = chartData.map(item => item.name);
    const counts = chartData.map(item => item['Consultas (Logueadas)']);

    const barData = {
        labels: labels,
        datasets: [{
            label: 'Número de Diagnósticos',
            data: counts,
            // Aplicar un color diferente al último elemento (Anónimos)
            backgroundColor: counts.map((_, index) => 
                index === counts.length - 1 
                ? 'rgba(255, 159, 64, 0.8)' // Naranja para Anónimos
                : 'rgba(54, 162, 235, 0.8)' // Azul para ASCs
            ), 
            borderColor: counts.map((_, index) => 
                index === counts.length - 1 
                ? 'rgba(255, 159, 64, 1)'
                : 'rgba(54, 162, 235, 1)'
            ), 
            borderWidth: 1,
        }],
    };
    
    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: 'Uso por Centro de Servicio (ASC) y Anónimos',
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

    // Solo mostrar si hay datos logueados o anónimos
    if (usageByServiceCenter.length === 0 && anonymousUsage.queries === 0) {
        return <p style={{ textAlign: 'center', padding: '20px' }}>No hay suficientes datos de uso por ASC o anónimos para mostrar.</p>;
    }
    
    return (
        <div style={{ flex: 1, minWidth: '450px', padding: '20px', backgroundColor: '#FFF', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
            <Bar options={options} data={barData} />
        </div>
    );
};


const AIDashboard = ({ stats }) => {
    // Desestructurar datos del API. AÑADIMOS los nuevos campos.
    const { 
        totalDiagnoses, 
        totalFeedback, 
        accuracyRate, 
        feedbackDistribution, 
        usageByProductType,
        // NUEVOS CAMPOS
        usageByServiceCenter = [],
        anonymousUsage = { queries: 0, percentageOfTotal: 0 }
    } = stats;
    
    // --- PREPARACIÓN DE DATOS PARA GRÁFICOS (Sin cambios en feedback y productType) ---
    
    // 1. Datos para el Gráfico de Torta (Precisión/Feedback) - Sin cambios
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

    // 2. Datos para el Gráfico de Barras (Uso por Producto) - Sin cambios
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
    
    // Opciones comunes para el Gráfico de Barras - Sin cambios
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
                {/* Nuevo KPI para Uso Anónimo */}
                <StatCard 
                    title="Uso Anónimo" 
                    value={anonymousUsage.queries} 
                    unit={`(${Math.round(anonymousUsage.percentageOfTotal * 100)}%)`} 
                    color="#ff6600" // Naranja
                />
            </div>

            {/* 2. DISTRIBUCIÓN DEL RENDIMIENTO (Feedback) - Sin cambios */}
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
                
                {/* GRÁFICO 1: DISTRIBUCIÓN DE PRECISION (Doughnut/Torta) - Sin cambios */}
                <div style={{ width: '400px', padding: '20px', backgroundColor: '#FFF', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>Distribución de Feedback</h3>
                    {totalFeedback > 0 ? (
                        <Doughnut data={feedbackData} />
                    ) : (
                        <p style={{ textAlign: 'center' }}>No hay suficientes datos de feedback para mostrar el gráfico.</p>
                    )}
                </div>

                {/* GRÁFICO 2: USO POR TIPO DE PRODUCTO (Barras) - Contiene el Bar anterior, se puede reemplazar o mantener */}
                <div style={{ flex: 1, minWidth: '450px', padding: '20px', backgroundColor: '#FFF', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>Uso por Producto</h3>
                    {totalDiagnoses > 0 ? (
                        <Bar options={barOptions} data={usageBarData} />
                    ) : (
                        <p style={{ textAlign: 'center' }}>No hay suficientes datos de uso para mostrar el gráfico.</p>
                    )}
                </div>
            </div>

            {/* --- NUEVA SECCIÓN: USO POR CENTRO DE SERVICIO --- */}
            <h2 style={{ color: '#333', marginTop: '30px' }}>Uso Desglosado por Centro de Servicio</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'flex-start' }}>
                <ASCUsageChart 
                    usageByServiceCenter={usageByServiceCenter} 
                    anonymousUsage={anonymousUsage} 
                />
            </div>

        </div>
    );
};

export default AIDashboard;