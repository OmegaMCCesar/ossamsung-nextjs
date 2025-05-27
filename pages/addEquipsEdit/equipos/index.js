import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/UserContext';
import { useRouter } from 'next/router';
import styles from '../../../styles/GestionarEquiposPage.module.css';

const GestionarEquiposPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/addEquipsEdit/login');
      return;
    }
    if (!user) return;

    const fetchEquipos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'equipos'));
        const equiposData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEquipos(equiposData);
      } catch (err) {
        console.error("Error al cargar equipos:", err);
        setError("No se pudieron cargar los equipos.");
      } finally {
        setLoading(false);
      }
    };

    fetchEquipos();
  }, [user, authLoading, router]);

  const handleDeleteEquipo = async (equipoIdToDelete, equipoNombre) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el equipo "${equipoNombre}"? Esta acción eliminará el equipo principal.`)) {
      return;
    }
    setIsDeleting(true);
    setError(null);
    try {
      await deleteDoc(doc(db, 'equipos', equipoIdToDelete));
      setEquipos(equipos.filter(eq => eq.id !== equipoIdToDelete));
      alert(`Equipo "${equipoNombre}" eliminado con éxito.`);
    } catch (err) {
      console.error("Error al eliminar equipo:", err);
      setError("Error al eliminar el equipo.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading || loading) return <p>Cargando equipos...</p>;
  if (!user) return null;

  if (error) return <p className={styles.error}>{error}</p>;
  if (equipos.length === 0)
    return (
      <p>
        No hay equipos para gestionar.{' '}
        <Link href="/addEquipsEdit/equipos/nuevo">¡Agrega uno!</Link>
      </p>
    );

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Gestionar Equipos</h1>
      <Link href="/addEquipsEdit/equipos/nuevo" className={styles.addLink}>
        Agregar Nuevo Equipo
      </Link>
      <hr className={styles.hr} />
      <ul className={styles.list}>
        {equipos.map((equipo) => (
          <li key={equipo.id} className={styles.listItem}>
            <span>{equipo.nombre}</span>
            <Link href={`/addEquipsEdit/equipos/${equipo.id}/editar`} className={styles.editLink}>
              [Editar]
            </Link>
            <button
              onClick={() => handleDeleteEquipo(equipo.id, equipo.nombre)}
              disabled={isDeleting}
              className={styles.deleteButton}
            >
              {isDeleting ? 'Eliminando...' : '[Eliminar]'}
            </button>
          </li>
        ))}
      </ul>
      <hr className={styles.hr} />
      <Link href="/addEquipsEdit" className={styles.backLink}>
        Volver al Dashboard
      </Link>
    </div>
  );
};

export default GestionarEquiposPage;
