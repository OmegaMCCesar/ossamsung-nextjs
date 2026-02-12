import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import useFetchInfFirebase from '../hooks/useFetchInfFirebase';
import { useAuth } from '../context/UserContext';
import { db } from '../lib/firebase';
import {
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

import styles from '../styles/equips.module.css';
import emailjs from '@emailjs/browser';
import Validador from '@/components/validador';

const LOCAL_STORAGE_ASC_KEY = 'ASC_CODE_SAVED';

/* ============================================================
   MODAL DE 4 IMÁGENES PARA SELECCIÓN DE PUNTO DE FUGA
   ============================================================ */
const LeakModal = ({ onSelect, onClose }) => {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div  className={styles.modalImgShow}>
          <img src={`/leaks/0.jpg`} className={styles.modalPrincipalImg} />
        </div>
        
        <h3>Seleccione el punto de fuga</h3>

        <div className={styles.modalImagesGrid}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18 ].map((n) => (
            <div
              key={n}
              className={styles.imgBox}
              onClick={() => onSelect(n)}
            >
              <img src={`/leaks/${n}.jpg`} className={styles.modalImg} />
              <span className={styles.leakNumber}>{n}</span>
            </div>
          ))}
        </div>

        <button className={styles.closeModal} onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
};

/* ============================================================
   COMPONENTE PRINCIPAL COMPLETO
   ============================================================ */

