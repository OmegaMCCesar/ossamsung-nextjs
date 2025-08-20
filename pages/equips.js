import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import useFetchInfFirebase from '../hooks/useFetchInfFirebase';
import { useAuth } from '../context/UserContext'; // Aunque no lo usemos para el email, se mantiene por si se usa en otro lugar
import { db } from '../lib/firebase';
import { doc, increment, runTransaction, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

import styles from '../styles/equips.module.css';

import emailjs from '@emailjs/browser';

const EquipsPage = () => {
 const router = useRouter();
 const { user } = useAuth(); // Se mantiene por si es necesario para otras funcionalidades

 const [category, setCategory] = useState('');
 const [searchTerm, setSearchTerm] = useState('');
 const { data, loading, error } = useFetchInfFirebase(category, searchTerm);

 const [selectedModel, setSelectedModel] = useState(null);
 const [selectedDefectBlock, setSelectedDefectBlock] = useState(null);
 const [selectedSymptom, setSelectedSymptom] = useState(null);
 const [selectedSubSymptom, setSelectedSubSymptom] = useState(null);
 const [selectedRepairCode, setSelectedRepairCode] = useState(null);
 const [selectedSubRepairCode, setSelectedSubRepairCode] = useState(null);

 const [serialNumber, setSerialNumber] = useState('');
 const [isSerialNumberInProcess, setIsSerialNumberInProcess] = useState(false);
 const [serialNumberChecked, setSerialNumberChecked] = useState(false);
 const [serialNumberError, setSerialNumberError] = useState('');

 const [showSummary, setShowSummary] = useState(false);

 const [ascCode, setAscCode] = useState('');

 const validAscCodes = useMemo(() => [
  'Techsup','6434525 ', '1401501', '6449579','6283007', '4907726',
  '1658952', '1658994', '1659040', '4301958', '1659075', '1659136', '1729840', '1729975', '1729981', '1730172', '1730213', '1730257', '3453191', '2485007', '1730369', '3329308', '3490802', '3350595', '3375393', '3188990', '3329209', '3403522', '3404483', '3441335', '2277262', '3456937', '3464868', '3465902', '3467737', '3491791', '3861676', '6420071', '3903559', '4156881', '4156884', '4156883', '4160663', '4204348', '4243700', '4254175', '4271992', '3887111', '4292179', '4366954', '4375230', '4377174', '4789474', '4789476', '4894172', '4906330', '4923659', '4923680', '4932655', '4939874', '4953466', '4953467', '4962883', '4979868', '5777171', '5777172', '5779775', '5785173', '5788233', '5791986', '5798519', '5930135', '5939508', '5944496', '5949511', '5954013', '5968133', '5978055', '6423092', '6423093', '6423094', '5981427', '5984693', '5995041', '6421187', '6420072', '5999767', '6078654', '6082798', '4220824', '6162465', '4769819', '6205424', '6216903', '3491830', '6266448', '3191645', '5283007', '3865192', '2484362', '5288709', '6288721', '6288722', '6428335', '8334950', '8381572', '8395034', '9216816', '2470144', 'Cessoss',
 ], []);

 const isAscCodeValid = useMemo(() => validAscCodes.includes(ascCode), [ascCode, validAscCodes]);

 useEffect(() => {
  const checkSerialNumberExistence = async () => {
   setSerialNumberChecked(false); // Reinicia el estado de verificación
   setSerialNumberError(''); // Borra errores previos
   setIsSerialNumberInProcess(false); // Reinicia el estado "en proceso"

   // Solo proceder si el código ASC es válido y el SN tiene 15 caracteres
   if (isAscCodeValid && serialNumber.length === 15 && db) {
    
    try {
     const serialNumbersRef = collection(db, "serialNumbersInProcess");
     const q = query(serialNumbersRef, where("serialNumber", "==", serialNumber));
     const querySnapshot = await getDocs(q);
     
     if (!querySnapshot.empty) {
      setIsSerialNumberInProcess(true);
      // Enviar correo al administrador si el SN está en proceso
      await emailjs.send(
       'service_hp5g9er',
       'template_fw5dsio', // Esta plantilla debe configurarse para enviar al administrador
       {
        user_asc: ascCode,
        serial_number: serialNumber,
        message: `El número de serie ${serialNumber} está en proceso de cierre por SSR o REDO.`,
        user_email: user?.email || 'N/A', // Opcional: si user.email no existe, envía 'N/A'
       },
       'OimePa9MbzuM5Lahj'
      );
      console.log("EmailJS: Correo 'Número de serie en proceso de SSR' enviado al admin.");
     } else {
      console.log("Número de serie NO encontrado.");
     }
    } catch (e) {
     console.error("Error al verificar el número de serie o al enviar el correo:", e);
     // Incluso si hay un error en la verificación o envío, no bloqueamos al usuario.
    } finally {
     setSerialNumberChecked(true); // Marca la verificación como realizada
    }
   } else if (serialNumber.length > 0 && serialNumber.length !== 15) {
    setSerialNumberError('El número de serie debe tener exactamente 15 caracteres.');
    setSerialNumberChecked(true); // Marca como verificado incluso si la longitud es inválida
   } else {
    setSerialNumberChecked(true); // Marca como verificado si está vacío
   }
  };

  const debounceCheck = setTimeout(() => {
   checkSerialNumberExistence();
  }, 500);

  return () => clearTimeout(debounceCheck);
 }, [serialNumber, db, ascCode, isAscCodeValid, user?.email]);

  useEffect(() => {
    if (isAscCodeValid && showSummary && ascCode && db) {
      console.log(`Condiciones cumplidas para registrar uso: Código ASC=${ascCode}`);

      const ascCodeRef = doc(db, "ascCodeUsage", ascCode);

      const updateUsage = async () => {
        try {
          await runTransaction(db, async (transaction) => {
            const ascDoc = await transaction.get(ascCodeRef);
            if (!ascDoc.exists()) {
              transaction.set(ascCodeRef, {
                code: ascCode,
                usageCount: 1,
                lastUsed: new Date()
              });
              console.log(`Firebase: Nuevo código ASC ${ascCode} registrado con usageCount 1.`);
            } else {
              transaction.update(ascCodeRef, {
                usageCount: increment(1),
                lastUsed: new Date()
              });
              console.log(`Firebase: Código ASC ${ascCode} actualizado. Nuevo usageCount: ${ascDoc.data().usageCount + 1}`);
            }
          });
        } catch (e) {
          console.error("Firebase: Error actualizando uso de código ASC: ", e);
        }
      };
      updateUsage();
    }
  }, [isAscCodeValid, showSummary, ascCode, db]);


  const handleModelClick = (model) => {
    setSelectedModel(model);
    setSelectedDefectBlock(null);
    setSelectedSymptom(null);
    setSelectedSubSymptom(null);
    setSelectedRepairCode(null);
    setSelectedSubRepairCode(null);
    setShowSummary(false);
  };

  const handleDefectBlockClick = (block) => {
    setSelectedDefectBlock(block);
    setSelectedSymptom(null);
    setSelectedSubSymptom(null);
    setSelectedRepairCode(null);
    setSelectedSubRepairCode(null);
    setShowSummary(false);
  };

  const handleSymptomClick = (symptom) => {
    setSelectedSymptom(symptom);
    setSelectedSubSymptom(null);
    setSelectedRepairCode(null);
    setSelectedSubRepairCode(null);
    setShowSummary(false);
  };

  const handleSubSymptomClick = (subSymptom) => {
    setSelectedSubSymptom(subSymptom);
    setSelectedRepairCode(null);
    setSelectedSubRepairCode(null);
    setShowSummary(false);
  };

  const handleRepairCodeClick = (repair) => {
    setSelectedRepairCode(repair);
    setSelectedSubRepairCode(null);
    setShowSummary(false);
  };

  const handleSubRepairCodeClick = (subRepair) => {
    setSelectedSubRepairCode(subRepair);
    setShowSummary(true);
  };

  const handleReset = () => {
    setSelectedModel(null);
    setSelectedDefectBlock(null);
    setSelectedSymptom(null);
    setSelectedSubSymptom(null);
    setSelectedRepairCode(null);
    setSelectedSubRepairCode(null);
    setShowSummary(false);
    // Optionally reset serial number and ASC code if you want a full fresh start
    // setSerialNumber('');
    // setAscCode('');
  };

  const handleBack = (step) => {
    switch (step) {
      case 'model':
        handleReset();
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

  const renderContent = () => {
    if (loading) {
      return <div className={styles.message}>Cargando...</div>;
    }

    if (error) {
      return <div className={`${styles.message} ${styles.errorMessage}`}>Error: {error.message}</div>;
    }

    // --- Require Serial Number and ASC Code first ---
    if (!ascCode) {
      return (
        <div className={styles.messageContainer}>
          <p className={styles.initialMessage}>
            Primero, ingresa el **código de tu centro de servicio** para comenzar a usar la plataforma.
          </p>
        </div>
      );
    }

    if (!isAscCodeValid) {
      return (
        <div className={styles.errorContainer}>
          <h2 className={styles.errorMessageTitle}>Código de centro de servicio no válido</h2>
          <p className={styles.errorDescription}>Por favor, verifica el código ingresado.</p>
        </div>
      );
    }

    // Show SN validation error if it exists
    if (serialNumberError) {
      return (
        <div className={styles.errorContainer}>
          <h2 className={styles.errorMessageTitle}>Error en Número de Serie</h2>
          <p className={styles.errorDescription}>
            {serialNumberError}
          </p>
          <button onClick={() => setSerialNumber('')} className={styles.resetButton}>
            Ingresar otro Número de Serie
          </button>
        </div>
      );
    }

    if (!serialNumber || serialNumber.length !== 15 || !serialNumberChecked) {
      return (
        <div className={styles.messageContainer}>
          <p className={styles.initialMessage}>
            Ahora, ingresa el **Número de Serie (SN)** del producto para continuar.
          </p>
          {/* Show loading for SN check only when a serial number is entered and not yet checked */}
          {serialNumber.length > 0 && !serialNumberChecked && (
            <div className={styles.message}>Verificando número de serie...</div>
          )}
        </div>
      );
    }

    // If we reach here, ascCode is valid, serialNumber is 15 chars and has been checked.
    // The user can now proceed, even if the SN was found to be "in process" (admin got the email).

    if (showSummary) {
      return (
        <div className={styles.summary}>
          <h2 className={styles.summaryTitle}>Resumen de Selección</h2>
          <div className={styles.summaryDetails}>
            <p><strong>Código ASC:</strong> {ascCode}</p>
            <p><strong>Número de Serie:</strong> {serialNumber}</p>
            {/* Removed the inProcessMessage from here to ensure the user doesn't see it */}
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
      return (
        <div className={styles.selectionList}>
          <button onClick={() => handleBack('defectBlock')} className={styles.backButton}>
            Volver a bloques de defecto
          </button>
          <h2 className={styles.selectionTitle}>Bloques de defecto para {selectedModel.productName}</h2>
          <p className={styles.selectionDescription}>Seleccione la parte reemplazada por el técnico. Si se sustituyeron varias, elija la de mayor importancia.</p>
          <div className={styles.gridList}>
            {selectedDefectBlock.symptoms && selectedDefectBlock.symptoms.length > 0 ? (
              selectedDefectBlock.symptoms.map((symptom, symIndex) => (
                <div
                  key={symIndex}
                  onClick={() => handleSymptomClick(symptom)}
                  className={styles.clickableItem}
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
      return (
        <div className={styles.selectionList}>
          <button onClick={() => handleBack('model')} className={styles.backButton}>
            Volver a modelos
          </button>
          <h2 className={styles.selectionTitle}>Bloques de defecto para {selectedModel.productName}</h2>
          <p className={styles.selectionDescription}>Seleccione la parte reemplazada por el técnico. Si se sustituyeron varias, elija la de mayor importancia.</p>
          <div className={styles.gridList}>
            {selectedModel.defectBlocks && selectedModel.defectBlocks.length > 0 ? (
              selectedModel.defectBlocks.map((block, index) => (
                <div
                  key={index}
                  className={styles.blockItem}
                  onClick={() => handleDefectBlockClick(block)}
                >
                  <p className={styles.blockTitle}><strong>Defecto:</strong> {block.defectBlock}</p>
                  {block.defectBlockImageUrl && (
                    <img
                      className={styles.itemImage}
                      src={block.defectBlockImageUrl}
                      alt={block.defectBlock}
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

    // Allow interaction with models if ASC code is valid, SN is 15 chars, and SN check is done
    const isReadyToSelectModel = isAscCodeValid && serialNumber.length === 15 && serialNumberChecked;

    return (
      <div className={styles.modelList}>
        {Array.isArray(data) && data.length > 0 ? (
          <div className={styles.gridList}>
            {data.map((item) => (
              item.imagenes?.modelo && <div
                key={item.id}
                className={styles.modelItem}
                onClick={isReadyToSelectModel ? () => handleModelClick(item) : undefined}
                style={{ cursor: isReadyToSelectModel ? 'pointer' : 'not-allowed', opacity: isReadyToSelectModel ? 1 : 0.5 }}
              >
                {item.imagenes?.modelo && (
                  <img
                    className={styles.itemImage}
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

  return (
    <div className={styles.equipsPageWrapper}>
      <div className={styles.cabezal}>
        {user && <button onClick={() => router.push('/sAddS')} className={styles.adminButton}>Añadir numeros de serie</button>}
        <div className={styles.cabezalTitle}>
          <h1 className={styles.cabezalh1}>INGENIERIA LINEA BLANCA</h1>
          <h2 className={styles.cabezalh2}>TECHNICAL SUPPORT SEM-S</h2>
        </div>
        <div className={styles.filters}>
          <select
            onChange={(e) => setCategory(e.target.value)}
            value={category}
            className={styles.categorySelect}
            // Disable until ASC and SN are provided and valid
            disabled={!isAscCodeValid || serialNumber.length !== 15 || !serialNumberChecked || serialNumberError}
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
            <option value="NK">NK</option>
          </select>
          <Link href='/ContactForm' className={styles.buzonButton}>Búzon</Link>
          <Link className={styles.volverButton} href="/">volver</Link>
          <Link className={styles.volverButton} href="esCom">Estandarizacion Compresores</Link>
          {/* <Link className={styles.buzonButton} href="/biblioteca">Biblioteca</Link> */}
          <input
            type="text"
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar modelo"
            // Disable until ASC and SN are provided and valid
            disabled={!isAscCodeValid || serialNumber.length !== 15 || !serialNumberChecked || serialNumberError}
          />
        </div>

        <div className={styles.ascCodeInputContainer}>
          <input
            className={`${styles.searchInputAsc} ${!isAscCodeValid && ascCode ? styles.inputInvalid : ''}`}
            placeholder="Ingresa código de ASC aqui"
            type="text"
            value={ascCode}
            onChange={(e) => setAscCode(e.target.value)}
            disabled={isAscCodeValid}
          />
          {ascCode && (
            <button onClick={() => setAscCode('')} className={styles.resetAscButton}>
              Reiniciar Código
            </button>
          )}
        </div>
        <div className={styles.serialNumberInputContainer}>
          <input
            className={`${styles.searchInputSN} ${serialNumberError ? styles.inputInvalid : ''}`} // Apply invalid style
            placeholder="Ingresa Número de Serie (SN)"
            type="text"
            value={serialNumber}
            onChange={(e) => {
              setSerialNumber(e.target.value);
              setSerialNumberChecked(false); // Reset check status when input changes
              setSerialNumberError(''); // Clear error on change
            }}
            // Disable only if ASC code is not valid, or if SN is valid and checked and no error (no need to re-enter)
            disabled={!isAscCodeValid || (serialNumber.length === 15 && serialNumberChecked && !serialNumberError && !isSerialNumberInProcess)}
            maxLength={15} // Enforce max length of 15 characters
          />
          {serialNumber && (
            <button onClick={() => { setSerialNumber(''); setIsSerialNumberInProcess(false); setSerialNumberChecked(false); setSerialNumberError(''); }} className={styles.resetSNButton}>
              Reiniciar SN
            </button>
          )}
          {serialNumberError && <p className={styles.serialNumberErrorMessage}>{serialNumberError}</p>}
        </div>
      </div>

      <div className={styles.contentArea}>
        {renderContent()}
      </div>

    </div>
  );
};

export default EquipsPage;