// components/AdminPage.jsx

import { useAuth } from '../context/UserContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import Link from 'next/link';
import styles from '../styles/admin.module.css';

import AgregarRequisito from '@/components/admin/usersAutorization/AgregarRequisito';
import AgregarModelo from '@/components/admin/usersAutorization/AgregarModelo';
import AddPartsForm from '@/components/admin/AddPartsForm';
import ServiceBulletinForm from '@/components/admin/ServiceBulletinForm';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading || !user) return <p className={styles.loading}>Cargando...</p>;

  const role = user.role || "User"; // fallback

  const isAdmin = role === "Admin";

  return (
    <div className={styles.container}>
      
      {/* TÍTULO DINÁMICO */}
      <h1 className={styles.heading}>
        {isAdmin ? "Panel de administrador" : "Panel de usuario"}
      </h1>

      <p className={styles.welcome}>Bienvenido, {user.email}</p>

      <button onClick={handleLogout} className={styles.logoutButton}>
        Cerrar sesión
      </button>

      <Link href="/" className={styles.link}>
        Volver a la página principal
      </Link>

      {/* CONTENIDO SOLO PARA ADMIN */}
      {isAdmin && (
        <div>
          <Link href="/admin/tecnicos" className={styles.link}>
            Gestión de Técnicos
          </Link>

          <Link href="/addEquipsEdit" className={styles.link}>
            Ir al Panel de Gestión de Equipos
          </Link>

          <Link href="/addAscInfo" className={styles.link}>
            Ir al Panel de Gestión de AscInfo
          </Link>

          <Link href="/dashboard" className={styles.link}>
            Ir al Panel de Diagnóstico IA
          </Link>

          <Link
            href="/admin/tecnicos/registrar-avance"
            className={styles.link}
          >
            Registrar Avances
          </Link>

          <div>
            <AddPartsForm />
          </div>

          <div>
            <ServiceBulletinForm />
          </div>

          <div>
            <AgregarRequisito />
          </div>

          <div>
            <AgregarModelo />
          </div>
        </div>
      )}

      {/* CONTENIDO PARA USUARIOS NO-ADMIN (por si quieres agregar más después) */}
      {!isAdmin && (
        <div className={styles.userPanel}>
          <p>Acceso limitado. Consulta tu información disponible.</p>

          <Link href="/perfil" className={styles.link}>
            Ver mi perfil
          </Link>
        </div>
      )}
    </div>
  );
}
