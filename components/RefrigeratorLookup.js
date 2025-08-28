import { useState, useEffect } from "react";
import styles from "../styles/RefrigeratorLookup.module.css";

const DATA = [
  // { pjt, model, compressor_before, pcb_before, eeprom_after, pcb_after, apply }
  { pjt: "RF4500", model: "RF22A4010S9/EM", compressor_before: "NN34M9112ARTS7", pcb_before: "DA92-01445G", eeprom_after: "NO14D7151ALTT9", pcb_after: "DA94-09408G", apply: "10-ene" },
  { pjt: "RF4500", model: "RF22A4110S9/EM", compressor_before: "NN34M9112ARTS7", pcb_before: "DA94-07785F", eeprom_after: "NO14D7151ALTT9", pcb_after: "DA94-09408E", apply: "10-ene" },
  { pjt: "RF4500", model: "RF22A4220B1/EM", compressor_before: "NN34M9112ARTS7", pcb_before: "DA94-07785C", eeprom_after: "NO14D7151ALTT9", pcb_after: "DA94-09408C", apply: "10-ene" },
  { pjt: "RF4500", model: "RF22A4220S9/EM", compressor_before: "NN34M9112ARTS7", pcb_before: "DA94-07785C", eeprom_after: "NO14D7151ALTT9", pcb_after: "DA94-09408C", apply: "10-ene" },

  { pjt: "RS5300T", model: "RS27T5200B1/EM", compressor_before: "NF54M5151ARTT7", pcb_before: "DA94-06781S", eeprom_after: "NO14D7151ALTT9", pcb_after: "DA94-08409M", apply: "W49" },
  { pjt: "RS5300T", model: "RS27T5200S9/EM", compressor_before: "NF54M5151ARTT7", pcb_before: "DA94-06781S", eeprom_after: "NO14D7151ALTT9", pcb_after: "DA94-08409M", apply: "W49" },
  { pjt: "RS5300T", model: "RS28T5B00B1/EM", compressor_before: "NF54M5151ARTT7", pcb_before: "DA94-06781G", eeprom_after: "NO14D7151ALTT9", pcb_after: "DA94-08409Q", apply: "W49" },

  { pjt: "RS5300TC", model: "RS22T5200B1/EM", compressor_before: "NF54M5151ARTT7", pcb_before: "DA94-06781Q", eeprom_after: "NO14D7151ALTT9", pcb_after: "DA94-08409D", apply: "Inactive" },
  { pjt: "RS5300TC", model: "RS22T5200S9/EM", compressor_before: "NF54M5151ARTT7", pcb_before: "DA94-06781Q", eeprom_after: "NO14D7151ALTT9", pcb_after: "DA94-08409D", apply: "Inactive" },
  { pjt: "RS5300TC", model: "RS23T5B00S9/EM", compressor_before: "NF54M5151ARTT7", pcb_before: "DA94-06781F", eeprom_after: "NO14D7151ALTT9", pcb_after: "DA94-08409X", apply: "Inactive" },

  { pjt: "RF6500C", model: "RF32CB532012EM", compressor_before: "NF54M7151ANSM9", pcb_before: "DA94-06792W", eeprom_after: "NO14C9151ALTT9", pcb_after: "DA94-09429F", apply: "W49" },
  { pjt: "RF6500C", model: "RF32CG5310B1EM", compressor_before: "NF54M7151ANSM9", pcb_before: "DA94-06792U", eeprom_after: "NO14C9151ALTT9", pcb_after: "DA94-09429E", apply: "Inactive" },
  { pjt: "RF6500C", model: "RF32CG5310S9EM", compressor_before: "NF54M7151ANSM9", pcb_before: "DA94-06792U", eeprom_after: "NO14C9151ALTT9", pcb_after: "DA94-09429E", apply: "W49" },
  { pjt: "RF6500C", model: "RF32CG5411B1EM", compressor_before: "NF54M7151ANSM9", pcb_before: "DA94-06792E", eeprom_after: "NO14C9151ALTT9", pcb_after: "DA94-09429B", apply: "W49" },
  { pjt: "RF6500C", model: "RF32CG5411SREM", compressor_before: "NF54M7151ANSM9", pcb_before: "DA94-06792E", eeprom_after: "-", pcb_after: "DA94-09429B", apply: "Inactive" },
  { pjt: "RF6500C", model: "RF32CG5911B1EM", compressor_before: "NF54M7151ANSM9", pcb_before: "DA94-06792L", eeprom_after: "NO14C9151ALTT9", pcb_after: "DA94-09430C", apply: "W49" },
  { pjt: "RF6500C", model: "RF32CG5911SREM", compressor_before: "NF54M7151ANSM9", pcb_before: "DA94-06792L", eeprom_after: "NO14C9151ALTT9", pcb_after: "DA94-09430C", apply: "W49" },
  { pjt: "RF6500C", model: "RF32CG5A10S9EM", compressor_before: "NF54M7151ANSM9", pcb_before: "DA94-06793F", eeprom_after: "NO14C9151ALTT9", pcb_after: "DA94-09429M", apply: "W49" },
  { pjt: "RF6500C", model: "RF32CG5N10B1EM", compressor_before: "NF54M7151ANSM9", pcb_before: "DA94-06793C", eeprom_after: "NO14C9151ALTT9", pcb_after: "DA94-09429K", apply: "W49" },
  { pjt: "RF6500C", model: "RF32CG5N10S9EM", compressor_before: "NF54M7151ANSM9", pcb_before: "DA94-06793C", eeprom_after: "NO14C9151ALTT9", pcb_after: "DA94-09429K", apply: "W49" },

  { pjt: "RS5300T", model: "RS27T5561B1/EM", compressor_before: "NF54M7151ANSM9", pcb_before: "DA94-06781L", eeprom_after: "NO14C9151ALTT9", pcb_after: "DA94-08409H", apply: "W49" },
  { pjt: "RS5300T", model: "RS28CB70NA12EM", compressor_before: "NF54M7151ANSM9", pcb_before: "DA92-01542D", eeprom_after: "NO14C9151ALTT9", pcb_after: "DA94-09488M", apply: "W49" },
  { pjt: "RS5300T", model: "RS28CB70NAQLEM", compressor_before: "NF54M7151ANSM9", pcb_before: "DA92-01542D", eeprom_after: "NO14C9151ALTT9", pcb_after: "DA94-09488M", apply: "W49" },
  { pjt: "RS5300T", model: "RS28CB760A12EM", compressor_before: "NF54M7151ANSM9", pcb_before: "DA94-06782B", eeprom_after: "NO14C9151ALTT9", pcb_after: "DA94-09488C", apply: "W49" },
  { pjt: "RS5300T", model: "RS28CB760AQLEM", compressor_before: "NF54M7151ANSM9", pcb_before: "DA94-06782B", eeprom_after: "NO14C9151ALTT9", pcb_after: "DA94-09488C", apply: "Inactive" },

  { pjt: "RS5300TC", model: "RS22T5561B1/EM", compressor_before: "NF54M7151ANSM9", pcb_before: "DA92-01196T", eeprom_after: "NO14C9151ALTT9", pcb_after: "DA94-08409S", apply: "W49" },
  { pjt: "RS5300TC", model: "RS22T5561S9/EM", compressor_before: "NF54M7151ANSM9", pcb_before: "DA92-01196T", eeprom_after: "NO14C9151ALTT9", pcb_after: "DA94-08409S", apply: "W49" },

  { pjt: "RF5000C", model: "RF25C5151S9/EM", compressor_before: "NF54M7151ANSM9", pcb_before: "DA92-01545C", eeprom_after: "NO14C9151AKTT9", pcb_after: "DA94-09409E", apply: "Inactive" },
  { pjt: "RF5000C", model: "RF25C5551S9/EM", compressor_before: "NF54M7151ANSM9", pcb_before: "DA92-01545D", eeprom_after: "NO14C9151AKTT9", pcb_after: "DA94-09409B", apply: "W49" },

  { pjt: "RS5300T", model: "RS27T5561S9/EM", compressor_before: "NF54M7151ANSM9", pcb_before: "DA94-06781L", eeprom_after: "NO14C9151ALTT9", pcb_after: "DA94-08409H", apply: "Inactive" },
  { pjt: "RS5300T", model: "RS28A5F61B1/EM", compressor_before: "NF54M7151ANSM9", pcb_before: "DA92-01193J", eeprom_after: "NO14C9151ALTT9", pcb_after: "DA94-09489S", apply: "Inactive" },
  { pjt: "RS5300T", model: "RS28A5F61S9/EM", compressor_before: "NF54M7151ANSM9", pcb_before: "DA92-01193J", eeprom_after: "NO14C9151ALTT9", pcb_after: "DA94-09489S", apply: "Inactive" },

  { pjt: "RF8000B", model: "RF29BB8600APEM", compressor_before: "NF54M7151ANTT3", pcb_before: "DA92-01194G", eeprom_after: "NO14C9151ALTT9", pcb_after: "DA94-09410K", apply: "Inactive" },
  { pjt: "RF8000B", model: "RF30BB6200APEM", compressor_before: "NF54M7151ANTT3", pcb_before: "DA94-06791F", eeprom_after: "NO14C9151ALTT9", pcb_after: "DA94-09428C", apply: "Inactive" },

  { pjt: "RT5300C", model: "RT31DG5124S9EM", compressor_before: "NI34T9101ABTS7", pcb_before: "DA94-08413N", eeprom_after: "NI54D9905ABTS7", pcb_after: "DA94-08413X", apply: "24-ene" },
  { pjt: "RT5300C", model: "RT31DG5224S9EM", compressor_before: "NI34T9101ABTS7", pcb_before: "DA94-08413N", eeprom_after: "NI54D9905ABTS7", pcb_after: "DA94-08413X", apply: "24-ene" },
  { pjt: "RT5300C", model: "RT31DG5624S9EM", compressor_before: "NI34T9101ABTS7", pcb_before: "DA94-08413N", eeprom_after: "NI54D9905ABTS7", pcb_after: "DA94-08413X", apply: "24-ene" },
  { pjt: "RT5300C", model: "RT31DG5724B1EM", compressor_before: "NI34T9101ABTS7", pcb_before: "DA94-08413N", eeprom_after: "NI54D9905ABTS7", pcb_after: "DA94-08413X", apply: "24-ene" },
  { pjt: "RT5300C", model: "RT31DG5724S9EM", compressor_before: "NI34T9101ABTS7", pcb_before: "DA94-08413N", eeprom_after: "NI54D9905ABTS7", pcb_after: "DA94-08413X", apply: "24-ene" },
  { pjt: "RT5300C", model: "RT35DG5124S9EM", compressor_before: "NI34T9101ABTS7", pcb_before: "DA94-08413N", eeprom_after: "NI54D9905ABTS7", pcb_after: "DA94-08413X", apply: "24-ene" },
  { pjt: "RT5300C", model: "RT35DG5224S9EM", compressor_before: "NI34T9101ABTS7", pcb_before: "DA94-08413N", eeprom_after: "NI54D9905ABTS7", pcb_after: "DA94-08413X", apply: "24-ene" },
  { pjt: "RT5300C", model: "RT35DG5724S9EM", compressor_before: "NI34T9101ABTS7", pcb_before: "DA94-08413N", eeprom_after: "NI54D9905ABTS7", pcb_after: "DA94-08413X", apply: "24-ene" },

  { pjt: "RT6300C", model: "RT38DG6124S9EM", compressor_before: "NI34T9101ABTS7", pcb_before: "DA94-08413L", eeprom_after: "NI54D9905ABTS7", pcb_after: "DA94-08413W", apply: "24-ene" },
  { pjt: "RT6300C", model: "RT38DG6224S9EM", compressor_before: "NI34T9101ABTS7", pcb_before: "DA94-08413L", eeprom_after: "NI54D9905ABTS7", pcb_after: "DA94-08413W", apply: "24-ene" },
  { pjt: "RT6300C", model: "RT38DG6734S9EM", compressor_before: "NI34T9101ABTS7", pcb_before: "DA94-08413L", eeprom_after: "NI54D9905ABTS7", pcb_after: "DA94-08413W", apply: "24-ene" },
  { pjt: "RT6300C", model: "RT38DG6774B1EM", compressor_before: "NI34T9101ABTS7", pcb_before: "DA94-08413B", eeprom_after: "NI54D9905ABTS7", pcb_after: "DA94-08413T", apply: "24-ene" },
  { pjt: "RT6300C", model: "RT42DB6774ETEM", compressor_before: "NI34T9101ABTS7", pcb_before: "DA94-08413B", eeprom_after: "NI54D9905ABTS7", pcb_after: "DA94-08413T", apply: "24-ene" },
  { pjt: "RT6300C", model: "RT42DG6224S9EM", compressor_before: "NI34T9101ABTS7", pcb_before: "DA94-08413L", eeprom_after: "NI54D9905ABTS7", pcb_after: "DA94-08413W", apply: "24-ene" },
  { pjt: "RT6300C", model: "RT42DG6734B1EM", compressor_before: "NI34T9101ABTS7", pcb_before: "DA94-08413L", eeprom_after: "NI54D9905ABTS7", pcb_after: "DA94-08413W", apply: "24-ene" },
  { pjt: "RT6300C", model: "RT42DG6734S9EM", compressor_before: "NI34T9101ABTS7", pcb_before: "DA94-08413L", eeprom_after: "NI54D9905ABTS7", pcb_after: "DA94-08413W", apply: "24-ene" },
  { pjt: "RT6300C", model: "RT42DG6774S9EM", compressor_before: "NI34T9101ABTS7", pcb_before: "DA94-08413B", eeprom_after: "NI54D9905ABTS7", pcb_after: "DA94-08413T", apply: "24-ene" },

  { pjt: "RT6300D", model: "RT53DG6128S9EM", compressor_before: "NI34T9101ABTS7", pcb_before: "DA94-08413F", eeprom_after: "NI54D9905ABTS7", pcb_after: "DA94-08413V", apply: "24-ene" },
  { pjt: "RT6300D", model: "RT53DG6228B1EM", compressor_before: "NI34T9101ABTS7", pcb_before: "DA94-08413F", eeprom_after: "NI54D9905ABTS7", pcb_after: "DA94-08413V", apply: "24-ene" },
  { pjt: "RT6300D", model: "RT53DG6228S9EM", compressor_before: "NI34T9101ABTS7", pcb_before: "DA94-08413F", eeprom_after: "NI54D9905ABTS7", pcb_after: "DA94-08413V", apply: "24-ene" },
  { pjt: "RT6300D", model: "RT53DG6758B1EM", compressor_before: "NI34T9101ABTS7", pcb_before: "DA94-08413F", eeprom_after: "NI54D9905ABTS7", pcb_after: "DA94-08413V", apply: "24-ene" },
  { pjt: "RT6300D", model: "RT53DG6758S9EM", compressor_before: "NI34T9101ABTS7", pcb_before: "DA94-08413F", eeprom_after: "NI54D9905ABTS7", pcb_after: "DA94-08413V", apply: "24-ene" },
  { pjt: "RT6300D", model: "RT53DG6798B1EM", compressor_before: "NI34T9101ABTS7", pcb_before: "DA94-08413D", eeprom_after: "NI54D9905ABTS7", pcb_after: "DA94-08413U", apply: "24-ene" },
];

