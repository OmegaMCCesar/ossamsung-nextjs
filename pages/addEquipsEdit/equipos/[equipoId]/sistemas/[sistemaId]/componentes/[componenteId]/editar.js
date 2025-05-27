import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../../../../../lib/firebase';
import { useAuth } from '../../../../../../../../context/UserContext';
import Link from 'next/link';
import styles from '../../../../../../../../styles/EditarComponentePage.module.css'; // Importa el CSS Module

const EditarComponentePage = () => {
  const router = useRouter();
  const { equipoId, sistemaId, componenteId } = router.query;
  const { user, loading: authLoading } = useAuth();

  const [componente, setComponente] = useState(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [problemasComunes, setProblemasComunes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/addEquipsEdit/login');
      return;
    }
    if (!equipoId || !sistemaId || !componenteId || !user) {
      setLoadingData(false);
      return;
    }

    const fetchComponente = async () => {
      try {
        const componenteRef = doc(db, 'equipos', equipoId, 'sistemas', sistemaId, 'componentes', componenteId);
        const componenteSnap = await getDoc(componenteRef);

        if (componenteSnap.exists()) {
          const data = { id: componenteSnap.id, ...componenteSnap.data() };
          setComponente(data);
          setNombre(data.nombre);
          setDescripcion(data.descripcion);
          setProblemasComunes(data.problemas_comunes ? data.problemas_comunes.join(', ') : '');
        } else {
          setError("Componente no encontrado.");
          setComponente(null);
        }
      } catch (err) {
        console.error("Error al cargar el componente:", err);
        setError("Error al cargar el componente. Inténtalo de nuevo.");
      } finally {
        setLoadingData(false);
      }
    };

    fetchComponente();
  }, [equipoId, sistemaId, componenteId, user, authLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!nombre.trim()) {
      setError("El nombre del componente no puede estar vacío.");
      setIsSubmitting(false);
      return;
    }

    try {
      const problemasArray = problemasComunes.split(',').map(p => p.trim()).filter(p => p !== '');
      const componenteRef = doc(db, 'equipos', equipoId, 'sistemas', sistemaId, 'componentes', componenteId);
      await updateDoc(componenteRef, {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        problemas_comunes: problemasArray,
      });
      alert('Componente actualizado con éxito!');
    } catch (err) {
      console.error('Error al actualizar componente:', err);
      setError('Error al actualizar el componente. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loadingData) return <p>Cargando datos del componente...</p>;
  if (!user) return null;
  if (error && !componente) return <p className={styles.error}>{error}</p>;
  if (!componente) return <p>Componente no encontrado o no autorizado para ver.</p>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Editar Componente: {componente.nombre}</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div>
          <label htmlFor="nombre" className={styles.label}>Nombre del Componente:</label>
          <input
            type="text"
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            disabled={isSubmitting}
            className={styles.input}
          />
        </div>
        <div>
          <label htmlFor="descripcion" className={styles.label}>Descripción:</label>
          <textarea
            id="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows="4"
            disabled={isSubmitting}
            className={styles.textarea}
          />
        </div>
        <div>
          <label htmlFor="problemasComunes" className={styles.label}>Problemas Comunes (separados por coma):</label>
          <input
            type="text"
            id="problemasComunes"
            value={problemasComunes}
            onChange={(e) => setProblemasComunes(e.target.value)}
            disabled={isSubmitting}
            className={styles.input}
          />
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" disabled={isSubmitting} className={styles.button}>
          {isSubmitting ? 'Actualizando...' : 'Actualizar Componente'}
        </button>
      </form>
      <hr className={styles.hr} />
      <Link href={`/addEquipsEdit/equipos/${equipoId}/sistemas/${sistemaId}/editar`} className={styles.link}>
        Volver a Editar Sistema
      </Link>
    </div>
  );
};

export default EditarComponentePage;
