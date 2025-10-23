// components/AdminPage.jsx

import { useAuth } from '../context/UserContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import Link from 'next/link';
import styles from '../styles/admin.module.css'; // Asegúrate de que la ruta sea correcta
import AgregarRequisito from '@/components/admin/usersAutorization/AgregarRequisito';
import AgregarModelo from '@/components/admin/usersAutorization/AgregarModelo';
import AddPartsForm from '@/components/admin/AddPartsForm';

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
 console.log('user', user);
 
  if (loading || !user) return <p className={styles.loading}>Cargando...</p>;

  return (
    <div className={styles.container}>
      <button onClick={handleLogout} className={styles.logoutButton}>Cerrar sesión</button>
      <h1 className={styles.heading}>Panel de administrador</h1>
      <p className={styles.welcome}>Bienvenido, {user.email}</p>
      <Link href="/" className={styles.link}>Volver a la página principal</Link>
      {user.uid === 'PdYdDmrFMiZqZS5fhA3ztO3cpY73' && <div>
          <Link href="/addEquipsEdit" className={styles.link}>Ir al Panel de Gestión de Equipos</Link>
          <Link href="/addAscInfo" className={styles.link}>Ir al Panel de Gestión de AscInfo</Link>
          <div>
            <AddPartsForm />
          </div>
          <div>
            <AgregarRequisito />
          </div>
          <div>
            <AgregarModelo />
          </div>
          </div>}

    </div>
  );
}
