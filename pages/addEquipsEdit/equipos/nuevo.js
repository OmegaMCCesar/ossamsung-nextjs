// pages/addEquipsEdit/equipos/nuevo.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../context/UserContext';
import styles from '../../../styles/NuevoEquipoPage.module.css';

const NuevoEquipoPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagen, setImagen] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/addEquipsEdit/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) return <p>Cargando...</p>;
  if (!user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!nombre.trim()) {
      setError("El nombre del equipo no puede estar vacío.");
      setIsSubmitting(false);
      return;
    }

    try {
      await addDoc(collection(db, 'equipos'), {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        imagen: imagen.trim(),
        createdAt: new Date(),
      });
      setSuccess('Equipo agregado con éxito!');
      setNombre('');
      setDescripcion('');
      setImagen('');
    } catch (err) {
      console.error('Error al agregar equipo:', err);
      setError('Error al agregar el equipo. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Agregar Nuevo Equipo</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="nombre" className={styles.label}>Nombre del Equipo:</label>
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
        <div className={styles.field}>
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
        <div className={styles.field}>
          <label htmlFor="imagen" className={styles.label}>URL de la Imagen:</label>
          <input
            type="text"
            id="imagen"
            value={imagen}
            onChange={(e) => setImagen(e.target.value)}
            placeholder="Ej: data:image/jpeg;base64,..."
            disabled={isSubmitting}
            className={styles.input}
          />
          {imagen && (
            <img
              src={imagen}
              alt="Vista previa"
              className={styles.previewImage}
            />
          )}
        </div>
        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}
        <button type="submit" disabled={isSubmitting} className={styles.button}>
          {isSubmitting ? 'Agregando...' : 'Agregar Equipo'}
        </button>
      </form>
      <hr style={{ margin: '20px 0' }} />
      <Link href="/addEquipsEdit">Volver al Dashboard</Link>
    </div>
  );
};

export default NuevoEquipoPage;
