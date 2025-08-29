import React, { useState } from "react";
import styles from "../styles/RefrigeratorLookup.module.css"; // usamos CSS Modules

const YEAR_MAP = { H:2016, J:2017, K:2018, M:2019, N:2020, R:2021, T:2022, W:2023, X:2024, Y:2025 };
const MONTH_MAP = { "1":1,"2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9,"A":10,"B":11,"C":12 };

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

const RESTRICTED_MESSAGES = [
  "Asistir a domicilio para validar partes.",
  "Se necesita ir a revisar producto con visita técnica."
];

const ProductCheck = () => {
  const [serial, setSerial] = useState("");
  const [model, setModel] = useState("");
  const [result, setResult] = useState(null);
  const [expandedImage, setExpandedImage] = useState(null);

  const handleCheck = () => {
    if (!serial || !model) return;
    if (serial.length < 9) return setResult({ message: "Número de serie inválido" });

    const year = YEAR_MAP[serial[7]];
    const month = MONTH_MAP[serial[8]];
    if (!year || !month) return setResult({ message: "Número de serie inválido" });

    const product = DATA.find(p => p.model === model);
    if (!product) return setResult({ message: "Producto no encontrado" });

    const { apply, pcb_before, pcb_after, compressor_before, eeprom_after } = product;

    let message = "";
    let parts = {};
    let imageKey = "before";

    if (apply === "Inactive") {
      parts = { pcb: pcb_before, compressor: compressor_before };
      message = "Usar PCB y compresor antes de la actualización.";
      imageKey = "before";
    } else if (apply === "10-ene" || apply === "24-ene") {
      if (year === 2025 && month === 1) {
        message = "Se necesita ir a revisar producto con visita técnica.";
        imageKey = "after";
      } else if (year > 2025 || (year === 2025 && month > 1)) {
        parts = { pcb: pcb_after, eeprom: eeprom_after };
        message = "Usar PCB y EEPROM después de actualización.";
        imageKey = "after";
      } else {
        parts = { pcb: pcb_before, compressor: compressor_before };
        message = "Usar PCB y compresor antes de actualización.";
        imageKey = "before";
      }
    } else if (apply.toLowerCase() === "w49") {
      if (year === 2024 && month === 12) {
        message = "Asistir a domicilio para validar partes.";
        imageKey = "after";
      } else if (year > 2024 || (year === 2025 && month >= 1)) {
        parts = { pcb: pcb_after, eeprom: eeprom_after };
        message = "Usar PCB y EEPROM después de actualización.";
        imageKey = "after";
      } else {
        parts = { pcb: pcb_before, compressor: compressor_before };
        message = "Usar PCB y compresor antes de actualización.";
        imageKey = "before";
      }
    }

    const images = MODEL_PART_IMAGES[model] ? MODEL_PART_IMAGES[model][imageKey] : null;
    setResult({ message, parts, images, year, month });
  };

  return (
    <div className={styles.container}>

      <div className={styles.inputGroup}>
        <label className={styles.label}>Número de serie:</label>
        <input
          type="text"
          value={serial}
          onChange={e => setSerial(e.target.value)}
          placeholder="Número de serie de 15 caracteres"
          className={styles.input}
        />
      </div>

      <div className={styles.inputGroup}>
        <label className={styles.label}>Modelo:</label>
        <input
          type="text"
          value={model}
          onChange={e => setModel(e.target.value)}
          placeholder="Ej. RF22A4010S9/EM"
          className={styles.input}
        />
      </div>

      <button onClick={handleCheck} className={styles.button}>Verificar</button>

      {result && (
        <div className={styles.resultCard}>
          <p><strong>Mensaje:</strong> {result.message}</p>
          <p><strong>Fabricación:</strong> {result.month}/{result.year}</p>

          {/* Mostrar partes solo si el mensaje NO está restringido */}
          {result.parts && !RESTRICTED_MESSAGES.includes(result.message) && (
            <div className={styles.partsList}>
              {result.parts.pcb && <p>PCB: {result.parts.pcb}</p>}
              {result.parts.compressor && <p>Compresor: {result.parts.compressor}</p>}
              {result.parts.eeprom && <p>EEPROM: {result.parts.eeprom}</p>}
            </div>
          )}

          {/* Mostrar imágenes solo si el mensaje NO está restringido */}
          {result.images && !RESTRICTED_MESSAGES.includes(result.message) && (
            <div className={styles.imagesContainer}>
              {result.images.pcb && (
                <img
                  className={styles.image}
                  src={result.images.pcb}
                  alt="PCB"
                  onClick={() => setExpandedImage(result.images.pcb)}
                />
              )}
              {result.images.compressor && (
                <img
                  className={styles.image}
                  src={result.images.compressor}
                  alt="Compresor"
                  onClick={() => setExpandedImage(result.images.compressor)}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal de imagen expandida */}
      {expandedImage && (
        <div className={styles.modalOverlay} onClick={() => setExpandedImage(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()} >
            <img src={expandedImage} alt="Parte expandida" className={styles.expandedImage} onClick={() => setExpandedImage(null)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCheck;