// =================== IMÁGENES POR MODELO ===================
const url_compresor = "https://images.samsung.com/is/image/samsung/assets/global/about-us/brand/logo/256_144_2.png?$512_N_PNG$";
const url_pcb       = "https://images.samsung.com/is/image/samsung/assets/global/about-us/brand/logo/256_144_2.png?$512_N_PNG$";

const MODEL_PART_IMAGES = {
  "RF22A4010S9/EM": { before: { compressor: url_compresor, pcb: url_pcb }, after: { compressor: url_compresor, pcb: url_pcb } },
  "RF22A4110S9/EM": { before: { compressor: url_compresor, pcb: url_pcb }, after: { compressor: url_compresor, pcb: url_pcb } },
  "RS27T5200B1/EM": { before: { compressor: url_compresor, pcb: url_pcb }, after: { compressor: url_compresor, pcb: url_pcb } },
  "RS27T5200S9/EM": { before: { compressor: url_compresor, pcb: url_pcb }, after: { compressor: url_compresor, pcb: url_pcb } },
  "RT31DG5124S9EM": { before: { compressor: url_compresor, pcb: url_pcb }, after: { compressor: url_compresor, pcb: url_pcb } },
  "RT53DG6128S9EM": { before: { compressor: url_compresor, pcb: url_pcb }, after: { compressor: url_compresor, pcb: url_pcb } },
  "RT42DG6734B1EM": { before: { compressor: url_compresor, pcb: url_pcb }, after: { compressor: url_compresor, pcb: url_pcb } },
};

