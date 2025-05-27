import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase'; // Ajusta esta ruta si es necesario
import styles from '../../../styles/EquipoDetalle.module.css';
import Image from 'next/image';

const EquipoDetalle = ({ equipo }) => {
  const router = useRouter();

  if (!equipo) {
    return <div className={styles.mensaje}>Equipo no encontrado.</div>;
  }

  // Si `createdAt` es una cadena (como ahora lo será después de la corrección),
  // puedes crear un objeto Date para formatearlo si lo necesitas mostrar.
  const createdAtDate = equipo.createdAt ? new Date(equipo.createdAt) : null;

  return (
    <div className={styles.container}>
      <button onClick={() => router.back()} className={styles.volver}>
        ← Volver
      </button>

      <h1 className={styles.titulo}>{equipo.nombre}</h1>

      {equipo.imagen && (
        <div className={styles.imagenContainer}>
          <Image
            src={equipo.imagen}
            alt={equipo.nombre}
            width={300}
            height={300}
            className={styles.imagen}
            priority // Considera agregar priority para imágenes importantes en la carga inicial
          />
        </div>
      )}

      <p className={styles.descripcion}>{equipo.descripcion}</p>

      {/* Opcional: Mostrar la fecha de creación */}
      {createdAtDate && (
        <p className={styles.fechaCreacion}>
          Creado el: {createdAtDate.toLocaleDateString()}
        </p>
      )}

      <h2 className={styles.subtitulo}>Sistemas disponibles</h2>

      {equipo.sistemas?.length > 0 ? (
        <ul className={styles.lista}>
          {equipo.sistemas.map((sistema) => (
            <li key={sistema.id} className={styles.item}>
              <Link href={`/biblioteca/${equipo.id}/${sistema.id}`} className={styles.link}>
                <p className={styles.card}>{sistema.nombre || sistema.id}</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.mensaje}>Este equipo no tiene sistemas registrados.</p>
      )}
    </div>
  );
};

export async function getStaticPaths() {
  const querySnapshot = await getDocs(collection(db, 'equipos'));
  const paths = querySnapshot.docs.map((doc) => ({
    params: { equipoId: doc.id },
  }));

  return { paths, fallback: 'blocking' };
}

export async function getStaticProps({ params }) {
  const { equipoId } = params;
  const equipoRef = doc(db, 'equipos', equipoId);
  const equipoSnap = await getDoc(equipoRef);

  if (!equipoSnap.exists()) {
    return {
      notFound: true,
    };
  }

  // Obtener los datos del equipo directamente
  const equipoData = {
    id: equipoSnap.id,
    ...equipoSnap.data(),
  };

  // Convertir el Timestamp 'createdAt' a una cadena ISO para serialización
  if (equipoData.createdAt && typeof equipoData.createdAt.toDate === 'function') {
    equipoData.createdAt = equipoData.createdAt.toDate().toISOString();
  }

  // Obtener los sistemas del equipo
  const sistemasSnapshot = await getDocs(collection(equipoRef, 'sistemas'));
  const sistemasData = sistemasSnapshot.docs.map(sDoc => {
    const sistema = {
      id: sDoc.id,
      ...sDoc.data()
    };
    // Si los sistemas también tuvieran un campo createdAt u otro Timestamp,
    // deberías convertirlos aquí de manera similar:
    if (sistema.createdAt && typeof sistema.createdAt.toDate === 'function') {
      sistema.createdAt = sistema.createdAt.toDate().toISOString();
    }
    return sistema;
  });

  // Asignar los sistemas convertidos al objeto equipoData
  equipoData.sistemas = sistemasData;

  return {
    props: {
      equipo: equipoData,
    },
    revalidate: 60, // Revalidar la página cada 60 segundos si hay nuevas solicitudes
  };
}

export default EquipoDetalle;