'use client'; 
import React, { useEffect, useState } from 'react';
import { RefreshCw, Zap, AlertTriangle, Cpu, Hammer, CheckCircle, XCircle } from 'lucide-react'; // Nuevos iconos
import styles from '../styles/AdvancedDiagnosisForm.module.css'; 

const PRODUCT_TYPES = [
  'Estufa',  
  'Lavadora',
  'Lavasecadora',
  'Refrigerador',
  'Horno (Microondas/Eléctrico)',
  'Aire Acondicionado',
];

const AdvancedDiagnosisForm = () => {
    // --- ESTADOS DE FLUJO Y ODS ---
    const [step, setStep] = useState('ods_input'); // 'ods_input', 'diagnosis_form', 'diagnosis_result'
    const [odsNumber, setOdsNumber] = useState(''); // El Número de ODS ingresado
    const [isOdsRegistered, setIsOdsRegistered] = useState(false); // Si la ODS existe en BD
    const [feedbackSent, setFeedbackSent] = useState(false); // Estado del feedback

    // --- ESTADOS DEL FORMULARIO ---
    const [productType, setProductType] = useState(PRODUCT_TYPES[0]);
    const [model, setModel] = useState('');
    const [symptoms, setSymptoms] = useState('');
    const [errorCode, setErrorCode] = useState('');
    const [diagnosisResult, setDiagnosisResult] = useState(null);

    // --- ESTADOS DE CONTROL ---
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showAdvanced, setShowAdvanced] = useState(false); 
    const [browserDeviceId, setBrowserDeviceId] = useState(''); // Estado para Device ID

    // Efecto para obtener/crear el Device ID (persistencia)
    useEffect(() => {
        let currentDeviceId = localStorage.getItem('ai_device_id');
        if (!currentDeviceId) {
            currentDeviceId = 'dev_' + Date.now() + Math.random().toString(16).slice(2, 6);
            localStorage.setItem('ai_device_id', currentDeviceId);
        }
        setBrowserDeviceId(currentDeviceId);
    }, []);

    // FUNCIÓN 1: Verifica la ODS y avanza al formulario
    const handleOdsCheck = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (!odsNumber.trim()) {
            setError("Por favor, ingresa un número de ODS.");
            setIsLoading(false);
            return;
        }

        try {
            const cleanOds = odsNumber.trim().toUpperCase();

            // Llamada al nuevo endpoint para verificar la ODS
            const response = await fetch('/api/ods/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ odsNumber: cleanOds }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Error al verificar la ODS.');
            }

            const data = await response.json();
            
            setIsOdsRegistered(data.isRegistered);
            
            // Si está registrada, precarga el modelo y tipo de producto
            if (data.isRegistered) {
                 setModel(data.latestModel || '');
                 setProductType(data.latestProductType || PRODUCT_TYPES[0]);
            }
            
            setStep('diagnosis_form');

        } catch (err) {
            setError(err.message || "Error de conexión al verificar la ODS.");
        } finally {
            setIsLoading(false);
        }
    };

    // FUNCIÓN 2: Envía el diagnóstico a la IA
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setDiagnosisResult(null);
        setError(null);
        setFeedbackSent(false); // Resetea el estado de feedback

        if (!productType || !model || !symptoms) {
            setError("Por favor, selecciona el tipo de producto e ingresa el modelo y los síntomas.");
            setIsLoading(false);
            return;
        }
        
        const cleanOds = odsNumber.trim().toUpperCase();
        
        try {
            const response = await fetch('/api/ai-diagnosis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    productType, 
                    model, 
                    symptoms, 
                    errorCode,
                    odsNumber: cleanOds, // <-- ODS
                    browserDeviceId, // <-- ID de máquina para el límite
                }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                // Manejar el error 429 del límite de consultas
                if (response.status === 429) {
                     throw new Error(errorData.mainDiagnosis);
                }
                throw new Error(errorData.error || 'La IA no pudo generar un diagnóstico. Inténtalo de nuevo.');
            }
            const data = await response.json();
            setDiagnosisResult(data);
            setStep('diagnosis_result'); // Pasa a la vista de resultados

        } catch (err) {
            setError(err.message || "Ocurrió un error inesperado al contactar la IA.");
        } finally {
            setIsLoading(false);
        }
    };
    
    // FUNCIÓN 3: Envía el feedback (asociado a la ODS)
    const handleFeedback = async (rating, comment = "") => {
        if (feedbackSent) return;
        
        const originalQuery = { productType, model, symptoms, errorCode };
        
        try {
            await fetch('/api/feedback/submit', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating, comment, originalQuery, odsNumber: odsNumber.trim().toUpperCase() }),
            });
            setFeedbackSent(true);
            setError(null);
        } catch (err) {
            setError("Error al enviar el feedback. Intenta más tarde.");
        }
    };


    const restartDiagnosis = () => { 
        setDiagnosisResult(null); 
        setStep('ods_input'); // Reinicia al inicio (ODS)
        setOdsNumber(''); 
        setModel(''); 
        setSymptoms(''); 
        setErrorCode(''); 
        setShowAdvanced(false); 
        setError(null);
    };

    // ----------------------------------------------------------------------
    // STEP 1: SOLICITAR ODS
    // ----------------------------------------------------------------------
    if (step === 'ods_input') {
        return (
            <div className={styles.card}>
                 <h1 className={styles.heading}>
                    <Cpu className={styles.icon} />
                    Asistente de Prediagnóstico
                 </h1>
                 <p className={styles.subtext}>
                    Para comenzar, ingresa el **Número de Orden de Servicio (ODS)**.
                 </p>
                 <form onSubmit={handleOdsCheck} className={styles.form}>
                    <div className={styles.fieldContainer}>
                        <label className={styles.label}>
                            Número de ODS (Único)
                        </label>
                        <input 
                            type="text" 
                            value={odsNumber} 
                            onChange={(e) => setOdsNumber(e.target.value)} 
                            className={styles.inputField} 
                            required
                        />
                    </div>
                    {error && (
                        <div className={styles.alert}>
                            <AlertTriangle className={styles.iconSmall} /> {error}
                        </div>
                    )}
                    <button 
                        type="submit" 
                        className={styles.primaryButton}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Verificando ODS...' : 'Continuar al Diagnóstico'}
                    </button>
                 </form>
            </div>
        );
    }
    
    // ----------------------------------------------------------------------
    // STEP 2: FORMULARIO DE DIAGNÓSTICO
    // ----------------------------------------------------------------------
    if (step === 'diagnosis_form') {
        return (
            <div className={styles.card}>
                <h1 className={styles.heading}>
                    <Cpu className={styles.icon} />
                    Diagnóstico para ODS: {odsNumber}
                </h1>
                {isOdsRegistered && (
                     <div className={styles.successMessage} style={{ marginBottom: '15px' }}>
                        ¡ODS registrada! Puedes continuar con el modelo **{model}** o cambiarlo.
                     </div>
                )}
                 <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Tipo de Producto */}
                    <div className={styles.fieldContainer}>
                        <label className={styles.label}>Tipo de Producto Samsung</label>
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
                        <label className={styles.label}>Modelo de Equipo (Ej: WA50F9A8DWW)</label>
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
                        <label className={styles.label}>Síntomas (Sé lo más detallado posible)</label>
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
                        <label className={styles.label}>Código de Error (Opcional)</label>
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
                    
                    <button type="button" onClick={() => setStep('ods_input')} className={styles.secondaryButton}>
                        <RefreshCw className={styles.iconSmall} /> Cambiar ODS
                    </button>
                </form>
            </div>
        );
    }

    // ----------------------------------------------------------------------
    // STEP 3: RESULTADOS
    // ----------------------------------------------------------------------
    if (step === 'diagnosis_result') {
        const result = diagnosisResult; 
        
        return (
            <div className={styles.card}>
                <h2 className={styles.heading}>
                    <Cpu className={styles.icon} />
                    Diagnóstico Avanzado para ODS: {odsNumber}
                </h2>
                <p className={styles.subtext}>
                    Producto: <strong>{productType}</strong> | Modelo analizado: <strong>Samsung {model}</strong>
                </p>

                <div className={styles.mainDiagnosisBox}>
                    <h3 className={styles.sectionTitle}>Hipótesis de Falla Principal</h3>
                    <p>{result.mainDiagnosis}</p>
                </div>
                
                {/* --- SECCIÓN FEEDBACK --- */}
                {isOdsRegistered && (
                    <div className={styles.feedbackSection}>
                        <h3 className={styles.sectionTitle}>
                            Tu opinión es vital
                        </h3>
                        {feedbackSent ? (
                            <div className={styles.successMessage}>
                                <CheckCircle className={styles.iconSmall} /> ¡Gracias! Tu valoración ha sido enviada.
                            </div>
                        ) : (
                            <div className={styles.feedbackButtons}>
                                <p>¿Fue útil el diagnóstico de la IA?</p>
                                <button 
                                    type="button" 
                                    onClick={() => handleFeedback('correcta')} 
                                    className={`${styles.primaryButton} ${styles.feedbackCorrecta}`}
                                >
                                    <CheckCircle size={18} /> Correcta
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => handleFeedback('cerca')} 
                                    className={`${styles.primaryButton} ${styles.feedbackCerca}`}
                                >
                                    <AlertTriangle size={18} /> Estuvo Cerca
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => handleFeedback('incorrecta', prompt("Comentario (Opcional):"))} 
                                    className={`${styles.primaryButton} ${styles.feedbackIncorrecta}`}
                                >
                                    <XCircle size={18} /> Incorrecta
                                </button>
                            </div>
                        )}
                    </div>
                )}
                {/* --- FIN SECCIÓN FEEDBACK --- */}


                {/* Contenido restante de resultados (Boletines, Tips, Partes) */}
                {/* ... (Todo el código de resultados que tenías antes) ... */}
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
                         {/* Repuestos Posibles */}
                         <h3 className={styles.sectionTitleRed}>
                             💡 Repuestos Posibles (Para Administración)
                         </h3>
                         <div className={styles.partsContainer}>
                            {result.potentialParts?.map((part, index) => (
                                <div 
                                    key={index} 
                                    className={`${part.isCritical ? styles.partCritical : styles.partStandard} ${part.foundInDB ? styles.partFound : styles.partNotFound}`}
                                >
                                    {/* ... (Contenido de la parte) ... */}
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
                {/* Botón de nuevo diagnóstico */}
                <button 
                    onClick={restartDiagnosis} 
                    className={`${styles.primaryButton} ${styles.restartButton}`}
                >
                    <RefreshCw className={styles.iconSmall} />
                    Finalizar y nueva ODS
                </button>
                
                <button 
                    onClick={() => setStep('diagnosis_form')} 
                    className={styles.secondaryButton}
                    style={{ marginTop: '10px' }}
                >
                    <Cpu className={styles.iconSmall} /> Hacer otro diagnóstico para esta ODS
                </button>
            </div>
        );
    }
};

export default AdvancedDiagnosisForm;