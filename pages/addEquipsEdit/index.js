// pages/addEquipsEdit/index.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { auth } from '../../lib/firebase'; // Ajusta la ruta
import { signOut } from 'firebase/auth';
import { useAuth } from '../../context/UserContext'; // Asegúrate de tener este hook para manejar la autenticación
import styles from '../../styles/AdminDashboard.module.css'; // Asegúrate de que la ruta sea correcta

const AdminDashboard = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/addEquipsEdit/login'); // Redirige si no está autenticado
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/addEquipsEdit/login'); // Redirige al login después de cerrar sesión
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      alert("Error al cerrar sesión.");
    }
  };

  if (loading) {
    return <p>Cargando panel de administración...</p>;
  }

  if (!user) {
    return null; // O un spinner, ya que la redirección está en camino
  }

  return (
    <div className={styles.container} >
      <h1>Panel de Administración</h1>
      <p>Bienvenido, {user.email}!</p>
      <button onClick={handleLogout} style={{ marginTop: '10px', padding: '8px 15px', cursor: 'pointer' }}>Cerrar Sesión</button>
      <hr style={{ margin: '20px 0' }} />
      <h2>Opciones de Gestión:</h2>
      <ul>
        <li>
          <Link href="/addEquipsEdit/equipos/nuevo">
            Agregar Nuevo Equipo
          </Link>
        </li>
        <li>
          <Link href="/addEquipsEdit/equipos">
            Gestionar Equipos Existentes
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default AdminDashboard;