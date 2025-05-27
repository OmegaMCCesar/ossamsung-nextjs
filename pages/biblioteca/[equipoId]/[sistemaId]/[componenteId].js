// pages/biblioteca/[equipoId]/[sistemaId]/[componenteId].js
import React from 'react';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../../../../lib/firebase'; // Ajusta la ruta
import styles from '../../../../styles/ComponenteDetalle.module.css';
import { useRouter } from 'next/router';


const ComponenteDetalle = ({ componente }) => {
  const router = useRouter();
  if (!componente) {
    return <div>Componente no encontrado.</div>;
  }

  return (
    <div className={styles.container}>
      <button onClick={() => router.back()} className={styles.volver}>
        ← Volver
      </button>
  <h1 className={styles.title}>Componente: {componente.nombre}</h1>
  <p className={styles.description}>{componente.descripcion}</p>

  {componente.problemas_comunes && componente.problemas_comunes.length > 0 && (
    <>
      <h2 className={styles.subtitle}>Problemas Comunes si Falla:</h2>
      <ul className={styles.list}>
        {componente.problemas_comunes.map((problema, index) => (
          <li key={index} className={styles.listItem}>{problema}</li>
        ))}
      </ul>
    </>
  )}
</div>

  );
};

export async function getStaticPaths() {
  const equiposSnapshot = await getDocs(collection(db, 'equipos'));
  let paths = [];

  for (const equipoDoc of equiposSnapshot.docs) {
    const sistemasSnapshot = await getDocs(collection(doc(db, 'equipos', equipoDoc.id), 'sistemas'));
    for (const sistemaDoc of sistemasSnapshot.docs) {
      const componentesSnapshot = await getDocs(collection(doc(db, 'equipos', equipoDoc.id, 'sistemas', sistemaDoc.id), 'componentes'));
      componentesSnapshot.docs.forEach(componenteDoc => {
        paths.push({
          params: {
            equipoId: equipoDoc.id,
            sistemaId: sistemaDoc.id,
            componenteId: componenteDoc.id,
          },
        });
      });
    }
  }

  return { paths, fallback: 'blocking' };
}

export async function getStaticProps({ params }) {
  const { equipoId, sistemaId, componenteId } = params;

  const componenteRef = doc(db, 'equipos', equipoId, 'sistemas', sistemaId, 'componentes', componenteId);
  const componenteSnap = await getDoc(componenteRef);

  if (!componenteSnap.exists()) {
    return { notFound: true };
  }

  const componenteData = {
    id: componenteSnap.id,
    ...componenteSnap.data(),
  };

  return {
    props: {
      componente: componenteData,
    },
    revalidate: 60,
  };
}

export default ComponenteDetalle;