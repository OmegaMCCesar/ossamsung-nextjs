'use client'; 
import React, { useEffect, useState } from 'react';
import { RefreshCw, Zap, AlertTriangle, Cpu, Hammer, CheckCircle, XCircle } from 'lucide-react'; 
import styles from '../styles/AdvancedDiagnosisForm.module.css'; 
import { useAuth } from '../context/UserContext'; // Ajusta la ruta a tu UserContext

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
    
    // --- NUEVA LÓGICA DE ACCESO ---
    const isAnonymous = !user; 
    
    // Si está autenticado Y su rol está en ADVANCED_ROLES, tiene acceso avanzado.
    const hasAdvancedAccess = user && ADVANCED_ROLES.includes(user.role);
    
    // Si está autenticado Y su rol es Admin, tiene acceso ilimitado.
    const hasUnlimitedAccess = user && UNLIMITED_ROLES.includes(user.role);


    // --- ESTADOS DE FLUJO Y ODS ---
    // *** CAMBIO CLAVE: INICIO CONDICIONAL DEL STEP ***
    const [step, setStep] = useState('ods_input'); // Valor por defecto
    
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
        remaining: 50, // Límite por defecto para no-Admin
        limit: 50
    });
    const [diagnosisResult, setDiagnosisResult] = useState(null);

    // --- ESTADOS DE CONTROL ---
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showAdvanced, setShowAdvanced] = useState(false); 
    const [browserDeviceId, setBrowserDeviceId] = useState(''); 
    
    // *** CAMBIO: EFECTO PARA INICIAR EL STEP SI ES ANÓNIMO ***
    useEffect(() => {
        // Inicialización del Device ID (igual que antes)
        let currentDeviceId = localStorage.getItem('ai_device_id');
        if (!currentDeviceId) {
            currentDeviceId = 'dev_' + Date.now() + Math.random().toString(16).slice(2, 6);
            localStorage.setItem('ai_device_id', currentDeviceId);
        }
        setBrowserDeviceId(currentDeviceId);

        // SOLO carga el conteo de uso si NO tiene acceso ilimitado 
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
        
        // Inicializa showAdvanced si el usuario ya cargó
        if (user) {
            setShowAdvanced(ADVANCED_ROLES.includes(user.role));
            setStep('ods_input'); // Logeado: Inicia en ODS
        } else if (!authLoading) {
            // *** SI NO ESTÁ LOGEADO Y YA CARGÓ, SALTAR A FORMULARIO ***
            setStep('diagnosis_form'); 
        }

    }, [user, authLoading, hasUnlimitedAccess]); 

    // Bloqueo si el estado de autenticación aún está cargando Y es anónimo (para evitar salto de paso prematuro)
    if (authLoading && !user) {
        return (
            <div className={styles.card}>
                <h1 className={styles.heading}><Cpu className={styles.icon} /> Asistente de Prediagnóstico</h1>
                <p className={styles.subtext}>Cargando estado de usuario...</p>
            </div>
        );
    }
    
    // FUNCIÓN 1: Verifica la ODS y avanza al formulario (Mantiene la lógica solo para logeados)
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
        setFeedbackSent(false); 
        setShowAdvanced(false); 

        if (!productType || !model || !symptoms) {
            setError("Por favor, selecciona el tipo de producto e ingresa el modelo y los síntomas.");
            setIsLoading(false);
            return;
        }
        
        // *** CAMBIO CLAVE: DEFINICIÓN CONDICIONAL DEL NÚMERO DE ODS ***
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
    
    // FUNCIÓN 3: Envía el feedback (Solo para logeados)
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
        setStep(isAnonymous ? 'diagnosis_form' : 'ods_input'); // Vuelve a ODS si está logeado, si no, al form.
        setOdsNumber(''); 
        setModel(''); 
        setSymptoms(''); 
        setErrorCode(''); 
        setShowAdvanced(false); 
        setError(null);
    };

    // ----------------------------------------------------------------------
    // STEP 1: SOLICITAR ODS (SOLO SI NO ES ANÓNIMO)
    // ----------------------------------------------------------------------
    if (step === 'ods_input' && !isAnonymous) {
        // La verificación de límite aplica a no-Admin 
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
                        className={`${styles.primaryButton} ${disableSubmit ? 'opacity-75 cursor-not-allowed' : ''}`}
                        disabled={disableSubmit}
                    >
                        {isLoading ? (
                            <>
                                <RefreshCw className={`${styles.iconSmall} ${styles.spinner}`} />
                                Analizando con IA...
                            </>
                        ) : (
                            // Muestra el contador SOLO si NO tiene acceso ilimitado
                            `Obtener Diagnóstico Avanzado ${!hasUnlimitedAccess ? `(${usageCount.remaining} restantes)` : ''}`
                        )}
                    </button>
                    {!hasUnlimitedAccess && usageCount.remaining <= 0 && (
                         <div className={styles.alert} style={{ marginTop: '15px', color: '#B91C1C' }}>
                            <AlertTriangle className={styles.iconSmall} /> Has agotado tu límite de consultas diarias.
                         </div>
                    )}
                </form>
            </div>
        );
    }
    
    // ----------------------------------------------------------------------
    // STEP 2: FORMULARIO DE DIAGNÓSTICO (Para anónimos y logeados)
    // ----------------------------------------------------------------------
    if (step === 'diagnosis_form' || (step === 'ods_input' && isAnonymous)) {
        
        // Verifica el límite para Anónimos aquí también (ya que saltó el paso ODS)
        const disableSubmit = isLoading || (!hasUnlimitedAccess && usageCount.remaining <= 0);
        
        return (
            <div className={styles.card}>
                <h1 className={styles.heading}>
                    <Cpu className={styles.icon} />
                    {isAnonymous ? 'Asistente de Prediagnóstico Básico' : `Diagnóstico para ODS: ${odsNumber}`}
                </h1>
                
                {isAnonymous && (
                    <div className={styles.alert} style={{ marginBottom: '15px', color: '#B91C1C' }}>
                        <AlertTriangle className={styles.iconSmall} />
                        **AVISO:** Solo verás el **prediagnóstico y consejos básicos**. Para **Pasos Avanzados, Repuestos** y registro de ODS, por favor <a href="/login">inicia sesión</a>.
                    </div>
                )}
                
                {isOdsRegistered && !isAnonymous && (
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
                        className={`${styles.primaryButton} ${disableSubmit ? 'opacity-75 cursor-not-allowed' : ''}`}
                        disabled={disableSubmit}
                    >
                        {isLoading ? (
                            <>
                                <RefreshCw className={`${styles.iconSmall} ${styles.spinner}`} />
                                Analizando con IA...
                            </>
                        ) : (
                            // Muestra el contador SOLO si NO tiene acceso ilimitado
                            `Obtener Diagnóstico ${!hasUnlimitedAccess ? `(${usageCount.remaining} restantes)` : ''}`
                        )}
                    </button>
                    
                    {!isAnonymous && (
                        <button type="button" onClick={() => setStep('ods_input')} className={styles.secondaryButton}>
                            <RefreshCw className={styles.iconSmall} /> Cambiar ODS
                        </button>
                    )}
                    
                    {!hasUnlimitedAccess && usageCount.remaining <= 0 && (
                         <div className={styles.alert} style={{ marginTop: '15px', color: '#B91C1C' }}>
                            <AlertTriangle className={styles.iconSmall} /> Has agotado tu límite de consultas diarias.
                         </div>
                    )}
                    
                </form>
            </div>
        );
    }

    // ----------------------------------------------------------------------
    // STEP 3: RESULTADOS
    // ----------------------------------------------------------------------
    if (step === 'diagnosis_result') {
        const result = diagnosisResult; 
        
        // El anónimo ve el resultado, pero la información avanzada es vacía.
        const canViewAdvanced = hasAdvancedAccess || showAdvanced;
        
        // ODS a mostrar
        const displayOds = isAnonymous ? 'MODO BÁSICO' : odsNumber;
        
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
                
                {/* --- SECCIÓN FEEDBACK (Solo para logeados) --- */}
                {isOdsRegistered && !isAnonymous && (
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
                    <div className={styles.alert} style={{ marginTop: '15px' }}>
                        <Zap className={styles.iconSmall} /> 
                        **ACCESO RESTRINGIDO:** Los Pasos de Diagnóstico Avanzado y el Listado de Repuestos solo están disponibles para usuarios autenticados (Técnicos, Supervisores, Admin, etc.). Por favor, <a href="/login">inicia sesión</a> para ver la información completa.
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
                {/* ---------------------------------------------------------------------- */}
                {/* FIN DE SECCIÓN CONDICIONAL */}
                {/* ---------------------------------------------------------------------- */}


                {/* Botón de nuevo diagnóstico */}
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