const YEAR_MAP = { H: 2016, J: 2017, K: 2018, M: 2019, N: 2020, R: 2021, T: 2022, W: 2023, X: 2024, Y: 2025 };
const MONTH_MAP = { "1":1,"2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9,"A":10,"B":11,"C":12 };

export default function RefrigeratorPartsSelector() {
  const [serial, setSerial] = useState("");
  const [model, setModel] = useState("");
  const [serialDate, setSerialDate] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [modalImage, setModalImage] = useState(null);

  const handleSerialChange = (e) => {
    setSerial(e.target.value.toUpperCase());
    setSerialDate(null);
    setModel("");
    setResult(null);
    setError("");
  };

  const validateSerial = () => {
    if (serial.length < 15 || serial.length > 15) return setError("Número de serie inválido");
    const yearChar = serial[7];
    const monthChar = serial[8];
    const year = YEAR_MAP[yearChar];
    const month = MONTH_MAP[monthChar];
    if (!year || !month) return setError("Número de serie inválido");
    setSerialDate({ year, month });
    setError("");
  };

  const handleModelSubmit = () => {
    const data = DATA.find(d => d.model === model);
    if (!data) return setError("Modelo no encontrado en base de datos");

    let useType = "before";
    const { apply } = data;
    const sDate = new Date(serialDate.year, serialDate.month - 1, 1);

    if (apply === "Inactive") useType = "before";
    else if (apply === "10-ene" || apply === "24-ene") {
      const cutoff = new Date(2025, 1, 1);
      useType = sDate >= cutoff ? "after" : "before";
    } else if (apply.startsWith("W49")) {
      const cutoff = new Date(2025, 0, 1);
      useType = sDate >= cutoff ? "after" : "before";
    }

    const parts = useType === "before" 
      ? { pcb: data.pcb_before, compressor: data.compressor_before }
      : { pcb: data.pcb_after, eeprom: data.eeprom_after };

    setResult({ parts, useType, model });
    setError("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape" && modalImage) setModalImage(null);
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalImage]);

  return (
    <div className={styles.container}>

      <div className={styles.inputGroup}>
        <label>Número de serie:</label>
        <input type="text" value={serial} onChange={handleSerialChange} placeholder="Ingresa número de serie" />
        <button onClick={validateSerial}>Validar</button>
      </div>

      {serialDate && (
        <div className={styles.info}>
          <p>Fecha de fabricación: {serialDate.month}/{serialDate.year}</p>
          <div className={styles.inputGroup}>
            <label>Modelo:</label>
            <input type="text" value={model} onChange={e => setModel(e.target.value)} placeholder="Ingresa modelo" />
            <button onClick={handleModelSubmit}>Generar resultado</button>
          </div>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {result && (
        <div className={styles.result}>
          <h3>Resultado para {result.model} ({result.useType})</h3>
          <div className={styles.parts}>
            <div className={styles.part}>
              <p>PCB:</p>
              <img
                src={MODEL_PART_IMAGES[result.model]?.[result.useType]?.pcb || result.parts.pcb}
                alt="pcb"
                onClick={() => setModalImage(MODEL_PART_IMAGES[result.model]?.[result.useType]?.pcb || result.parts.pcb)}
              />
              <p className={styles.partName}>{result.parts.pcb}</p>
            </div>
            {result.useType === "before" ? (
              <div className={styles.part}>
                <p>Compresor:</p>
                <img
                  src={MODEL_PART_IMAGES[result.model]?.[result.useType]?.compressor || result.parts.compressor}
                  alt="compressor"
                  onClick={() => setModalImage(MODEL_PART_IMAGES[result.model]?.[result.useType]?.compressor || result.parts.compressor)}
                />
                <p className={styles.partName}>{result.parts.compressor}</p>
              </div>
            ) : (
              <div className={styles.part}>
                <p>EEPROM:</p>
                <img
                  src={MODEL_PART_IMAGES[result.model]?.[result.useType]?.compressor || result.parts.eeprom}
                  alt="eeprom"
                  onClick={() => setModalImage(MODEL_PART_IMAGES[result.model]?.[result.useType]?.compressor || result.parts.eeprom)}
                />
                <p className={styles.partName}>{result.parts.eeprom}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {modalImage && (
        <div className={styles.modal} onClick={() => setModalImage(null)}>
          <img src={modalImage} alt="expand" className={styles.modalImage} />
        </div>
      )}
    </div>
  );
}
