'use client'; 
import React, { useState } from 'react';
import { RefreshCw, Zap, AlertTriangle, Cpu, Hammer } from 'lucide-react'; // Agregamos Hammer
import styles from '../styles/AdvancedDiagnosisForm.module.css'; 

const PRODUCT_TYPES = [
  'Lavadora',
  'Lavasecadora',
  'Refrigerador',
  'Horno (Microondas/Eléctrico)',
  'Aire Acondicionado',
];

const AdvancedDiagnosisForm = () => {
  const [productType, setProductType] = useState(PRODUCT_TYPES[0]);
  const [model, setModel] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setDiagnosisResult(null);
    setError(null);

    if (!productType || !model || !symptoms) {
      setError("Por favor, selecciona el tipo de producto e ingresa el modelo y los síntomas.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/ai-diagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productType, model, symptoms, errorCode }),
      });
      
      if (!response.ok) {
        throw new Error('La IA no pudo generar un diagnóstico. Inténtalo de nuevo.');
      }
      const data = await response.json();
      setDiagnosisResult(data);
    } catch (err) {
      setError(err.message || "Ocurrió un error inesperado al contactar la IA.");
    } finally {
      setIsLoading(false);
    }
  };

  const restartDiagnosis = () => { 
    setDiagnosisResult(null); 
    setModel(''); 
    setSymptoms(''); 
    setErrorCode(''); 
    setShowAdvanced(false); 
  };

  if (!diagnosisResult) {
    return (
      <div className={styles.card}>
        <h1 className={styles.heading}>
          <Cpu className={styles.icon} />
          Asistente de Prediagnóstico Inteligente
        </h1>
        <p className={styles.subtext}>
          Ingresa la información para obtener un análisis avanzado de causas y soluciones.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Tipo de Producto */}
          <div className={styles.fieldContainer}>
            <label className={styles.label}>
              Tipo de Producto Samsung
            </label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className={styles.inputField} 
              required
            >
              {PRODUCT_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Modelo */}
          <div className={styles.fieldContainer}>
            <label className={styles.label}>
              Modelo de Equipo (Ej: WA50F9A8DWW)
            </label>
            <input 
              type="text" 
              value={model} 
              onChange={(e) => setModel(e.target.value)} 
              className={styles.inputField} 
              required
            />
            </div>

          {/* Síntomas */}
          <div className={styles.fieldContainer}>
            <label className={styles.label}>
              Síntomas (Sé lo más detallado posible)
            </label>
            <textarea 
              value={symptoms} 
              onChange={(e) => setSymptoms(e.target.value)} 
              className={styles.inputField}
              rows="3"
              required
              placeholder="Ej: No centrifuga y hace un ruido como de golpeteo al intentar girar."
            />
          </div>

          {/* Código de Error */}
          <div className={styles.fieldContainer}>
            <label className={styles.label}>
              Código de Error (Opcional)
            </label>
            <input 
              type="text" 
              value={errorCode} 
              onChange={(e) => setErrorCode(e.target.value)} 
              className={styles.inputField} 
              placeholder="Deja vacío si no hay código"
            />
          </div>

          {error && (
            <div className={styles.alert}>
              <AlertTriangle className={styles.iconSmall} /> {error}
            </div>
          )}

          <button 
            type="submit" 
            className={`${styles.primaryButton} ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className={`${styles.iconSmall} ${styles.spinner}`} />
                Analizando con IA...
              </>
            ) : (
              'Obtener Diagnóstico Avanzado'
            )}
          </button>
        </form>
      </div>
    );
  }

  const result = diagnosisResult; 
console.log("Diagnosis Result:", result);

  return (
    <div className={styles.card}>
      <h2 className={styles.heading}>
        <Cpu className={styles.icon} />
        Diagnóstico Avanzado
      </h2>
      <p className={styles.subtext}>
        Producto: <strong>{productType}</strong> | Modelo analizado: <strong>Samsung {model}</strong>
      </p>

      <div className={styles.mainDiagnosisBox}>
        <h3 className={styles.sectionTitle}>Hipótesis de Falla Principal</h3>
        <p>{result.mainDiagnosis}</p>
      </div>

       {result.serviceBulletins && result.serviceBulletins.length > 0 && (
          <div className={styles.bulletinBox}>
              <h3 className={styles.bulletinTitle}>
                  <AlertTriangle className={styles.iconSmall} />
                  ¡Alerta! Boletines de Servicio Críticos Encontrados
              </h3>
              <p className={styles.bulletinSubtext}>Este modelo tiene boletines activos. Revíselos primero:</p>
              <ul className={styles.bulletinList}>
                  {result.serviceBulletins.map((bulletin, index) => (
                      <li key={index} className={styles.bulletinItem}>
                          <strong>{bulletin.bulletinNumber}: {bulletin.bulletinName}</strong>
                          <p className={styles.bulletinSummary}>{bulletin.issueSummary}</p>
                      </li>
                  ))}
              </ul>
          </div>
      )}

      <div className={styles.beginnerTipsBox}>
        <h3 className={styles.sectionTitle}>Guía para el Usuario (Nivel Básico)</h3>
        <p className={styles.textPre}>{result.beginnerTips}</p>
      </div>

      {/* Botón mostrar/ocultar avanzado */}
      <button 
        onClick={() => setShowAdvanced(!showAdvanced)} 
        className={styles.toggleAdvancedButton}
      >
        {showAdvanced ? 'Ocultar Consejos Avanzados' : 'Mostrar Consejos para Técnicos y Repuestos'}
      </button>

      {showAdvanced && (
        <div className={styles.advancedContainer}>

            {/* CAUSAS COMUNES */}
            <h3 className={styles.sectionTitleRed}>
              <AlertTriangle className={styles.iconSmall} />
              Causas Comunes (Resumen)
            </h3>
            <ul className={styles.causeList}>
              {result.commonCauses?.map((cause, index) => (
                <li key={index}>{cause}</li>
              ))}
            </ul>
            {/* --- */}

            {/* PASOS AVANZADOS DE DIAGNÓSTICO */}
            <h3 className={styles.sectionTitleRed}>
                <Hammer className={styles.iconSmall} />
                Pasos Avanzados de Diagnóstico (Nivel Técnico)
            </h3>
            <ol className={styles.stepList}>
                {result.advancedDiagnosisSteps?.map((step, index) => (
                    <li key={index}><strong>Paso {index + 1}:</strong> {step}</li>
                ))}
            </ol>
            {/* --- */}

          <h3 className={styles.sectionTitleRed}>
            💡 Repuestos Posibles (Para Administración)
          </h3>
          <div className={styles.partsContainer}>
            {result.potentialParts?.map((part, index) => (
              <div 
                key={index} 
                className={`${part.isCritical ? styles.partCritical : styles.partStandard} ${part.foundInDB ? styles.partFound : styles.partNotFound}`}
              >
                {part.foundInDB && part.imageUrl ? (
                  <img src={part.imageUrl} alt={part.partName} className={styles.partImage} />
                ) : (
                  <div className={styles.partImage}>
                    <Zap className={styles.iconSmall} />
                  </div>
                )}
                <div className={styles.partContent}>
                  <p className={styles.partName}>
                    {part.partName} 
                    {part.isCritical && <span className={styles.partCriticalLabel}>CRÍTICO</span>}
                  </p>
                  {part.foundInDB && part.partFunction && (
                    <p className={styles.partFunction}>Función: {part.partFunction}</p>
                  )}
                  <p className={styles.partNumber}>
                    <span className={styles.bold}>Nº Parte:</span> 
                    <span className={styles.mono}>{part.foundInDB ? part.partNumber : "SIN INF. DE LA PARTE"}</span>
                  </p>
                  <p className={styles.partReason}>{part.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button 
        onClick={restartDiagnosis} 
        className={`${styles.primaryButton} ${styles.restartButton}`}
      >
        <RefreshCw className={styles.iconSmall} />
        Hacer un nuevo diagnóstico
      </button>
    </div>
  );
};

export default AdvancedDiagnosisForm;