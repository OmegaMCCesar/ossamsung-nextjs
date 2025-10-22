// components/AdvancedDiagnosisForm.jsx

'use client'; 
import React, { useState } from 'react';
import { RefreshCw, Zap, AlertTriangle, Cpu } from 'lucide-react';
// IMPORTAR el archivo de estilos
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

  // Manejo de la función de reinicio
  const restartDiagnosis = () => { 
    setDiagnosisResult(null); 
    setModel(''); 
    setSymptoms(''); 
    setErrorCode(''); 
    setShowAdvanced(false); 
  };


  // --- Renderizado del Formulario (con Spinner integrado) ---
  if (!diagnosisResult) {
    return (
      <div className={styles.card}>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Cpu className="w-6 h-6 mr-2 text-blue-500" />
          Asistente de Prediagnóstico Inteligente
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Ingresa la información para obtener un análisis avanzado de causas y soluciones.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Tipo de Producto */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
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
          
          {/* Modelo, Síntomas, Código de Error... (contenido omitido por brevedad) */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
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

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
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

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
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
            <div className="p-3 bg-red-100 text-red-700 rounded-lg flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" /> {error}
            </div>
          )}

          <button 
            type="submit" 
            className={`${styles.primaryButton} ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                  <RefreshCw className={`w-5 h-5 mr-2 ${styles.spinner}`} />
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

  // --- Renderizado del Resultado ---
  return (
    <div className={styles.card}>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
        <Cpu className="w-7 h-7 mr-2 text-blue-500" />
        Diagnóstico Avanzado
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Producto: **{productType}** | Modelo analizado: **Samsung {model}**
      </p>

      {/* Diagnóstico principal */}
      <div className={styles.mainDiagnosisBox}>
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">Hipótesis de Falla Principal</h3>
        <p className="text-blue-700 dark:text-blue-300">{result.mainDiagnosis}</p>
        {/* Nota: El uso de 'whitespace-pre-line' asume que tienes clases utilitarias disponibles (ej. Tailwind) */}
      </div>

      {/* Causas Comunes */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Causas Posibles</h3>
        <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            {result.commonCauses?.map((cause, index) => (
                <li key={index}>{cause}</li>
            ))}
        </ul>
      </div>

      {/* Consejos para Principiantes */}
      <div className={styles.beginnerTipsBox}>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
          Guía para el Usuario (Nivel Básico)
        </h3>
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{result.beginnerTips}</p>
      </div>

      {/* Botón para mostrar/ocultar Avanzado */}
      <button 
        onClick={() => setShowAdvanced(!showAdvanced)} 
        className="w-full text-blue-600 hover:text-blue-800 text-sm font-medium my-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg transition-colors"
      >
        {showAdvanced ? 'Ocultar Consejos Avanzados' : 'Mostrar Consejos para Técnicos y Repuestos'}
      </button>

      {/* Consejos Avanzados y Repuestos (Oculto por defecto) */}
      {showAdvanced && (
        <div className={styles.advancedContainer}>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-3">
                📋 Pasos de Verificación para Técnico
            </h3>
            <ul className="list-decimal list-inside space-y-2 text-red-700 dark:text-red-300 mb-6">
                {result.advancedDiagnosisSteps?.map((step, index) => (
                    <li key={index} className="font-mono text-sm">{step}</li>
                ))}
            </ul>

            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-3">
                💡 Repuestos Posibles (Para Administración)
            </h3>
            <div className="space-y-3">
                {result.potentialParts?.map((part, index) => (
                    <div 
                        key={index} 
                        className={part.isCritical ? styles.partCritical : styles.partStandard} 
                    >
                        <p className="font-bold text-gray-800 dark:text-gray-100">{part.partName} 
                            {part.isCritical && <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">CRÍTICO</span>}
                        </p>
                    </div>
                ))}
            </div>
        </div>
      )}

      <button 
        onClick={restartDiagnosis} 
        className={styles.primaryButton + " mt-6 bg-gray-500 hover:bg-gray-600"} 
      >
        <RefreshCw className="w-5 h-5 mr-2" />
        Hacer un nuevo diagnóstico
      </button>
      
    </div>
  );
};

export default AdvancedDiagnosisForm;