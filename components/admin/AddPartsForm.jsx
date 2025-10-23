'use client';
import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// 1. IMPORTACIÓN CORREGIDA DE FIREBASE
import { db, storage } from "../../lib/firebase"; 
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// 2. IMPORTACIÓN DE ESTILOS CSS MODULES
import styles from '../../styles/AddPartsForm.module.css'; 

const AddPartsForm = () => {
    const [partName, setPartName] = useState('');
    const [partNumber, setPartNumber] = useState('');
    const [modelCompatibility, setModelCompatibility] = useState('');
    const [partFunction, setPartFunction] = useState(''); // Este contendrá la cadena con sinónimos
    const [partImage, setPartImage] = useState(null);
    const [status, setStatus] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus('');

        // Validación básica
        if (!partName || !partNumber || !modelCompatibility || !partImage || !partFunction) {
            setStatus('Error: Todos los campos son obligatorios.');
            setIsSubmitting(false);
            return;
        }

        try {
            // --- 1. PROCESAR MODELOS ---
            const modelsArray = modelCompatibility.split(',')
                                                    .map(m => m.trim().toUpperCase()) 
                                                    .filter(m => m.length > 0);

            if (modelsArray.length === 0) {
                setStatus('Error: Por favor, ingresa al menos un modelo compatible.');
                setIsSubmitting(false);
                return;
            }
            
            // --- 2. PROCESAR SINÓNIMOS DE FUNCIÓN (NUEVA LÓGICA) ---
            // Convierte la cadena 'drenado, drenar, desague' en un array normalizado: ['drenado', 'drenar', 'desague']
            // Y añade la función principal (que usaremos para el match más flexible)
            const functionKeywords = partFunction.split(',')
                                                 .map(k => k.trim().toLowerCase()) // Limpiar y poner en minúsculas
                                                 .filter(k => k.length > 0)
                                                 // Normalizar quitando acentos y caracteres especiales (solo letras/números)
                                                 .map(k => k.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, ''));


            // --- 3. SUBIR IMAGEN Y GUARDAR EN FIRESTORE ---
            const fileExtension = partImage.name.split('.').pop();
            const storagePath = `parts/${partNumber.trim()}.${fileExtension}`;
            const imageRef = ref(storage, storagePath);

            setStatus('Subiendo imagen...');
            await uploadBytes(imageRef, partImage);
            const imageUrl = await getDownloadURL(imageRef);
            setStatus('Imagen subida. Guardando datos en Firestore...');


            await addDoc(collection(db, "partsForDiagnosis"), {
                partName: partName.trim(),
                partNumber: partNumber.trim(),
                modelCompatibility: modelsArray,
                
                // CAMBIO CLAVE: Guardar el Array de sinónimos
                partFunctionKeywords: functionKeywords, 
                // Dejamos partFunction original como referencia (si lo necesitas)
                partFunctionText: partFunction.trim(), 

                imageUrl: imageUrl,
                createdAt: serverTimestamp(), 
            });

            setStatus(`✅ Parte "${partName}" agregada exitosamente.`);
            // Limpiar estados
            setPartName('');
            setPartNumber('');
            setModelCompatibility('');
            setPartFunction('');
            setPartImage(null);
            document.getElementById('partImageInput').value = '';

        } catch (error) {
            console.error("Error al agregar la parte: ", error);
            setStatus(`❌ Error al agregar la parte: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            <h2 className="text-2xl font-bold mb-6 text-gray-800">🛠️ Agregar Parte a Base de Consulta</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Nombre de la Parte */}
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Nombre de la Parte (Ej: Motor Inversor)</label>
                    <input 
                        type="text" 
                        value={partName} 
                        onChange={(e) => setPartName(e.target.value)} 
                        className={styles.inputField}
                        required
                    />
                </div>

                {/* Número de Parte */}
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Número de Parte Oficial (Ej: DC31-00054A)</label>
                    <input 
                        type="text" 
                        value={partNumber} 
                        onChange={(e) => setPartNumber(e.target.value)} 
                        className={styles.inputField}
                        required
                    />
                </div>

                {/* Función de la Parte (Ahora Sinónimos) */}
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                        Función / Sinónimos (Separados por coma: Ej: drenado, drenar, desague)
                    </label>
                    <input 
                        type="text" 
                        value={partFunction} 
                        onChange={(e) => setPartFunction(e.target.value)} 
                        className={styles.inputField}
                        required
                    />
                </div>

                {/* Compatibilidad de Modelos */}
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">
                        Modelos Compatibles (Separados por coma. Ej: WA50F9, WF45H7)
                    </label>
                    <textarea 
                        value={modelCompatibility} 
                        onChange={(e) => setModelCompatibility(e.target.value)} 
                        className={styles.inputField}
                        rows="3"
                        required
                    />
                </div>

                {/* Imagen de la Parte */}
                <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Imagen de la Parte</label>
                    <input 
                        type="file" 
                        id="partImageInput"
                        accept="image/*"
                        onChange={(e) => setPartImage(e.target.files[0])} 
                        className={styles.inputField}
                        required
                    />
                </div>

                {status && (
                    <div className={status.startsWith('✅') ? styles.statusSuccess : styles.statusError}>
                        {status}
                    </div>
                )}

                <button 
                    type="submit" 
                    className={`${styles.primaryButton} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Guardando...' : 'Guardar Parte en BD'}
                </button>
            </form>
        </div>
    );
};

export default AddPartsForm;