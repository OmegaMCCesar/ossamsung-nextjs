// components/ServiceBulletinForm.js
'use client'; 
import React, { useState } from 'react';
import { FileText, PlusCircle, Trash2, Save, AlertTriangle } from 'lucide-react';
// Asumimos que los estilos están disponibles en la misma ubicación
import styles from '../../styles/AdvancedDiagnosisForm.module.css'; 

const ServiceBulletinForm = () => {
    const [bulletinName, setBulletinName] = useState('');
    const [bulletinNumber, setBulletinNumber] = useState('');
    const [issueSummary, setIssueSummary] = useState('');
    const [modelsInput, setModelsInput] = useState(''); // Campo temporal para ingresar modelos
    const [modelsList, setModelsList] = useState([]); // Lista final de modelos
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null); // Para éxito o error
    const [isError, setIsError] = useState(false);

    // Función para añadir modelos desde la entrada de texto
    const handleAddModels = () => {
        if (!modelsInput.trim()) return;

        // Separa los modelos por comas o saltos de línea y los limpia
        const newModels = modelsInput
            .toUpperCase()
            .split(/[\s,]+/) // Split por espacios o comas
            .map(model => model.trim())
            .filter(model => model.length > 3); // Solo modelos con más de 3 caracteres

        // Añadir solo los modelos que no están ya en la lista
        const uniqueNewModels = newModels.filter(model => !modelsList.includes(model));
        
        setModelsList([...modelsList, ...uniqueNewModels]);
        setModelsInput('');
    };

    // Función para remover un modelo de la lista
    const handleRemoveModel = (modelToRemove) => {
        setModelsList(modelsList.filter(model => model !== modelToRemove));
    };

    // Función principal de envío
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        setIsError(false);

        if (!bulletinName || !bulletinNumber || !issueSummary || modelsList.length === 0) {
            setMessage("Por favor, completa todos los campos requeridos y añade al menos un modelo.");
            setIsError(true);
            return;
        }

        setIsLoading(true);

        const newBulletin = {
            bulletinName,
            bulletinNumber,
            issueSummary,
            models: modelsList,
        };

        try {
            const response = await fetch('/api/bulletins/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newBulletin),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Fallo al guardar el boletín.');
            }

            // Éxito: Limpiar formulario y mostrar mensaje
            setMessage("✅ Boletín de servicio guardado exitosamente.");
            setBulletinName('');
            setBulletinNumber('');
            setIssueSummary('');
            setModelsList([]);
            setModelsInput('');

        } catch (err) {
            setMessage(err.message || "Ocurrió un error inesperado al guardar.");
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.card}>
            <h1 className={styles.heading}>
                <FileText className={styles.icon} />
                Gestión de Boletines de Servicio
            </h1>
            <p className={styles.subtext}>
                Ingrese la información oficial de un nuevo boletín de servicio.
            </p>

            <form onSubmit={handleSubmit} className={styles.form}>
                
                {/* Nombre del Boletín */}
                <div className={styles.fieldContainer}>
                    <label className={styles.label}>
                        Nombre del Boletín (Ej: Actualización de Software de Centrifugado)
                    </label>
                    <input 
                        type="text" 
                        value={bulletinName} 
                        onChange={(e) => setBulletinName(e.target.value)} 
                        className={styles.inputField} 
                        required
                    />
                </div>

                {/* Número de Boletín */}
                <div className={styles.fieldContainer}>
                    <label className={styles.label}>
                        Número del Boletín (Ej: SBC-2024-005)
                    </label>
                    <input 
                        type="text" 
                        value={bulletinNumber} 
                        onChange={(e) => setBulletinNumber(e.target.value)} 
                        className={styles.inputField} 
                        required
                    />
                </div>

                {/* Resumen del Problema */}
                <div className={styles.fieldContainer}>
                    <label className={styles.label}>
                        Resumen del Problema / Solución
                    </label>
                    <textarea 
                        value={issueSummary} 
                        onChange={(e) => setIssueSummary(e.target.value)} 
                        className={styles.inputField}
                        rows="3"
                        required
                        placeholder="Ej: Falla intermitente de centrifugado por incompatibilidad de sensor. Se requiere actualización de PCB."
                    />
                </div>

                {/* Modelos Aplicables */}
                <div className={`${styles.fieldContainer} ${styles.modelInputGroup}`}>
                    <label className={styles.label}>
                        Modelos Aplicables (Separar por coma o espacio)
                    </label>
                    <div className={styles.inputWithButton}>
                        <input 
                            type="text" 
                            value={modelsInput} 
                            onChange={(e) => setModelsInput(e.target.value)} 
                            className={styles.inputField} 
                            placeholder="Ej: WA50F9A8DWW, WA50F9A8DWS"
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddModels(); } }}
                        />
                        <button 
                            type="button" 
                            onClick={handleAddModels} 
                            className={styles.secondaryButton}
                        >
                            <PlusCircle size={18} /> Añadir
                        </button>
                    </div>

                    {/* Lista de Modelos Añadidos */}
                    <div className={styles.modelsTagsContainer}>
                        {modelsList.map(model => (
                            <span key={model} className={styles.modelTag}>
                                {model}
                                <button type="button" onClick={() => handleRemoveModel(model)} className={styles.modelTagRemove}>
                                    <Trash2 size={12} />
                                </button>
                            </span>
                        ))}
                        {modelsList.length === 0 && <p className={styles.mutedText}>Aún no hay modelos agregados.</p>}
                    </div>
                </div>

                {/* Mensajes de estado */}
                {message && (
                    <div className={isError ? styles.alert : styles.successMessage}>
                        {isError ? <AlertTriangle className={styles.iconSmall} /> : null} {message}
                    </div>
                )}

                {/* Botón de envío */}
                <button 
                    type="submit" 
                    className={`${styles.primaryButton} ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Save className={`${styles.iconSmall} ${styles.spinner}`} />
                            Guardando...
                        </>
                    ) : (
                        <>
                            <Save className={styles.iconSmall} />
                            Guardar Boletín en Base de Datos
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default ServiceBulletinForm;