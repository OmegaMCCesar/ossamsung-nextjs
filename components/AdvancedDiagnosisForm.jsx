'use client'; 
import React, { useEffect, useState } from 'react';
import { RefreshCw, Zap, AlertTriangle, Cpu, Hammer, CheckCircle, XCircle } from 'lucide-react'; 
import styles from '../styles/AdvancedDiagnosisForm.module.css'; 
import { useAuth } from '../context/UserContext'; 

const PRODUCT_TYPES = [
    'Estufa',  
    'Lavadora',
    'Lavasecadora',
    'Refrigerador',
    'Horno (Microondas/Eléctrico)',
    'Aire Acondicionado',
];

// Roles que tienen uso ilimitado
const UNLIMITED_ROLES = ['Admin'];

// Roles que tienen acceso a la información avanzada (Pasos Avanzados y Partes)
const ADVANCED_ROLES = ['Admin', 'Supervisor', 'TechSupp', 'Tecnico', 'Administrativo'];

const AdvancedDiagnosisForm = () => {
    // --- 1. OBTENER ESTADO DEL USUARIO ---
    const { user, loading: authLoading } = useAuth();
    
    // --- LÓGICA DE ACCESO ---
    const isAnonymous = !user; 
    const hasAdvancedAccess = user && ADVANCED_ROLES.includes(user.role);
    const hasUnlimitedAccess = user && UNLIMITED_ROLES.includes(user.role);


    // --- ESTADOS DE FLUJO Y ODS ---
    const [step, setStep] = useState('ods_input'); 
    
    // Lo usaremos al cargar el componente
    const [isOdsRegistered, setIsOdsRegistered] = useState(false); 
    const [odsNumber, setOdsNumber] = useState(''); 
    const [feedbackSent, setFeedbackSent] = useState(false); 

    // --- ESTADOS DEL FORMULARIO ---
    const [productType, setProductType] = useState(PRODUCT_TYPES[0]);
    const [model, setModel] = useState('');
    const [symptoms, setSymptoms] = useState('');
    const [errorCode, setErrorCode] = useState('');
    const [usageCount, setUsageCount] = useState({ 
        currentCount: 0,
        remaining: 50, 
        limit: 50
    });
    const [diagnosisResult, setDiagnosisResult] = useState(null);

    // --- ESTADOS DE CONTROL ---
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showAdvanced, setShowAdvanced] = useState(false); 
    const [browserDeviceId, setBrowserDeviceId] = useState(''); 

    const [selectedPart, setSelectedPart] = useState(null);
    const [showPartModal, setShowPartModal] = useState(false);

    const openPartModal = (part) => {
       setSelectedPart(part);
       setShowPartModal(true);
    };

    const closePartModal = () => {
      setShowPartModal(false);
      setSelectedPart(null);
    };

    
    useEffect(() => {
        let currentDeviceId = localStorage.getItem('ai_device_id');
        if (!currentDeviceId) {
            currentDeviceId = 'dev_' + Date.now() + Math.random().toString(16).slice(2, 6);
            localStorage.setItem('ai_device_id', currentDeviceId);
        }
        setBrowserDeviceId(currentDeviceId);

        if (!hasUnlimitedAccess && currentDeviceId) {
            const fetchUsageCount = async (deviceId) => {
                try {
                    const response = await fetch('/api/usage/count', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ browserDeviceId: deviceId }),
                    });
                    const data = await response.json();
                    setUsageCount(data);
                } catch (err) {
                    console.error("No se pudo cargar el conteo de uso.");
                }
            };
            fetchUsageCount(currentDeviceId);
        }
        
        if (user) {
            setShowAdvanced(ADVANCED_ROLES.includes(user.role));
            setStep('ods_input'); 
        } else if (!authLoading) {
            setStep('diagnosis_form'); 
        }

    }, [user, authLoading, hasUnlimitedAccess]); 

    if (authLoading && !user) {
        return (
            <div className={styles.card}>
                <h1 className={styles.heading}><Cpu className={styles.icon} /> Asistente de Prediagnóstico</h1>
                <p className={styles.subtext}>Cargando estado de usuario...</p>
            </div>
        );
    }
    
    // FUNCIÓN 1: Verifica la ODS y avanza al formulario 
    const handleOdsCheck = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        setFeedbackSent(false); // Resetear feedback al iniciar una nueva ODS

        if (!odsNumber.trim()) {
            setError("Por favor, ingresa un número de ODS.");
            setIsLoading(false);
            return;
        }

        try {
            const cleanOds = odsNumber.trim().toUpperCase();
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
        setFeedbackSent(false); // **Importante**: Resetear al enviar nuevo diagnóstico
        setShowAdvanced(false); 

        if (!productType || !model || !symptoms) {
            setError("Por favor, selecciona el tipo de producto e ingresa el modelo y los síntomas.");
            setIsLoading(false);
            return;
        }
        
        const cleanOds = isAnonymous ? 'ANON_GUEST' : odsNumber.trim().toUpperCase();
        
        try {
            const response = await fetch('/api/ai-diagnosis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    productType, 
                    model, 
                    symptoms, 
                    errorCode,
                    odsNumber: cleanOds, 
                    browserDeviceId,
                    userRole: user?.role || 'Anonymous', 
                    ascId: user?.ascId || null,
                }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 429) {
                        throw new Error(errorData.mainDiagnosis);
                }
                throw new Error(errorData.error || 'La IA no pudo generar un diagnóstico. Inténtalo de nuevo.');
            }
            const data = await response.json();
            setDiagnosisResult(data);
            setStep('diagnosis_result'); 

        } catch (err) {
            setError(err.message || "Ocurrió un error inesperado al contactar la IA.");
        } finally {
            setIsLoading(false);
        }
    };
    
    // FUNCIÓN 3: Envía el feedback
    const handleFeedback = async (rating, comment = "") => {
        if (feedbackSent || isAnonymous) return;
        
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
        setStep(isAnonymous ? 'diagnosis_form' : 'ods_input'); 
        setOdsNumber(''); 
        setModel(''); 
        setSymptoms(''); 
        setErrorCode(''); 
        setShowAdvanced(false); 
        setError(null);
        setFeedbackSent(false); // Asegurar el reset
        setIsOdsRegistered(false); // Asegurar el reset de ODS
    };

    // ... Renderizado de Step 1: ODS_INPUT (No cambia)
    if (step === 'ods_input' && !isAnonymous) {
        const disableSubmit = isLoading || (!hasUnlimitedAccess && usageCount.remaining <= 0);
        
        return (
            <div className={styles.card}>
                <h1 className={styles.heading}>
                    <Cpu className={styles.icon} />
                    Asistente de Prediagnóstico (Acceso Técnico)
                </h1>
                <p className={styles.subtext}>
                    Para comenzar, ingresa el **Número de Orden de Servicio (ODS)**.
                </p>
                <form onSubmit={handleOdsCheck} className={styles.form}>
                    <div className={`${styles.fieldContainer} ${styles.fullWidthField}`}>
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
                    <div className={styles.fullWidthField}  >
                    <button 
                        type="submit" 
                        className={`${styles.primaryButton} ${disableSubmit ? styles.disabledButton : ''}`}
                        disabled={disableSubmit}
                    >
                        {isLoading ? (
                            <>
                                <RefreshCw className={`${styles.iconSmall} ${styles.spinner}`} />
                                Analizando ODS...
                            </>
                        ) : (
                            `Obtener Diagnóstico Avanzado ${!hasUnlimitedAccess ? `(${usageCount.remaining} restantes)` : ''}`
                        )}
                    </button>
                    </div>
                    {!hasUnlimitedAccess && usageCount.remaining <= 0 && (
                         <div className={styles.alert} style={{ marginTop: '15px' }}>
                            <AlertTriangle className={styles.iconSmall} /> Has agotado tu límite de consultas diarias.
                         </div>
                    )}
                </form>
            </div>
        );
    }

    // ... Renderizado de Step 2: DIAGNOSIS_FORM (No cambia significativamente)
    if (step === 'diagnosis_form' || (step === 'ods_input' && isAnonymous)) {
        const disableSubmit = isLoading || (!hasUnlimitedAccess && usageCount.remaining <= 0);
        
        return (
            <div className={styles.card}>
                <h1 className={styles.heading}>
                    <Cpu className={styles.icon} />
                    {isAnonymous ? 'Asistente de Prediagnóstico Básico' : `Diagnóstico para ODS: ${odsNumber}`}
                </h1>
                
                {isAnonymous && (
                    <div className={styles.alert}>
                        <AlertTriangle className={styles.iconSmall} />
                        **AVISO:** Solo verás el **prediagnóstico y consejos básicos**. Para **Pasos Avanzados, Repuestos** y registro de ODS, por favor <a href="/login">inicia sesión</a>.
                    </div>
                )}
                
                {isOdsRegistered && !isAnonymous && (
                    <div className={styles.successMessage}>
                        ¡ODS registrada! Puedes continuar con el modelo **{model}** o cambiarlo.
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Tipo de Producto */}
                    <div className={`${styles.fieldContainer} ${styles.fullWidthField}`}>
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
                    <div className={`${styles.fieldContainer} ${styles.fullWidthField}`}>
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
                    <div className={`${styles.fieldContainer} ${styles.fullWidthField}`}>
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
                    <div className={`${styles.fieldContainer} ${styles.fullWidthField}`}>
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
                    <div className={styles.fullWidthField} >
                    <button 
                        type="submit" 
                        className={`${styles.primaryButton} ${disableSubmit ? styles.disabledButton : ''}`}
                        disabled={disableSubmit}
                    >
                        {isLoading ? (
                            <>
                                <RefreshCw className={`${styles.iconSmall} ${styles.spinner}`} />
                                Analizando con IA...
                            </>
                        ) : (
                            `Obtener Diagnóstico ${!hasUnlimitedAccess ? `(${usageCount.remaining} restantes)` : ''}`
                        )}
                    </button>
                    </div>
                    
                    {!isAnonymous && (
                        <div className={styles.fullWidthField} >
                        <button type="button" onClick={() => setStep('ods_input')} className={styles.secondaryButton}>
                            <RefreshCw className={styles.iconSmall} /> Cambiar ODS
                        </button>
                        </div>
                    )}
                    
                    {!hasUnlimitedAccess && usageCount.remaining <= 0 && (
                         <div className={styles.alert} style={{ marginTop: '15px' }}>
                            <AlertTriangle className={styles.iconSmall} /> Has agotado tu límite de consultas diarias.
                         </div>
                    )}
                    
                </form>
            </div>
        );
    }

    // ----------------------------------------------------------------------
    // STEP 3: RESULTADOS (LÓGICA DE FEEDBACK MEJORADA)
    // ----------------------------------------------------------------------
    if (step === 'diagnosis_result') {
        const result = diagnosisResult; 
        const canViewAdvanced = hasAdvancedAccess || showAdvanced;
        const displayOds = isAnonymous ? 'MODO BÁSICO' : odsNumber;
        
        // **Lógica de visualización de Feedback:** Se muestra si está logeado Y la ODS no es el marcador de anónimo
        const shouldShowFeedback = !isAnonymous && odsNumber.trim().toUpperCase() !== 'ANON_GUEST';
        
        return (
            <div className={styles.card}>
                <h2 className={styles.heading}>
                    <Cpu className={styles.icon} />
                    Diagnóstico {isAnonymous ? 'Básico' : 'Avanzado'} para: {displayOds}
                </h2>
                <p className={styles.subtext}>
                    Producto: <strong>{productType}</strong> | Modelo analizado: <strong>Samsung {model}</strong>
                </p>

                <div className={styles.mainDiagnosisBox}>
                    <h3 className={styles.sectionTitle}>Hipótesis de Falla Principal</h3>
                    <p>{result.mainDiagnosis}</p>
                </div>
                
                {/* --- SECCIÓN FEEDBACK (CORREGIDA) --- */}
                {shouldShowFeedback && (
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

                {/* Contenido de resultados básicos (Boletines y Tips para el usuario) */}
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
                    <h3 className={styles.sectionTitle}>Guía para el Cliente (Nivel Básico)</h3>
                    <p className={styles.textPre}>{result.beginnerTips}</p>
                </div>

                {/* --- MENSAJE DE ACCESO RESTRINGIDO PARA ANÓNIMOS --- */}
                {isAnonymous && (
                    <div className={styles.alert}>
                        <Zap className={styles.iconSmall} /> 
                        **ACCESO RESTRINGIDO:** Los Pasos de Diagnóstico Avanzado y el Listado de Repuestos solo están disponibles para usuarios autenticados. Por favor, <a href="/login">inicia sesión</a> para ver la información completa.
                    </div>
                )}


                {/* Contenido AVANZADO: Solo se muestra si tiene acceso avanzado Y NO es anónimo */}
                {(canViewAdvanced) && !isAnonymous && (
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
      className={`${styles.partCardCompact} ${part.isCritical ? styles.partCriticalCompact : ''}`}
    >
      {/* Imagen */}
      {part.imageUrl ? (
        <img src={part.imageUrl} alt={part.partName} className={styles.partCompactImage} />
      ) : (
        <div className={styles.partCompactImagePlaceholder}>
          <Zap className={styles.iconSmall} />
        </div>
      )}

      {/* Contenido */}
      <div className={styles.partCompactContent}>
        
        <p className={styles.partCompactName}>
          {part.partName}
        </p>

        {part.isCritical && (
          <span className={styles.partCriticalBadge}>CRÍTICO</span>
        )}

        <p className={styles.partCompactNumber}>
          Nº Parte: <strong>{part.partNumber || "N/A"}</strong>
        </p>

        <button 
          className={styles.partDetailsButton}
          onClick={() => openPartModal(part)}
        >
          Ver más
        </button>
      </div>
    </div>
  ))}
</div>

                    </div>
                )}
                
                {showPartModal && selectedPart && (
  <div className={styles.partModalOverlay}>
    <div className={styles.partModal}>
      
      <button className={styles.modalCloseButton} onClick={closePartModal}>
        ✕
      </button>

      <img 
        src={selectedPart.imageUrl} 
        alt={selectedPart.partName} 
        className={styles.modalImage} 
      />

      <h2 className={styles.modalTitle}>{selectedPart.partName}</h2>

      {selectedPart.isCritical && (
        <span className={styles.modalCriticalBadge}>CRÍTICO</span>
      )}

      <p className={styles.modalPartNumber}>
        <strong>Número de parte:</strong> {selectedPart.partNumber || "N/A"}
      </p>

      {selectedPart.partFunction && (
        <p className={styles.modalDescription}>
          <strong>Función:</strong> {selectedPart.partFunction}
        </p>
      )}

      {selectedPart.reason && (
        <p className={styles.modalReason}>
          <strong>Motivo:</strong> {selectedPart.reason}
        </p>
      )}

    </div>
  </div>
)}


                {/* Botones de navegación */}
                <button 
                    onClick={restartDiagnosis} 
                    className={`${styles.primaryButton} ${styles.restartButton}`}
                >
                    <RefreshCw className={styles.iconSmall} />
                    {isAnonymous ? 'Nueva Consulta' : 'Finalizar y nueva ODS'}
                </button>
                
                <button 
                    onClick={() => setStep('diagnosis_form')} 
                    className={styles.secondaryButton}
                    style={{ marginTop: '10px' }}
                >
                    <Cpu className={styles.iconSmall} /> Hacer otro diagnóstico para est{isAnonymous ? 'a consulta' : 'a ODS'}
                </button>
            </div>
        );
    }
};

export default AdvancedDiagnosisForm;