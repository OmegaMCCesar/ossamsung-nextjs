import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import styles from '../../styles/Biblioteca.module.css';
import Image from 'next/image';

const BibliotecaIndex = () => {
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
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
  }, []);

  if (loading) return <p className={styles.mensaje}>Cargando equipos...</p>;
  if (error) return <p className={`${styles.mensaje} ${styles.error}`}>{error}</p>;
  if (equipos.length === 0) return <p className={styles.mensaje}>No hay equipos disponibles en la biblioteca.</p>;

  return (
    <div className={styles.container}>
      <button className={styles.volver} onClick={() => router.back()}>
        ← Volver
      </button>

      <h1 className={styles.titulo}>Nuestra Biblioteca de Equipos</h1>
      <ul className={styles.lista}>
        {equipos.map((equipo) => (
          <li key={equipo.id} className={styles.item}>
            <Link href={`/biblioteca/${equipo.id}`} className={styles.link}>
              <div className={styles.cardEquipo}>
                <p className={styles.nombre}>{equipo.nombre}</p>
                <div className={styles.imagenContainer}>
                  <Image
                    src={equipo.imagen || '/default-image.png'}
                    alt={equipo.nombre}
                    width={150}
                    height={150}
                    className={styles.equipoImage}
                  />
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BibliotecaIndex;
