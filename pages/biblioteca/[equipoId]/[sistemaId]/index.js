// pages/biblioteca/[equipoId]/[sistemaId]/index.js
import React from 'react';
import Link from 'next/link';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../../../../lib/firebase'; // Ajusta la ruta
import styles from '../../../../styles/SistemaDetalle.module.css'; // Ajusta la ruta del CSS
import { useRouter } from 'next/router';

const SistemaDetalle = ({ equipoId, sistema }) => {

  const router = useRouter();
  if (!sistema) {
    return <div>Sistema no encontrado.</div>;
  }
console.log('sistema', sistema);

  return (
    <div className={styles.container}>
      <button onClick={() => router.back()} className={styles.volver}>
        ← Volver
      </button>
  <h1 className={styles.title}>Sistema: {sistema.nombre}</h1>

  <h2 className={styles.subtitle}>Componentes:</h2>
  {sistema.componentes && sistema.componentes.length > 0 ? (
    <ul className={styles.list}>
      {sistema.componentes.map((componente) => (
        <li key={componente.id} className={styles.listItem}>
          <Link href={`/biblioteca/${equipoId}/${sistema.id}/${componente.id}`}>
            <p className={styles.linkText}>{componente.nombre}</p>
          </Link>
        </li>
      ))}
    </ul>
  ) : (
    <p className={styles.message}>Este sistema no tiene componentes registrados.</p>
  )}
</div>
  );
};

export async function getStaticPaths() {
  const equiposSnapshot = await getDocs(collection(db, 'equipos'));
  let paths = [];

  for (const equipoDoc of equiposSnapshot.docs) {
    const sistemasSnapshot = await getDocs(collection(doc(db, 'equipos', equipoDoc.id), 'sistemas'));
    sistemasSnapshot.docs.forEach(sistemaDoc => {
      paths.push({
        params: {
          equipoId: equipoDoc.id,
          sistemaId: sistemaDoc.id,
        },
      });
    });
  }

  return { paths, fallback: 'blocking' };
}

export async function getStaticProps({ params }) {
  const { equipoId, sistemaId } = params;

  const sistemaRef = doc(db, 'equipos', equipoId, 'sistemas', sistemaId);
  const sistemaSnap = await getDoc(sistemaRef);

  if (!sistemaSnap.exists()) {
    return { notFound: true };
  }

  // Obtenemos la subcolección de componentes para este sistema
  const componentesSnapshot = await getDocs(collection(sistemaRef, 'componentes'));
  const componentesData = componentesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  const sistemaData = {
    id: sistemaSnap.id,
    ...sistemaSnap.data(),
    componentes: componentesData,
  };

  return {
    props: {
      equipoId, // Pasamos el equipoId para la navegación posterior
      sistema: sistemaData,
    },
    revalidate: 60,
  };
}

export default SistemaDetalle;