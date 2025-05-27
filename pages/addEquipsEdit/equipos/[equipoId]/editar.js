import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { doc, getDoc, updateDoc, collection, addDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { useAuth } from '../../../../context/UserContext';
import Link from 'next/link';
import styles from '../../../../styles/EditarEquipoPage.module.css';

const EditarEquipoPage = () => {
  const router = useRouter();
  const { equipoId } = router.query;
  const { user, loading: authLoading } = useAuth();

  const [equipo, setEquipo] = useState(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [sistemas, setSistemas] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [imagen, setImagen] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [nuevoSistemaNombre, setNuevoSistemaNombre] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/addEquipsEdit/login');
      return;
    }
    if (!equipoId || !user) {
      setLoadingData(false);
      return;
    }

    const fetchEquipo = async () => {
      try {
        const equipoRef = doc(db, 'equipos', equipoId);
        const equipoSnap = await getDoc(equipoRef);

        if (equipoSnap.exists()) {
          const data = { id: equipoSnap.id, ...equipoSnap.data() };
          setEquipo(data);
          setNombre(data.nombre);
          setDescripcion(data.descripcion);
          setImagen(data.imagen || '');

          const sistemasSnapshot = await getDocs(collection(equipoRef, 'sistemas'));
          const sistemasData = sistemasSnapshot.docs.map(sDoc => ({ id: sDoc.id, ...sDoc.data() }));
          setSistemas(sistemasData);
        } else {
          setError("Equipo no encontrado.");
          setEquipo(null);
        }
      } catch (err) {
        console.error("Error al cargar el equipo:", err);
        setError("Error al cargar el equipo. Inténtalo de nuevo.");
      } finally {
        setLoadingData(false);
      }
    };

    fetchEquipo();
  }, [equipoId, user, authLoading, router]);

  const handleUpdateEquipo = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!nombre.trim()) {
      setError("El nombre del equipo no puede estar vacío.");
      setIsSubmitting(false);
      return;
    }

    try {
      const equipoRef = doc(db, 'equipos', equipoId);
      await updateDoc(equipoRef, {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        imagen: imagen.trim(),
      });
      alert('Equipo actualizado con éxito!');
    } catch (err) {
      console.error('Error al actualizar equipo:', err);
      setError('Error al actualizar el equipo. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSistema = async (e) => {
    e.preventDefault();
    if (!nuevoSistemaNombre.trim()) {
      alert("El nombre del sistema no puede estar vacío.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const sistemasCollectionRef = collection(db, 'equipos', equipoId, 'sistemas');
      const newSistemaRef = await addDoc(sistemasCollectionRef, {
        nombre: nuevoSistemaNombre.trim(),
      });
      setSistemas([...sistemas, { id: newSistemaRef.id, nombre: nuevoSistemaNombre.trim() }]);
      setNuevoSistemaNombre('');
      alert('Sistema agregado con éxito!');
    } catch (err) {
      console.error('Error al agregar sistema:', err);
      setError('Error al agregar el sistema. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSistema = async (sistemaToDeleteId, sistemaNombre) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el sistema "${sistemaNombre}"? Esto eliminará el sistema. **Nota: Sus componentes asociados NO se eliminarán automáticamente.**`)) {
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const sistemaRef = doc(db, 'equipos', equipoId, 'sistemas', sistemaToDeleteId);
      await deleteDoc(sistemaRef);
      setSistemas(sistemas.filter(s => s.id !== sistemaToDeleteId));
      alert('Sistema eliminado con éxito!');
    } catch (err) {
      console.error('Error al eliminar sistema:', err);
      setError('Error al eliminar el sistema. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || loadingData) return <p>Cargando datos del equipo...</p>;
  if (!user) return null;
  if (error && !equipo) return <p className={styles.error}>{error}</p>;
  if (!equipo) return <p>Equipo no encontrado o no autorizado para ver.</p>;

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Editar Equipo: {equipo.nombre}</h1>

      <form onSubmit={handleUpdateEquipo} className={styles.form}>
        <label>
          Nombre del Equipo:
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            disabled={isSubmitting}
          />
        </label>

        <label>
          Descripción:
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows="4"
            disabled={isSubmitting}
          />
        </label>

        <label>
          URL de la Imagen:
          <input
            type="text"
            value={imagen}
            onChange={(e) => setImagen(e.target.value)}
            placeholder="Ej: data:image/jpeg;base64,..."
            disabled={isSubmitting}
          />
        </label>

        {imagen && <img src={imagen} alt="Vista previa" className={styles.previewImage} />}

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" disabled={isSubmitting} className={styles.button}>
          {isSubmitting ? 'Actualizando...' : 'Actualizar Equipo'}
        </button>
      </form>

      <hr className={styles.divider} />

      <h2>Sistemas del Equipo</h2>
      <form onSubmit={handleAddSistema} className={styles.formInline}>
        <input
          type="text"
          placeholder="Nombre del nuevo sistema"
          value={nuevoSistemaNombre}
          onChange={(e) => setNuevoSistemaNombre(e.target.value)}
          disabled={isSubmitting}
        />
        <button type="submit" disabled={isSubmitting} className={styles.button}>
          Agregar Sistema
        </button>
      </form>

      {sistemas.length > 0 ? (
        <ul className={styles.systemList}>
          {sistemas.map((sistema) => (
            <li key={sistema.id} className={styles.systemItem}>
              {sistema.nombre}
              <Link href={`/addEquipsEdit/equipos/${equipoId}/sistemas/${sistema.id}/editar`} className={styles.link}>
                [Editar Sistema]
              </Link>
              <button
                onClick={() => handleDeleteSistema(sistema.id, sistema.nombre)}
                disabled={isSubmitting}
                className={styles.deleteButton}
              >
                [Eliminar]
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No hay sistemas para este equipo. ¡Agrega uno!</p>
      )}

      <hr className={styles.divider} />
      <Link href="/addEquipsEdit/equipos" className={styles.link}>Volver a la lista de equipos</Link>
    </div>
  );
};

export default EditarEquipoPage;
