'use client'; 
import React, { useEffect, useState } from 'react';
import { RefreshCw, Zap, AlertTriangle, Cpu, Hammer, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'; 
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

const UNLIMITED_ROLES = ['Admin'];
const ADVANCED_ROLES = ['Admin', 'Supervisor', 'TechSupp', 'Tecnico', 'Administrativo'];

const AdvancedDiagnosisForm = () => {
    // --- AUTH & STATE ---
    const { user, loading: authLoading } = useAuth();
    
    // Derived state
    const isAnonymous = !user; 
    const hasAdvancedAccess = user && ADVANCED_ROLES.includes(user.role);

    // Flow State
    const [step, setStep] = useState('ods_input'); 
    const [isOdsRegistered, setIsOdsRegistered] = useState(false); 
    const [odsNumber, setOdsNumber] = useState(''); 
    const [feedbackSent, setFeedbackSent] = useState(false); 

    // Form State
    const [productType, setProductType] = useState(PRODUCT_TYPES[0]);
    const [model, setModel] = useState('');
    const [symptoms, setSymptoms] = useState('');
    const [errorCode, setErrorCode] = useState('');
    const [diagnosisResult, setDiagnosisResult] = useState(null);

    // UI State
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [browserDeviceId, setBrowserDeviceId] = useState(''); 
    
    // --- ESTADO PARA EL TOGGLE DE DETALLES ---
    // Usamos un objeto o un ID para saber cual está abierto. 
    // Si quieres que solo se abra uno a la vez usa un string/number. 
    // Si quieres múltiples abiertos, usa un array. Aquí usaremos un ID único (o index).
    const [expandedPartIndex, setExpandedPartIndex] = useState(null);

    // --- EFFECTS ---
    useEffect(() => {
        let currentDeviceId = localStorage.getItem('ai_device_id');
        if (!currentDeviceId) {
            currentDeviceId = 'dev_' + Date.now() + Math.random().toString(16).slice(2, 6);
            localStorage.setItem('ai_device_id', currentDeviceId);
        }
        setBrowserDeviceId(currentDeviceId);

        if (user) {
            setStep('ods_input'); 
        } else if (!authLoading) {
            setStep('diagnosis_form'); 
        }
    }, [user, authLoading]);

    // --- HANDLERS ---
    
    const handleOdsCheck = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        setFeedbackSent(false);

        if (!odsNumber.trim()) {
            setError("Por favor, ingresa un número de ODS.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/ods/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ odsNumber: odsNumber.trim().toUpperCase() }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Error al verificar ODS.');
            
            setIsOdsRegistered(data.isRegistered);
            if (data.isRegistered) {
                setModel(data.latestModel || '');
                setProductType(data.latestProductType || PRODUCT_TYPES[0]);
            }
            setStep('diagnosis_form');

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setDiagnosisResult(null);
        setError(null);
        setFeedbackSent(false);
        setExpandedPartIndex(null); // Resetear toggles

        try {
            const response = await fetch('/api/ai-diagnosis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    productType, model, symptoms, errorCode,
                    odsNumber: isAnonymous ? 'ANON_GUEST' : odsNumber.trim().toUpperCase(), 
                    browserDeviceId,
                    userRole: user?.role || 'Anonymous', 
                    ascId: user?.ascId || null,
                }),
            });
            
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || data.mainDiagnosis || 'Error en diagnóstico.');
            
            setDiagnosisResult(data);
            setStep('diagnosis_result'); 

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFeedback = async (rating) => {
        if (feedbackSent || isAnonymous) return;
        setFeedbackSent(true);
        // Lógica de fetch feedback...
    };

    const restartDiagnosis = () => { 
        setDiagnosisResult(null); 
        setStep(isAnonymous ? 'diagnosis_form' : 'ods_input'); 
        setOdsNumber(''); 
        setModel(''); 
        setSymptoms(''); 
        setErrorCode(''); 
        setError(null);
        setFeedbackSent(false);
    };

    // Función Toggle
    const togglePartDetails = (index) => {
        if (expandedPartIndex === index) {
            setExpandedPartIndex(null); // Cerrar si ya está abierto
        } else {
            setExpandedPartIndex(index); // Abrir nuevo
        }
    };

    // --- RENDERS ---

    if (authLoading && !user) return <div className={styles.card}>Cargando...</div>;

    // VISTA 1: ODS INPUT
    if (step === 'ods_input' && !isAnonymous) {
        return (
            <div className={styles.card}>
                <h1 className={styles.heading}><Cpu className={styles.icon} /> Asistente Técnico</h1>
                <p className={styles.subtext}>Ingresa la ODS para comenzar el diagnóstico inteligente.</p>
                <form onSubmit={handleOdsCheck} className={styles.form}>
                    <div className={styles.fieldContainer}>
                        <label className={styles.label}>Número de ODS</label>
                        <input 
                            type="text" value={odsNumber} 
                            onChange={(e) => setOdsNumber(e.target.value)} 
                            className={styles.inputField} 
                            placeholder="Ej: 42501234"
                            required 
                        />
                    </div>
                    {error && <div className={styles.alert}><AlertTriangle size={18}/> {error}</div>}
                    <button type="submit" disabled={isLoading} className={styles.primaryButton}>
                        {isLoading ? 'Verificando...' : 'Comenzar Diagnóstico'}
                    </button>
                </form>
            </div>
        );
    }

    // VISTA 2: FORMULARIO
    if (step === 'diagnosis_form') {
        return (
            <div className={styles.card}>
                <h1 className={styles.heading}>
                    <Cpu className={styles.icon} /> 
                    {isAnonymous ? 'Prediagnóstico Básico' : `Diagnóstico ODS: ${odsNumber}`}
                </h1>
                
                {isOdsRegistered && <div className={styles.successMessage}><CheckCircle size={16}/> ODS encontrada. Datos cargados.</div>}
                {isAnonymous && <div className={styles.alert}><Zap size={16}/> Modo Invitado: Funciones limitadas.</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.fieldContainer}>
                        <label className={styles.label}>Producto</label>
                        <select value={productType} onChange={e=>setProductType(e.target.value)} className={styles.inputField}>
                            {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className={styles.fieldContainer}>
                        <label className={styles.label}>Modelo</label>
                        <input type="text" value={model} onChange={e=>setModel(e.target.value)} className={styles.inputField} required/>
                    </div>
                    <div className={styles.fieldContainer}>
                        <label className={styles.label}>Síntomas Detallados</label>
                        <textarea value={symptoms} onChange={e=>setSymptoms(e.target.value)} className={styles.inputField} rows="3" placeholder="Describe el ruido, error o comportamiento..." required/>
                    </div>
                    <div className={styles.fieldContainer}>
                        <label className={styles.label}>Código Error (Opcional)</label>
                        <input type="text" value={errorCode} onChange={e=>setErrorCode(e.target.value)} className={styles.inputField} placeholder="Ej: IE, OE, 4C"/>
                    </div>

                    {error && <div className={styles.alert}><AlertTriangle size={16}/> {error}</div>}
                    
                    <button type="submit" disabled={isLoading} className={styles.primaryButton}>
                        {isLoading ? <><RefreshCw className={`${styles.iconSmall} ${styles.spinner}`}/> Analizando...</> : 'Generar Diagnóstico'}
                    </button>
                    
                    {!isAnonymous && (
                        <button type="button" onClick={restartDiagnosis} className={styles.secondaryButton}>
                             Cambiar número de ODS
                        </button>
                    )}
                </form>
            </div>
        );
    }

    // VISTA 3: RESULTADOS
    if (step === 'diagnosis_result' && diagnosisResult) {
        return (
            <div className={styles.card}>
                <h2 className={styles.heading}><CheckCircle className={styles.icon}/> Resultados del Análisis</h2>
                <p className={styles.subtext}>Basado en síntomas del modelo {model}</p>
                
                <div className={styles.mainDiagnosisBox}>
                    <h3>Diagnóstico Principal</h3>
                    <p>{diagnosisResult.mainDiagnosis}</p>
                </div>

                {/* Boletines */}
                {diagnosisResult.serviceBulletins?.length > 0 && (
                    <div className={styles.bulletinBox}>
                        <h3><AlertTriangle size={18}/> Boletines Técnicos</h3>
                        <ul>
                            {diagnosisResult.serviceBulletins.map((b, i) => (
                                <li key={i}><strong>{b.bulletinNumber}:</strong> {b.issueSummary}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Tips Básicos */}
                <div className={styles.beginnerTipsBox}>
                    <h3>Recomendaciones al Cliente</h3>
                    <p className={styles.textPre}>{diagnosisResult.beginnerTips}</p>
                </div>

                {/* Sección Avanzada (Solo Logueados) */}
                {!isAnonymous && (
                    <div className={styles.advancedContainer}>
                        
                        {/* Pasos Técnicos */}
                        <h3 className={styles.sectionTitleRed}><Hammer size={18}/> Pasos de Reparación</h3>
                        <ol className={styles.stepList}>
                            {diagnosisResult.advancedDiagnosisSteps?.map((s, i) => <li key={i}>{s}</li>)}
                        </ol>

                        {/* Repuestos Sugeridos CON TOGGLE */}
                        <h3 className={styles.sectionTitleRed}>💡 Repuestos Sugeridos</h3>
                        <div className={styles.partsContainer}>
                            {diagnosisResult.potentialParts?.map((part, i) => {
                                const isExpanded = expandedPartIndex === i;
                                return (
                                    <div key={i} className={`${styles.partCardCompact} ${part.isCritical ? styles.partCriticalCompact : ''}`}>
                                        
                                        {/* Cabecera de la tarjeta */}
                                        <div className={styles.partHeader}>
                                            <div>
                                                <div className={styles.partName}>{part.partName}</div>
                                                {part.isCritical && <span className={styles.partBadgeCritical}>CRÍTICO</span>}
                                            </div>
                                            <div className={styles.partNumberBadge}>{part.partNumber || "N/A"}</div>
                                        </div>

                                        {/* Botón Toggle */}
                                        <button 
                                            type="button" 
                                            className={styles.toggleDetailsButton}
                                            onClick={() => togglePartDetails(i)}
                                        >
                                            {isExpanded ? 'Ocultar detalles' : 'Ver detalles técnicos'}
                                            {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                                        </button>

                                        {/* Contenido Expandible */}
                                        {isExpanded && (
                                            <div className={styles.partDetailsExpanded}>
                                                {part.imageUrl && (
                                                    <img src={part.imageUrl} className={styles.partImage} alt={part.partName} />
                                                )}
                                                
                                                <div className={styles.detailRow}>
                                                    <span className={styles.detailLabel}>Análisis IA:</span>
                                                    {part.reason}
                                                </div>
                                                
                                                {part.partFunction && (
                                                    <div className={styles.detailRow}>
                                                        <span className={styles.detailLabel}>Función:</span>
                                                        {part.partFunction}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Feedback */}
                {!isAnonymous && !feedbackSent && (
                    <div className={styles.feedbackSection}>
                        <p>¿Fue preciso este diagnóstico?</p>
                        <div className={styles.feedbackButtons}>
                            <button onClick={() => handleFeedback('good')} className={styles.primaryButton} style={{padding: '8px 16px', fontSize: '0.9rem'}}><CheckCircle size={16}/> Sí, Correcto</button>
                            <button onClick={() => handleFeedback('bad')} className={styles.secondaryButton} style={{padding: '8px 16px', fontSize: '0.9rem'}}><XCircle size={16}/> No ayudó</button>
                        </div>
                    </div>
                )}

                <button onClick={restartDiagnosis} className={`${styles.primaryButton} ${styles.restartButton}`}>
                    <RefreshCw size={18}/> Realizar nueva consulta
                </button>
            </div>
        );
    }
    
    return null;
};

export default AdvancedDiagnosisForm;