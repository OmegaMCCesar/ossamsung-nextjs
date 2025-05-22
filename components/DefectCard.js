import React from 'react';
import styles from '../styles/FaultSearch.module.css';

const DefectCard = ({ nombre, imagen, onClick, fallaTipo, caracteristicas, modelos }) => (
  <div className={styles.card} onClick={onClick}>
    {imagen && <img src={imagen} alt={nombre} className={styles.cardImage} />}
    <h3 className={styles.cardTitle}>{nombre}</h3>

    {fallaTipo && (
      <span className={`${styles.badge} ${styles[fallaTipo.toLowerCase()]}`}>
        {fallaTipo}
      </span>
    )}

    <p className={styles.cardCaracteristicas}>
      <strong>Características:</strong>{' '}
      {Array.isArray(caracteristicas) && caracteristicas.length > 0
        ? caracteristicas.join(', ')
        : 'Sin info'}
    </p>

    <p className={styles.cardModelos}>
      <strong>Modelos:</strong>{' '}
      {Array.isArray(modelos) && modelos.length > 0
        ? modelos.join(', ')
        : 'Sin info'}
    </p>
  </div>
);

export default DefectCard;