const EquipsPage = () => {
  const router = useRouter();
  const { user } = useAuth();

  // ==================================================================
  // ESTADOS
  // ==================================================================
  const [validadorVisible, setValidadorVisible] = useState(false);
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

  // === Modal ===
  const [showLeakModal, setShowLeakModal] = useState(false);
  const [selectedLeakPoint, setSelectedLeakPoint] = useState(null);
  const [leakExtraInfo, setLeakExtraInfo] = useState('');


  // ==================================================================
  // VALIDAR SN
  // ==================================================================
  let NSValid = false;
  if (serialNumber.length === 15) {
    const validChars7 = ['H', 'J', 'K', 'M', 'N', 'R', 'T', 'W', 'X', 'Y'];
    const validChars8 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C'];
    const char7 = serialNumber.charAt(7).toUpperCase();
    const char8 = serialNumber.charAt(8).toUpperCase();
    NSValid = validChars7.includes(char7) && validChars8.includes(char8);
  }

  // ==================================================================
  // ASC VALIDATION
  // ==================================================================
  const validAscCodes = useMemo(
    () => [
      'Techsup','6448834','6434525','1401501','6449579','6283007','4907726','1658952',
      '1658994','1659040','4301958','1659075','1659136','1729840','1729975','1729981',
      '1730172','1730213','1730257','3453191','2485007','1730369','3329308','3490802',
      '3350595','3375393','3188990','3329209','3403522','3404483','3441335','2277262',
      '3456937','3464868','3465902','3467737','3491791','3861676','6420071','3903559',
      '4156881','4156884','4156883','4160663','4204348','4243700','4254175','4271992',
      '3887111','4292179','4366954','4375230','4377174','4789474','4789476','4894172',
      '4906330','4923659','4923680','4932655','4939874','4953466','4953467','4962883',
      '4979868','5777171','5777172','5779775','5785173','5788233','5791986','5798519',
      '5930135','5939508','5944496','5949511','5954013','5968133','5978055','6423092',
      '6423093','6423094','5981427','5984693','5995041','6421187','6420072','5999767',
      '6078654','6082798','4220824','6162465','4769819','6205424','6216903','3491830',
      '6266448','3191645','5283007','3865192','2484362','5288709','6288721','6288722',
      '6428335','8334950','8381572','8395034','9216816','2470144','7079673','Cessoss'
    ],
    []
  );

  const ascCodeCanonical = useMemo(() => (ascCode || '').trim(), [ascCode]);

  const isAscCodeValid = useMemo(() => {
    const set = new Set(validAscCodes.map((c) => c.toUpperCase()));
    return set.has(ascCodeCanonical.toUpperCase());
  }, [ascCodeCanonical, validAscCodes]);

  // ==================================================================
  // LOCAL STORAGE ASC
  // ==================================================================
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(LOCAL_STORAGE_ASC_KEY);
    if (saved) setAscCode(saved);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isAscCodeValid)
      window.localStorage.setItem(LOCAL_STORAGE_ASC_KEY, ascCodeCanonical);
  }, [ascCodeCanonical, isAscCodeValid]);

  const resetAsc = () => {
    setAscCode('');
    if (typeof window !== 'undefined')
      window.localStorage.removeItem(LOCAL_STORAGE_ASC_KEY);
  };

  // ==================================================================
  // VERIFICAR SN EN FIREBASE
  // ==================================================================
  useEffect(() => {
    const check = async () => {
      setSerialNumberChecked(false);
      setSerialNumberError('');
      setIsSerialNumberInProcess(false);

      if (NSValid && isAscCodeValid && serialNumber.length === 15) {
        try {
          const ref = collection(db, 'serialNumbersInProcess');
          const q = query(ref, where('serialNumber', '==', serialNumber));
          const snap = await getDocs(q);

          if (!snap.empty) {
            setIsSerialNumberInProcess(true);

            await emailjs.send(
              'service_hp5g9er',
              'template_fw5dsio',
              {
                user_asc: ascCodeCanonical,
                serial_number: serialNumber,
                message: `El número de serie ${serialNumber} está en proceso de cierre por SSR o REDO.`,
                user_email: user?.email || 'N/A'
              },
              'OimePa9MbzuM5Lahj'
            );
          }
        } catch (err) {
          console.error(err);
        } finally {
          setSerialNumberChecked(true);
        }
      } else if (serialNumber.length > 0 && serialNumber.length !== 15) {
        setSerialNumberError('El número de serie debe tener exactamente 15 caracteres.');
        setSerialNumberChecked(true);
      } else {
        setSerialNumberChecked(true);
      }
    };

    const t = setTimeout(check, 500);
    return () => clearTimeout(t);
  }, [serialNumber, isAscCodeValid, user]);

  // ==================================================================
  // FLUJO DE SELECCIONES
  // ==================================================================

  const handleModelClick = (m) => {
    setSelectedModel(m);
    setSelectedDefectBlock(null);
    setSelectedSymptom(null);
    setSelectedSubSymptom(null);
    setSelectedRepairCode(null);
    setSelectedSubRepairCode(null);
  };

  const handleDefectBlockClick = (b) => {
    setSelectedDefectBlock(b);
    setSelectedSymptom(null);
    setSelectedSubSymptom(null);
    setSelectedRepairCode(null);
    setSelectedSubRepairCode(null);
  };

  const handleSymptomClick = (s) => {
    setSelectedSymptom(s);
    setSelectedSubSymptom(null);
    setSelectedRepairCode(null);
    setSelectedSubRepairCode(null);
  };

  const handleSubSymptomClick = (ss) => {
    setSelectedSubSymptom(ss);
    setSelectedRepairCode(null);
    setSelectedSubRepairCode(null);
  };

  const handleRepairCodeClick = (r) => {
    setSelectedRepairCode(r);
    setSelectedSubRepairCode(null);
  };

  /* ============================================================
     AQUI SE VALIDA SI LA RUTA ES EXACTA DE GAS LEAKAGE
     PARA MOSTRAR EL MODAL (Opción A)
     ============================================================ */
  const handleSubRepairCodeClick = (subRep) => {
    setSelectedSubRepairCode(subRep);

    const strictGasFlow =
      selectedDefectBlock?.defectBlock === '4B09-GAS LEAKAGE' &&
      selectedSymptom?.symptomCode === 'SRC022-FUGA/FUGA' &&
      selectedSubSymptom?.subSymptomCode === 'HE9-FUGA DE GAS' &&
      selectedRepairCode?.repairCode === 'SRC001-REPARAR' &&
      subRep === 'B03-SEALED SYSTEM REPAIR WITH GAS PRESSURE';

    if (strictGasFlow) {
      setShowLeakModal(true);
      return;
    }

    setShowSummary(true);
  };

  /* ============================================================
     CUANDO EL USUARIO SELECCIONA UN PUNTO (1–4)
     ============================================================ */
  const handleLeakSelect = (point) => {
    setSelectedLeakPoint(point);

    const table = {
      1: 'Compresor + descarga, Codigo: 1A, 1B',
      2: 'Condensaddor + clouster tuberia, Codigo: 2A, 2B',
      3: 'Cluster tuberia + tuberia de alta, Codigo: 3A, 3B',
      4: 'Tuberia de alta + dryer, Codigo: 4A, 4B',
      5: 'Dryer + tubo capilar, 5A, 5B',
      6: 'Tubo capilar + entrada del evaporador, Codigo: 6A, 6B',
      7: 'REF(FF) Salida del evaporador + REF(FF) succion, Codigo: 7A, 7B',
      8: 'REF(FF) Succion (Tubo capilar) +´FRE(FZ) evaporador, Codigo: 8A, 8B',
      9: 'FRE(FZ) Evaporador + succion, Codigo: 9A, 9A',
      10: 'Tueberia de conexion de succión, Codigo: 10A, 10B',
      11: 'Tuberia de suucion + compresor, Codigo: 11A, 11B',
      12: 'Compresor + valvula de servico, Codigo: 12A, 12B',
      13: 'Valvula de servico, Codigo: 13A, 13B',
      14: 'Dryer + tuberia de carga, Codigo: 14A, 14B',
      15: 'Dryer + entrada de valvula step, Codigo: 15A, 15B',
      16: 'Valvula step + REF.(FF) tubo capilar, Codigo: 16A, 16B',
      17: 'Valvula step + FRE.(FZ) tubo capilar, Codigo: 17A, 17B',
      18: 'Punto de fuga no visible - fuga interna, Codigo: 18'
    };

    const code = table[point];

    setLeakExtraInfo(`Punto ${point} ${code}`);

    setShowLeakModal(false);
    setShowSummary(true);
  };

  // ==================================================================
  // BOTÓN ATRÁS
  // ==================================================================
  const handleBack = (step) => {
    if (step === 'model') return window.location.reload();

    const resets = {
      defectBlock: () => {
        setSelectedDefectBlock(null);
        setSelectedSymptom(null);
        setSelectedSubSymptom(null);
        setSelectedRepairCode(null);
        setSelectedSubRepairCode(null);
      },
      symptom: () => {
        setSelectedSymptom(null);
        setSelectedSubSymptom(null);
        setSelectedRepairCode(null);
        setSelectedSubRepairCode(null);
      },
      subSymptom: () => {
        setSelectedSubSymptom(null);
        setSelectedRepairCode(null);
        setSelectedSubRepairCode(null);
      },
      repairCode: () => {
        setSelectedRepairCode(null);
        setSelectedSubRepairCode(null);
      }
    };

    resets[step]?.();
  };

  // ==================================================================
  // RENDER PRINCIPAL
  // ==================================================================
  const renderContent = () => {
    if (loading) return <div className={styles.message}>Cargando...</div>;
    if (error)
      return (
        <div className={`${styles.message} ${styles.errorMessage}`}>
          Error: {error.message}
        </div>
      );

    if (!ascCodeCanonical) {
      return (
        <div className={styles.messageContainer}>
          <p className={styles.initialMessage}>
            Primero, ingresa el código de tu centro de servicio.
          </p>
        </div>
      );
    }

    if (!isAscCodeValid) {
      return (
        <div className={styles.errorContainer}>
          <h2 className={styles.errorMessageTitle}>
            Código de centro de servicio no válido
          </h2>
          <p className={styles.errorDescription}>
            Verifica el código ingresado.
          </p>
        </div>
      );
    }

    if (serialNumberError) {
      return (
        <div className={styles.errorContainer}>
          <h2 className={styles.errorMessageTitle}>Error en Número de Serie</h2>
          <p className={styles.errorDescription}>{serialNumberError}</p>

          <button
            onClick={() => setSerialNumber('')}
            className={styles.resetButton}
          >
            Ingresar otro Número de Serie
          </button>
        </div>
      );
    }

    if (!serialNumber || serialNumber.length !== 15 || !serialNumberChecked) {
      return (
        <div className={styles.messageContainer}>
          <p className={styles.initialMessage}>
            Ahora, ingresa el Número de Serie para continuar.
          </p>

          {serialNumber && !serialNumberChecked && (
            <div className={styles.message}>Verificando número de serie…</div>
          )}
        </div>
      );
    }

    /* ============================================================
       RESUMEN FINAL (DESPUÉS DE MODAL)
       ============================================================ */
    if (showSummary) {
      return (
        <div className={styles.summary}>
          <h2 className={styles.summaryTitle}>Resumen de Selección</h2>

          <div className={styles.summaryDetails}>
            <p><strong>Código ASC:</strong> {ascCodeCanonical}</p>
            <p><strong>SN:</strong> {serialNumber}</p>
            <p><strong>Modelo:</strong> {selectedModel?.productName}</p>
            <p><strong>Bloque:</strong> {selectedDefectBlock?.defectBlock}</p>
            <p><strong>Síntoma:</strong> {selectedSymptom?.symptomCode}</p>
            <p><strong>Sub-Síntoma:</strong> {selectedSubSymptom?.subSymptomCode}</p>
            <p><strong>Código reparación:</strong> {selectedRepairCode?.repairCode}</p>
            <p><strong>Sub-código:</strong> {selectedSubRepairCode}</p>
            {leakExtraInfo && (
                <p className={styles.leakBlock}>
                <strong>Punto de fuga:</strong> {leakExtraInfo}
                 </p>
)}

          </div>

          <button onClick={() => window.location.reload()} className={styles.resetButton}>
            Reiniciar Selección
          </button>
        </div>
      );
    }

    /* ============================================================
       SECCIONES INTERMEDIAS
       ============================================================ */
    if (selectedRepairCode) {
      return (
        <div className={styles.selectionList}>
          <button
            onClick={() => handleBack('repairCode')}
            className={styles.backButton}
          >
            Volver
          </button>

          <h2 className={styles.selectionTitle}>
            Sub-Códigos para {selectedRepairCode.repairCode}
          </h2>

          {selectedRepairCode.subRepairCodes?.length ? (
            <ul className={styles.list}>
              {selectedRepairCode.subRepairCodes.map((subRep, i) => (
                <li
                  key={i}
                  className={styles.clickableItem}
                  onClick={() => handleSubRepairCodeClick(subRep)}
                >
                  {subRep}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.noResults}>No hay sub-códigos.</p>
          )}
        </div>
      );
    }

    if (selectedSubSymptom) {
      return (
        <div className={styles.selectionList}>
          <button
            onClick={() => handleBack('subSymptom')}
            className={styles.backButton}
          >
            Volver
          </button>

          <h2 className={styles.selectionTitle}>
            Códigos de reparación para {selectedSubSymptom.subSymptomCode}
          </h2>

          {selectedSubSymptom.repairCodes?.length ? (
            <ul className={styles.list}>
              {selectedSubSymptom.repairCodes.map((rc, i) => (
                <li
                  key={i}
                  className={styles.clickableItem}
                  onClick={() => handleRepairCodeClick(rc)}
                >
                  {rc.repairCode}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.noResults}>No hay códigos de reparación.</p>
          )}
        </div>
      );
    }

    if (selectedSymptom) {
      return (
        <div className={styles.selectionList}>
          <button
            onClick={() => handleBack('symptom')}
            className={styles.backButton}
          >
            Volver
          </button>

          <h2 className={styles.selectionTitle}>
            Sub-Síntomas para {selectedSymptom.symptomCode}
          </h2>

          {selectedSymptom.subSymptoms?.length ? (
            <ul className={styles.list}>
              {selectedSymptom.subSymptoms.map((sub, i) => (
                <li
                  key={i}
                  className={styles.clickableItem}
                  onClick={() => handleSubSymptomClick(sub)}
                >
                  {sub.subSymptomCode}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.noResults}>No hay sub-síntomas.</p>
          )}
        </div>
      );
    }

    if (selectedDefectBlock) {
      return (
        <div className={styles.selectionList}>
          <button
            onClick={() => handleBack('defectBlock')}
            className={styles.backButton}
          >
            Volver
          </button>

          <h2 className={styles.selectionTitle}>
            Síntomas para {selectedDefectBlock.defectBlock}
          </h2>

          <div className={styles.gridList}>
            {selectedDefectBlock.symptoms?.length ? (
              selectedDefectBlock.symptoms.map((sym, i) => (
                <div
                  key={i}
                  className={styles.clickableItem}
                  onClick={() => handleSymptomClick(sym)}
                >
                  {sym.symptomCode}
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
          <button
            onClick={() => handleBack('model')}
            className={styles.backButton}
          >
            Volver
          </button>

          <h2 className={styles.selectionTitle}>
            Bloques de defecto para {selectedModel.productName}
          </h2>

          <div className={styles.gridList}>
            {selectedModel.defectBlocks?.length ? (
              selectedModel.defectBlocks.map((block, i) => (
                <div
                  key={i}
                  className={styles.blockItem}
                  onClick={() => handleDefectBlockClick(block)}
                >
                  <p><strong>Defecto:</strong> {block.defectBlock}</p>
                  {block.defectBlockImageUrl && (
                    <img
                      className={styles.itemImage}
                      src={block.defectBlockImageUrl}
                    />
                  )}
                </div>
              ))
            ) : (
              <p className={styles.noResults}>No hay bloques.</p>
            )}
          </div>
        </div>
      );
    }

    // LISTA MODELOS
    const ready = isAscCodeValid && serialNumber.length === 15 && serialNumberChecked;

    return (
      <div className={styles.modelList}>
        {Array.isArray(data) && data.length ? (
          <div className={styles.gridList}>
            {data.map((item) =>
              item.imagenes?.modelo ? (
                <div
                  key={item.id}
                  className={styles.modelItem}
                  onClick={ready ? () => handleModelClick(item) : undefined}
                  style={{
                    cursor: ready ? 'pointer' : 'not-allowed',
                    opacity: ready ? 1 : 0.5
                  }}
                >
                  <img
                    className={styles.itemImage}
                    src={item.imagenes.modelo}
                  />
                </div>
              ) : null
            )}
          </div>
        ) : (
          <div className={styles.messageContainer}>
            <p className={styles.noResults}>Sin resultados.</p>
          </div>
        )}
      </div>
    );
  };

  // ==================================================================
  // RETURN FINAL
  // ==================================================================

  return (
    <div className={styles.equipsPageWrapper}>
      {/* MODAL */}
      {showLeakModal && (
        <LeakModal
          onSelect={handleLeakSelect}
          onClose={() => setShowLeakModal(false)}
        />
      )}

      <div className={styles.cabezal}>
        {user && (
          <button
            onClick={() => router.push('/sAddS')}
            className={styles.adminButton}
          >
            Añadir números de serie
          </button>
        )}

        <div className={styles.cabezalTitle}>
          <h1 className={styles.cabezalh1}>INNOVACIÓN TECNOLÓGICA</h1>
          <h2 className={styles.cabezalh2}>DIGITAL LAB / WHITE LINE</h2>
        </div>

        {/* FILTROS */}
        <div className={styles.filters}>
          <Link
            className={styles.volverButton}
            href="resistanceComPage"
          >
            Resistencia de compresores
          </Link>

          <Link className={styles.buzonButton} href="/ContactForm">
            Buzón
          </Link>

          <Link className={styles.volverButton} href="/">
            Volver
          </Link>

          <Link className={styles.volverButton} href="esCom">
            Estandarización Compresores
          </Link>

          <select
            onChange={(e) => setCategory(e.target.value)}
            value={category}
            className={styles.categorySelect}
            disabled={
              !isAscCodeValid ||
              serialNumber.length !== 15 ||
              !serialNumberChecked ||
              serialNumberError
            }
          >
            <option value="">Todas</option>
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

          <input
            type="text"
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar modelo"
            disabled={
              !isAscCodeValid ||
              serialNumber.length !== 15 ||
              !serialNumberChecked ||
              serialNumberError
            }
          />
        </div>

        {/* ASC */}
        <div className={styles.ascCodeInputContainer}>
          <input
            className={`${styles.searchInputAsc} ${
              !isAscCodeValid && ascCodeCanonical ? styles.inputInvalid : ''
            }`}
            placeholder="Ingresa código de ASC"
            type="text"
            value={ascCode}
            onChange={(e) => setAscCode(e.target.value)}
            disabled={isAscCodeValid}
          />

          {ascCode && (
            <button onClick={resetAsc} className={styles.resetAscButton}>
              Reiniciar Código
            </button>
          )}
        </div>

        {/* SERIAL NUMBER */}
        <div className={styles.serialNumberInputContainer}>
          <input
            className={`${styles.searchInputSN} ${
              serialNumberError ? styles.inputInvalid : ''
            }`}
            placeholder="Número de Serie (15 caracteres)"
            type="text"
            value={serialNumber}
            onChange={(e) => {
              setSerialNumber(e.target.value);
              setSerialNumberChecked(false);
              setSerialNumberError('');
            }}
            disabled={
              !isAscCodeValid ||
              (serialNumber.length === 15 &&
                serialNumberChecked &&
                !serialNumberError &&
                !isSerialNumberInProcess)
            }
            maxLength={15}
          />

          {serialNumber && (
            <button
              onClick={() => {
                setSerialNumber('');
                setSerialNumberChecked(false);
                setSerialNumberError('');
                setIsSerialNumberInProcess(false);
              }}
              className={styles.resetSNButton}
            >
              Reiniciar SN
            </button>
          )}

          {serialNumberError && (
            <p className={styles.serialNumberErrorMessage}>
              {serialNumberError}
            </p>
          )}
        </div>

        {/* VALIDADOR */}
        <div>
          <Validador
            className={validadorVisible ? 'visible' : 'oculto'}
            numeroSerie={serialNumber}
          />
        </div>

        <button
          className={styles.resetSNButton}
          onClick={() => setValidadorVisible(!validadorVisible)}
        >
          {validadorVisible ? 'Ver validación' : 'Ocultar validación'}
        </button>
      </div>

      {/* CONTENIDO */}
      <div className={styles.contentArea}>{ NSValid && renderContent()}</div>
    </div>
  );
};

export default EquipsPage;
