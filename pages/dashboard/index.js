import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AIDashboard from '../../components/AIDashboard'; 
import { useAuth } from '../../context/UserContext';

// Define aquí los roles que tienen permiso para acceder al Dashboard
const ALLOWED_ROLES = ['Admin',]; // Asume 'Admin' o 'Supervisor' como roles de gestión, y 'TechSupp' si quieres que el soporte técnico avanzado lo vea.

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    
    const [stats, setStats] = useState(null);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [error, setError] = useState(null);

    // 1. Efecto para la AUTENTICACIÓN Y AUTORIZACIÓN
    useEffect(() => {
        if (loading) return; // Esperar a que la autenticación termine
        console.log(user);
        
        // --- A. VERIFICACIÓN DE AUTENTICACIÓN ---
        if (!user) {
            router.push('/login'); 
            return;
        }

        // --- B. VERIFICACIÓN DE AUTORIZACIÓN (ROL) ---
        // Verifica si el rol del usuario (user.role) está incluido en los roles permitidos
        if (!ALLOWED_ROLES.includes(user.role)) {
            // Si el usuario está logueado pero no tiene el rol, redirige a una página de acceso denegado o a la página principal.
            router.push('/'); // Redirigir a la página de inicio o a un /403
            // Opcional: Mostrar un mensaje de error antes de redirigir
            // alert('Acceso denegado. Rol no autorizado para ver el Dashboard.'); 
            return;
        }

        // Si el usuario está autenticado Y autorizado, cargar los datos
        fetchDashboardData();

    }, [user, loading, router]); // Dependencias: se ejecuta cuando user o loading cambian

    // 2. Función para CARGAR DATOS (Mismos datos)
    const fetchDashboardData = async () => {
        try {
            // Nota: Es buena práctica enviar el user.ascId aquí si el Dashboard es específico del ASC.
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

    // Si el usuario existe pero no tiene el rol correcto, no renderizamos nada aquí,
    // ya que el useEffect ya inició la redirección.
    if (!user || !ALLOWED_ROLES.includes(user.role)) {
        return <p style={{ textAlign: 'center', padding: '50px' }}>Verificando permisos...</p>;
    }
    
    // Si está autenticado, autorizado y los datos están cargando
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
    
    // Si está autenticado, autorizado y los datos están listos
    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ color: '#004A99', borderBottom: '2px solid #EEE', paddingBottom: '10px' }}>
                Panel de Control de Diagnóstico IA (Samsung)
            </h1>
            {stats && <AIDashboard stats={stats} />}
        </div>
    );
}