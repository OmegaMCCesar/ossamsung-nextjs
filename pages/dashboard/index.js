// pages/dashboard/index.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router'; // Necesitas useRouter para redireccionar
import AIDashboard from '../../components/AIDashboard'; 
import { useAuth } from '../../context/UserContext';


export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    
    const [stats, setStats] = useState(null);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [error, setError] = useState(null);

    // 1. Efecto para la AUTENTICACIÓN
    useEffect(() => {
        if (loading) return; // Esperar a que la autenticación termine
        
        // Si no hay usuario y no está cargando, redireccionar
        if (!user) {
            // Reemplaza '/login' con la ruta real de tu formulario de inicio de sesión
            router.push('/login'); 
            return;
        }

        // Si el usuario existe, podemos empezar a cargar los datos
        fetchDashboardData();

    }, [user, loading, router]); // Dependencias: se ejecuta cuando user o loading cambian

    // 2. Función para CARGAR DATOS
    const fetchDashboardData = async () => {
        try {
            const response = await fetch('/api/stats/dashboard');
            if (!response.ok) {
                throw new Error('Error al cargar las estadísticas del servidor.');
            }
            const data = await response.json();
            setStats(data);
            setIsLoadingData(false);
        } catch (err) {
            console.error("Fallo al obtener datos del dashboard:", err);
            setError(err.message);
            setIsLoadingData(false);
        }
    };
    
    // --- Renderizado Condicional ---

    if (loading) {
        return <p style={{ textAlign: 'center', padding: '50px' }}>Cargando sesión...</p>;
    }

    // Si no está autenticado, la redirección ya ocurrió en useEffect.
    if (!user) {
        return <p style={{ textAlign: 'center', padding: '50px' }}>Redireccionando a Login...</p>;
    }
    
    // Si está autenticado y los datos están cargando
    if (isLoadingData) {
        return <p style={{ textAlign: 'center', padding: '50px' }}>Cargando métricas del Dashboard...</p>;
    }

    // Si hay un error en la carga de datos
    if (error) {
        return (
            <div style={{ padding: '20px', maxWidth: '800px', margin: '50px auto' }}>
                 <div style={{ color: 'red', padding: '15px', border: '1px solid red', borderRadius: '5px' }}>
                    ❌ Error al cargar datos: {error}.
                </div>
            </div>
        );
    }
    
    // Si está autenticado y los datos están listos
    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ color: '#004A99', borderBottom: '2px solid #EEE', paddingBottom: '10px' }}>
                Panel de Control de Diagnóstico IA (Samsung)
            </h1>
            {/* Pasamos los datos cargados al componente de presentación */}
            {stats && <AIDashboard stats={stats} />}
        </div>
    );
}

// El componente AIDashboard.js no necesita cambios, ya que la página
// maneja la autenticación y solo lo renderiza si 'user' existe.