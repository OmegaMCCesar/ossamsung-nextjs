import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { doc, getDoc, updateDoc, collection, addDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../../../../../../lib/firebase';
import { useAuth } from '../../../../../../context/UserContext';
import Link from 'next/link';
import styles from '../../../../../../styles/EditarSistemaPage.module.css'; // Importa el CSS Module

const EditarSistemaPage = () => {
  const router = useRouter();
  const { equipoId, sistemaId } = router.query;
  const { user, loading: authLoading } = useAuth();

  const [sistema, setSistema] = useState(null);
  const [nombreSistema, setNombreSistema] = useState('');
  const [componentes, setComponentes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  const [nuevoComponenteNombre, setNuevoComponenteNombre] = useState('');
  const [nuevoComponenteDescripcion, setNuevoComponenteDescripcion] = useState('');
  const [nuevoComponenteProblemas, setNuevoComponenteProblemas] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/addEquipsEdit/login');
      return;
    }
    if (!equipoId || !sistemaId || !user) {
      setLoadingData(false);
      return;
    }

    const fetchSistema = async () => {
      try {
        const sistemaRef = doc(db, 'equipos', equipoId, 'sistemas', sistemaId);
        const sistemaSnap = await getDoc(sistemaRef);

        if (sistemaSnap.exists()) {
          const data = { id: sistemaSnap.id, ...sistemaSnap.data() };
          setSistema(data);
          setNombreSistema(data.nombre);

          const componentesSnapshot = await getDocs(collection(sistemaRef, 'componentes'));
          const componentesData = componentesSnapshot.docs.map(cDoc => ({ id: cDoc.id, ...cDoc.data() }));
          setComponentes(componentesData);
        } else {
          setError("Sistema no encontrado.");
          setSistema(null);
        }
      } catch (err) {
        console.error("Error al cargar el sistema:", err);
        setError("Error al cargar el sistema. Inténtalo de nuevo.");
      } finally {
        setLoadingData(false);
      }
    };

    fetchSistema();
  }, [equipoId, sistemaId, user, authLoading, router]);

  const handleUpdateSistema = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!nombreSistema.trim()) {
      setError("El nombre del sistema no puede estar vacío.");
      setIsSubmitting(false);
      return;
    }

    try {
      const sistemaRef = doc(db, 'equipos', equipoId, 'sistemas', sistemaId);
      await updateDoc(sistemaRef, {
        nombre: nombreSistema.trim(),
      });
      alert('Sistema actualizado con éxito!');
    } catch (err) {
      console.error('Error al actualizar sistema:', err);
      setError('Error al actualizar el sistema. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComponente = async (e) => {
    e.preventDefault();
    if (!nuevoComponenteNombre.trim()) {
      alert("El nombre del componente no puede estar vacío.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const problemasArray = nuevoComponenteProblemas.split(',').map(p => p.trim()).filter(p => p !== '');
      const componentesCollectionRef = collection(db, 'equipos', equipoId, 'sistemas', sistemaId, 'componentes');
      const newComponenteRef = await addDoc(componentesCollectionRef, {
        nombre: nuevoComponenteNombre.trim(),
        descripcion: nuevoComponenteDescripcion.trim(),
        problemas_comunes: problemasArray,
      });
      setComponentes([...componentes, {
        id: newComponenteRef.id,
        nombre: nuevoComponenteNombre.trim(),
        descripcion: nuevoComponenteDescripcion.trim(),
        problemas_comunes: problemasArray,
      }]);
      setNuevoComponenteNombre('');
      setNuevoComponenteDescripcion('');
      setNuevoComponenteProblemas('');
      alert('Componente agregado con éxito!');
    } catch (err) {
      console.error('Error al agregar componente:', err);
      setError('Error al agregar el componente. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComponente = async (componenteToDeleteId, componenteNombre) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el componente "${componenteNombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const componenteRef = doc(db, 'equipos', equipoId, 'sistemas', sistemaId, 'componentes', componenteToDeleteId);
      await deleteDoc(componenteRef);
      setComponentes(componentes.filter(c => c.id !== componenteToDeleteId));
      alert('Componente eliminado con éxito!');
    } catch (err) {
      console.error('Error al eliminar componente:', err);
      setError('Error al eliminar el componente. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loadingData) return <p className={styles.loading}>Cargando datos del sistema...</p>;
  if (!user) return null;
  if (error && !sistema) return <p className={styles.error}>{error}</p>;
  if (!sistema) return <p className={styles.notFound}>Sistema no encontrado o no autorizado para ver.</p>;

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Editar Sistema: {sistema.nombre}</h1>
      <form onSubmit={handleUpdateSistema} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="nombreSistema">Nombre del Sistema:</label>
          <input
            type="text"
            id="nombreSistema"
            value={nombreSistema}
            onChange={(e) => setNombreSistema(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" disabled={isSubmitting} className={styles.button}>
          {isSubmitting ? 'Actualizando Sistema...' : 'Actualizar Sistema'}
        </button>
      </form>

      <hr className={styles.divider} />

      <h2 className={styles.subheading}>Componentes del Sistema</h2>
      <form onSubmit={handleAddComponente} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="nuevoComponenteNombre">Nombre del Componente:</label>
          <input
            type="text"
            id="nuevoComponenteNombre"
            placeholder="Ej: Tarjeta de Control"
            value={nuevoComponenteNombre}
            onChange={(e) => setNuevoComponenteNombre(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="nuevoComponenteDescripcion">Descripción:</label>
          <textarea
            id="nuevoComponenteDescripcion"
            placeholder="Descripción detallada del componente..."
            value={nuevoComponenteDescripcion}
            onChange={(e) => setNuevoComponenteDescripcion(e.target.value)}
            rows="3"
            disabled={isSubmitting}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="nuevoComponenteProblemas">Problemas Comunes (separados por coma):</label>
          <input
            type="text"
            id="nuevoComponenteProblemas"
            placeholder="Ej: No enciende, Ruido raro"
            value={nuevoComponenteProblemas}
            onChange={(e) => setNuevoComponenteProblemas(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <button type="submit" disabled={isSubmitting} className={styles.button}>
          Agregar Componente
        </button>
      </form>

      {componentes.length > 0 ? (
        <ul className={styles.componentList}>
          {componentes.map((componente) => (
            <li key={componente.id} className={styles.componentItem}>
              {componente.nombre}
              {' '}
              <Link href={`/addEquipsEdit/equipos/${equipoId}/sistemas/${sistemaId}/componentes/${componente.id}/editar`}>
                <span className={styles.editLink}>[Editar Componente]</span>
              </Link>
              {' '}
              <button onClick={() => handleDeleteComponente(componente.id, componente.nombre)} disabled={isSubmitting} className={styles.deleteButton}>
                [Eliminar Componente]
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.noComponents}>No hay componentes para este sistema. ¡Agrega uno!</p>
      )}

      <hr className={styles.divider} />
      <Link href={`/addEquipsEdit/equipos/${equipoId}/editar`} className={styles.backLink}>
        Volver a Editar Equipo
      </Link>
    </div>
  );
};

export default EditarSistemaPage;
