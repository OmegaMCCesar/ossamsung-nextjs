import React from 'react';
import styles from '../styles/FaultSearch.module.css';

const DefectDetailModal = ({ defecto, onClose }) => {
  const { defectBlockInfo, modelos } = defecto;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} onClick={onClose}>
        <h2>{defectBlockInfo?.comunName || defectBlockInfo?.defectBlock || 'Sin nombre'}</h2>
        <p><strong>Características:</strong></p>
        <ul>
          {Array.isArray(defectBlockInfo?.caracteristicas) && defectBlockInfo.caracteristicas.length > 0 ? (
            defectBlockInfo.caracteristicas.map((caracteristica, idx) => (
              <li key={idx}>{caracteristica || 'Sin información'}</li>
            ))
          ) : (
            <li>Sin información</li>
          )}
        </ul>

        {defectBlockInfo?.defectBlockImageUrl && (
          <img
            src={defectBlockInfo.defectBlockImageUrl}
            alt={defectBlockInfo.defectBlock}
            className={styles.modalImage}
          />
        )}

        <div>
          <h3>Síntomas</h3>
          {Array.isArray(defectBlockInfo.symptoms) && defectBlockInfo.symptoms.length > 0 ? (
            <ul>
              {defectBlockInfo.symptoms.map((symptom, idx) => (
                <li key={idx}>
                  <strong>Síntoma:</strong>{' '}
                  {symptom?.symptomCode || 'Sin código'}<br />
                  {Array.isArray(symptom?.subSymptoms) && (
                    <span><strong>Sub-síntomas:</strong> {symptom.subSymptoms.map(sub => sub.subSymptomCode).filter(Boolean).join(', ') || 'Sin info'}</span>
                  )}
                  {Array.isArray(symptom?.repairCodes) && symptom.repairCodes.length > 0 && (
                    <ul>
                      {symptom.repairCodes.map((repair, repairIdx) => (
                        <li key={repairIdx}>
                          <strong>Solución:</strong> {repair.repairCode || 'Sin código'}
                          {repair.subRepairCodes?.length > 0 && (
                            <span> ({repair.subRepairCodes.filter(Boolean).join(', ')})</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No hay síntomas disponibles.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DefectDetailModal;
