// pages/equips.js
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link'; // Usamos Link de Next.js
import { useRouter } from 'next/router'; // Usamos useRouter de Next.js

// Asegúrate que estas importaciones apunten a la ubicación correcta en tu proyecto Next.js
import useFetchInfFirebase from '../hooks/useFetchInfFirebase'; // Ruta a tu hook
import { useAuth } from '../context/UserContext'; // Ruta a tu contexto de autenticación
import { db } from '../lib/firebase'; // Ruta a tu configuración de Firebase
import { doc, increment, runTransaction } from 'firebase/firestore';

// Importa el módulo CSS específico para esta página
import styles from '../styles/equips.module.css';

// Renombramos el componente a algo más descriptivo
const EquipsPage = () => {
  // --- State Management ---
  const router = useRouter(); // Usamos useRouter de next/router para navegación
  const { user } = useAuth(); // Obtiene el usuario del contexto de autenticación

  // Estados para filtros y data fetching
  const [category, setCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  // Hook para fetchear datos de Firebase (asegúrate que es compatible con Next.js)
  const { data, loading, error } = useFetchInfFirebase(category, searchTerm);

  // Estados para el proceso de selección multi-paso
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedDefectBlock, setSelectedDefectBlock] = useState(null);
  const [selectedSymptom, setSelectedSymptom] = useState(null);
  const [selectedSubSymptom, setSelectedSubSymptom] = useState(null);
  const [selectedRepairCode, setSelectedRepairCode] = useState(null);
  const [selectedSubRepairCode, setSelectedSubRepairCode] = useState(null);

  // Estado para controlar la visibilidad del resumen
  const [showSummary, setShowSummary] = useState(false);

  // Estado para el input del código ASC
  const [ascCode, setAscCode] = useState('');

  // Lista de códigos ASC válidos (considera fetchearla de Firebase si crece)
  const validAscCodes = useMemo(() => [
    'Techsup','1401501','6283007' , '4907726',
    '1658952', '1658994', '1659040', '4301958', '1659075', '1659136', '1729840', '1729975', '1729981', '1730172', '1730213', '1730257', '3453191', '2485007', '1730369', '3329308', '3490802', '3350595', '3375393', '3188990', '3329209', '3403522', '3404483', '3441335', '2277262', '3456937', '3464868', '3465902', '3467737', '3491791', '3861676', '6420071', '3903559', '4156881', '4156884', '4156883', '4160663', '4204348', '4243700', '4254175', '4271992', '3887111', '4292179', '4366954', '4375230', '4377174', '4789474', '4789476', '4894172', '4906330', '4923659', '4923680', '4932655', '4939874', '4953466', '4953467', '4962883', '4979868', '5777171', '5777172', '5779775', '5785173', '5788233', '5791986', '5798519', '5930135', '5939508', '5944496', '5949511', '5954013', '5968133', '5978055', '6423092', '6423093', '6423094', '5981427', '5984693', '5995041', '6421187', '6420072', '5999767', '6078654', '6082798', '4220824', '6162465', '4769819', '6205424', '6216903', '3491830', '6266448', '3191645', '5283007', '3865192', '2484362', '5288709', '6288721', '6288722', '6428335', '8334950', '8381572', '8395034', '9216816', '2470144','Cessoss','Sariwis'
  ], []);

  // Estado derivado para validación del código ASC
  const isAscCodeValid = useMemo(() => validAscCodes.includes(ascCode), [ascCode, validAscCodes]);

  // --- Handlers para Navegación/Selección ---

  const handleModelClick = (model) => {
    setSelectedModel(model);
    // Reset subsequent selections
    setSelectedDefectBlock(null);
    setSelectedSymptom(null);
    setSelectedSubSymptom(null);
    setSelectedRepairCode(null);
    setSelectedSubRepairCode(null);
    setShowSummary(false);
  };

  // Adaptado para usar router.push de next/router



  const handleDefectBlockClick = (block) => {
    setSelectedDefectBlock(block);
    // Reset subsequent selections
    setSelectedSymptom(null);
    setSelectedSubSymptom(null);
    setSelectedRepairCode(null);
    setSelectedSubRepairCode(null);
    setShowSummary(false);
  };

  const handleSymptomClick = (symptom) => {
    setSelectedSymptom(symptom);
    // Reset subsequent selections
    setSelectedSubSymptom(null);
    setSelectedRepairCode(null);
    setSelectedSubRepairCode(null);
    setShowSummary(false);
  };

  const handleSubSymptomClick = (subSymptom) => {
    setSelectedSubSymptom(subSymptom);
    // Reset subsequent selections
    setSelectedRepairCode(null);
    setSelectedSubRepairCode(null);
    setShowSummary(false);
  };

  const handleRepairCodeClick = (repair) => {
    setSelectedRepairCode(repair);
    // Reset subsequent selections
    setSelectedSubRepairCode(null);
    setShowSummary(false);
  };

  const handleSubRepairCodeClick = (subRepair) => {
    setSelectedSubRepairCode(subRepair);
    // Al final de la cadena de selección, muestra el resumen
    setShowSummary(true);
  };

  // Función para resetear todas las selecciones
  const handleReset = () => {
    setSelectedModel(null);
    setSelectedDefectBlock(null);
    setSelectedSymptom(null);
    setSelectedSubSymptom(null);
    setSelectedRepairCode(null);
    setSelectedSubRepairCode(null);
    setShowSummary(false);
    // Opcional: Resetear código ASC también, si es el flujo deseado
    // setAscCode('');
  };

  // Handler para los botones "Volver"
  const handleBack = (step) => {
    switch (step) {
      case 'model':
        handleReset(); // Volver a selección de modelo (resetea todo)
        break;
      case 'defectBlock':
        setSelectedDefectBlock(null);
        setSelectedSymptom(null);
        setSelectedSubSymptom(null);
        setSelectedRepairCode(null);
        setSelectedSubRepairCode(null);
        setShowSummary(false);
        break;
      case 'symptom':
        setSelectedSymptom(null);
        setSelectedSubSymptom(null);
        setSelectedRepairCode(null);
        setSelectedSubRepairCode(null);
        setShowSummary(false);
        break;
      case 'subSymptom':
        setSelectedSubSymptom(null);
        setSelectedRepairCode(null);
        setSelectedSubRepairCode(null);
        setShowSummary(false);
        break;
      case 'repairCode':
        setSelectedRepairCode(null);
        setSelectedSubRepairCode(null);
        setShowSummary(false);
        break;
      default:
        break;
    }
  };

  // --- Effect Hook para Lógica de Firebase (Registrar Uso de Código ASC) ---
  // Se ejecuta cuando el código ASC es válido, se muestra el resumen y hay código ASC
  useEffect(() => {
    // Solo procede si el código ASC es válido, se muestra el resumen, hay código ASC y la DB está inicializada
    if (isAscCodeValid && showSummary && ascCode && db) {
      console.log(`Condiciones cumplidas para registrar uso: Código ASC=${ascCode}`);

      const ascCodeRef = doc(db, "ascCodeUsage", ascCode); // Colección "ascCodeUsage", documento con ID = ascCode

      const updateUsage = async () => {
        try {
          // Usa una transacción para asegurar que la operación sea atómica
          await runTransaction(db, async (transaction) => {
            const ascDoc = await transaction.get(ascCodeRef);
            if (!ascDoc.exists()) {
              // Si el documento no existe, créalo con 'usageCount' en 1
              transaction.set(ascCodeRef, {
                code: ascCode,
                usageCount: 1,
                lastUsed: new Date() // Opcional: guarda timestamp del último uso
              });
              console.log(`Firebase: Nuevo código ASC ${ascCode} registrado con usageCount 1.`);
            } else {
              // Si existe, incrementa 'usageCount'
              transaction.update(ascCodeRef, {
                usageCount: increment(1),
                lastUsed: new Date() // Opcional: actualiza timestamp
              });
              console.log(`Firebase: Código ASC ${ascCode} actualizado. Nuevo usageCount: ${ascDoc.data().usageCount + 1}`);
            }
          });
        } catch (e) {
          console.error("Firebase: Error actualizando uso de código ASC: ", e);
          // Manejar el error, ej. mostrar un mensaje amigable al usuario
        }
      };

      updateUsage();

    } else {
       // console.log(`Condiciones NO cumplidas para registrar uso: isValid=${isAscCodeValid}, showSummary=${showSummary}, ascCode=${ascCode}`);
    }
    // Dependencias del useEffect. Asegúrate que db es una dependencia estable.
  }, [isAscCodeValid, showSummary, ascCode, db]);


  // --- Función Helper para Renderizar Contenido según la Etapa de Selección ---
  const renderContent = () => {
    // Aplica clases del nuevo módulo CSS a todos los elementos
    if (loading) {
      return <div className={styles.message}>Cargando...</div>;
    }

    if (error) {
      return <div className={`${styles.message} ${styles.errorMessage}`}>Error: {error.message}</div>;
    }

    // Mensajes de validación de código ASC
    if (!isAscCodeValid && ascCode) {
        return (
         <div className={styles.errorContainer}>
           <h2 className={styles.errorMessageTitle}>Código de centro de servicio no válido</h2>
           <p className={styles.errorDescription}>Por favor, verifica el código ingresado.</p>
         </div>
       );
    }

    if (!isAscCodeValid && !ascCode) {
        return (
         <div className={styles.messageContainer}>
           <p className={styles.initialMessage}>
             Primero, ingresa el código de tu centro de servicio para comenzar a usar la plataforma.
           </p>
         </div>
       );
    }


    // Si código ASC es válido, procede con el flujo de selección
    if (showSummary) {
      return (
        <div className={styles.summary}>
          <h2 className={styles.summaryTitle}>Resumen de Selección</h2>
          <div className={styles.summaryDetails}>
              <p><strong>Modelo:</strong> {selectedModel?.productName}</p>
              <p><strong>Bloque de defecto:</strong> {selectedDefectBlock?.defectBlock}</p>
              <p><strong>Síntoma:</strong> {selectedSymptom?.symptomCode}</p>
              <p><strong>Sub-Síntoma:</strong> {selectedSubSymptom?.subSymptomCode}</p>
              <p><strong>Código de reparación:</strong> {selectedRepairCode?.repairCode}</p>
              <p><strong>Sub-Código de reparación:</strong> {selectedSubRepairCode}</p>
          </div>
          <button onClick={handleReset} className={styles.resetButton}>
            Reiniciar Selección
          </button>
        </div>
      );
    }

    if (selectedRepairCode) {
      // Muestra Sub-Códigos de reparación
      return (
        <div className={styles.selectionList}>
          <button onClick={() => handleBack('repairCode')} className={styles.backButton}>
            Volver a códigos de reparación
          </button>
          <h2 className={styles.selectionTitle}>Sub-Códigos de reparación para {selectedRepairCode.repairCode}</h2>
          {selectedRepairCode.subRepairCodes && selectedRepairCode.subRepairCodes.length > 0 ? (
            <ul className={styles.list}>
              {selectedRepairCode.subRepairCodes.map((subRep, subRepIndex) => (
                <li
                  key={subRepIndex}
                  onClick={() => handleSubRepairCodeClick(subRep)}
                  className={styles.clickableItem}
                >
                  {subRep}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.noResults}>No hay sub-códigos de reparación disponibles.</p>
          )}
        </div>
      );
    }

    if (selectedSubSymptom) {
      // Muestra Códigos de reparación
      return (
        <div className={styles.selectionList}>
          <button onClick={() => handleBack('subSymptom')} className={styles.backButton}>
            Volver a sub-síntomas
          </button>
          <h2 className={styles.selectionTitle}>Códigos de reparación para {selectedSubSymptom.subSymptomCode}</h2>
          {selectedSubSymptom.repairCodes && selectedSubSymptom.repairCodes.length > 0 ? (
            <ul className={styles.list}>
              {selectedSubSymptom.repairCodes.map((repair, repIndex) => (
                <li
                  key={repIndex}
                  onClick={() => handleRepairCodeClick(repair)}
                  className={styles.clickableItem}
                >
                  <strong>Reparación:</strong> {repair.repairCode}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.noResults}>No hay códigos de reparación disponibles.</p>
          )}
        </div>
      );
    }

    if (selectedSymptom) {
      // Muestra Sub-Síntomas
      return (
        <div className={styles.selectionList}>
          <button onClick={() => handleBack('symptom')} className={styles.backButton}>
            Volver a síntomas
          </button>
          <h2 className={styles.selectionTitle}>Sub-Síntomas para {selectedSymptom.symptomCode}</h2>
          {selectedSymptom.subSymptoms && selectedSymptom.subSymptoms.length > 0 ? (
            <ul className={styles.list}>
              {selectedSymptom.subSymptoms.map((sub, subIndex) => (
                <li
                  key={subIndex}
                  onClick={() => handleSubSymptomClick(sub)}
                  className={styles.clickableItem}
                >
                  <strong>Sub-Síntoma:</strong> {sub.subSymptomCode}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.noResults}>No hay sub-síntomas disponibles.</p>
          )}
        </div>
      );
    }

    if (selectedDefectBlock) {
      // Muestra Síntomas
      return (
        <div className={styles.selectionList}>
          <button onClick={() => handleBack('defectBlock')} className={styles.backButton}>
            Volver a bloques de defecto
          </button>
          <h2 className={styles.selectionTitle}>Síntomas para {selectedDefectBlock.defectBlock}</h2>
          <p className={styles.selectionDescription}>Seleccione la parte reemplazada por el técnico. Si se sustituyeron varias, elija la de mayor importancia.</p>
          <div className={styles.gridList}> {/* Usar clase para grid */}
            {selectedDefectBlock.symptoms && selectedDefectBlock.symptoms.length > 0 ? (
              selectedDefectBlock.symptoms.map((symptom, symIndex) => (
                <div
                  key={symIndex}
                  onClick={() => handleSymptomClick(symptom)}
                  className={styles.clickableItem} // Usar clase de ítem clickeable (puedes querer una específica para grid)
                >
                  <strong>Síntoma:</strong> {symptom.symptomCode}
                </div>
              ))
            ) : (
              <p className={styles.noResults}>No hay síntomas disponibles.</p>
            )}
          </div>
        </div>
      );
    }

    if (selectedModel) {
      // Muestra Bloques de Defecto
      return (
        <div className={styles.selectionList}>
          <button onClick={() => handleBack('model')} className={styles.backButton}>
            Volver a modelos
          </button>
          <h2 className={styles.selectionTitle}>Bloques de defecto para {selectedModel.productName}</h2>
          <p className={styles.selectionDescription}>Seleccione la parte reemplazada por el técnico. Si se sustituyeron varias, elija la de mayor importancia.</p>
          <div className={styles.gridList}> {/* Usar clase para grid */}
            {selectedModel.defectBlocks && selectedModel.defectBlocks.length > 0 ? (
              selectedModel.defectBlocks.map((block, index) => (
                <div
                  key={index}
                  className={styles.blockItem} // Usar clase específica para item de bloque
                  onClick={() => handleDefectBlockClick(block)}
                >
                  <p className={styles.blockTitle}><strong>Defecto:</strong> {block.defectBlock}</p>
                  {block.defectBlockImageUrl && (
                    <img
                      src={block.defectBlockImageUrl}
                      alt={block.defectBlock}
                      className={styles.itemImage} // Usar clase para imagen de ítem
                    />
                  )}
                </div>
              ))
            ) : (
              <p className={styles.noResults}>No hay bloques de defectos.</p>
            )}
          </div>
        </div>
      );
    }

    // Por defecto: Muestra Lista de Modelos (cuando nada está seleccionado)
    return (
      <div className={styles.modelList}> {/* Usar clase específica para lista de modelos */}
        {Array.isArray(data) && data.length > 0 ? (
          <div className={styles.gridList}> {/* Usar clase para grid */}
            {data.map((item) => ( // Usar item.id como key para buena práctica
              <div
                key={item.id} // Usar id único del item como key
                className={styles.modelItem} // Usar clase específica para item de modelo
                  onClick={() => handleModelClick(item)} // Mantener click en ítem para selección
              >
                  {item.imagenes?.modelo && (
                     <img
                       className={styles.itemImage} // Usar clase para imagen de ítem
                       src={item.imagenes.modelo}
                       alt={item.productModel}
                     />
                   )}
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.messageContainer}>
            <p className={styles.noResults}>No se encontraron resultados.</p>
          </div>
        )}
      </div>
    );
  };

  // --- Render del Componente ---
  return (
    // Contenedor principal de la página - Usa la clase del módulo (renombrada)
    // Este div debería estar dentro del <main> de tu Layout global.
    <div className={styles.equipsPageWrapper}>

      {/* Área de Cabezal/Filtros - Se muestra siempre */}
      <div className={styles.cabezal}> {/* Usar clase del módulo */}
        <div className={styles.cabezalTitle}> {/* Usar clase del módulo */}
          <h1 className={styles.cabezalh1}>INGENIERIA LINEA BLANCA</h1> {/* Usar clase del módulo */}
          <h2 className={styles.cabezalh2}>TECHNICAL SUPPORT SEM-S</h2> {/* Usar clase del módulo */}
        </div>
        {/* Filtros de Búsqueda y Categoría */}
        <div className={styles.filters}> {/* Usar clase del módulo */}
             <select
              onChange={(e) => setCategory(e.target.value)}
              value={category}
              className={styles.categorySelect} // Usar clase del módulo
            >
              <option value="">Todas las categorías</option>
              <option value="REF">REF</option>
              <option value="WSM">WSM</option>
              <option value="DRY">DRY</option>
              <option value="MWO">MWO</option>
              <option value="COOK">COOK</option>
              <option value="OVEN">OVEN</option>
              <option value="ACN">ACN</option>
              <option value="VACUM">VACUM</option>
              <option value="DW">DW</option>
              <option value="AIR DRESSER">AIR DRESSER</option>
            </select>
            <Link href='/ContactForm' className={styles.buzonButton}>Búzon</Link> {/* Usar clase del módulo, href */}
              <Link className={styles.volverButton} href="/">volver</Link> {/* Usar clase del módulo, href */}
            <input
              type="text"
              className={styles.searchInput} // Usar clase del módulo
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar modelo"
            />
          </div>

          {/* Área de Input de Código ASC y Botón Reset */}
          <div className={styles.ascCodeInputContainer}> {/* Usar clase del módulo */}
            <input
              className={`${styles.searchInputAsc} ${!isAscCodeValid && ascCode ? styles.inputInvalid : ''}`} // Usar clases del módulo
              placeholder="Ingresa código de ASC aqui"
              type="text"
              value={ascCode}
              onChange={(e) => setAscCode(e.target.value)}
              disabled={isAscCodeValid} // Deshabilita input si el código ya es válido
            />
             {/* Muestra botón reset solo si hay código ingresado */}
             {ascCode && (
               <button onClick={() => setAscCode('')} className={styles.resetAscButton}> {/* Usar clase del módulo */}
                 Reiniciar Código
               </button>
             )}
          </div>
        </div>


      {/* Área de Contenido Principal Dinámico - Renderiza según validación y etapa */}
      <div className={styles.contentArea}> {/* Usar clase del módulo */}
          {renderContent()} {/* La lógica de renderizado está aquí */}
      </div>

    </div>
  );
};

// Exportación por defecto para que funcione como página en Next.js
export default EquipsPage;