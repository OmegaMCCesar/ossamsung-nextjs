import React, { useMemo, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Search, Info, CheckCircle2, AlertTriangle, ClipboardCopy, X } from "lucide-react";
import styles from "../styles/RefrigeratorLookup.module.css";

/**
 * Flujo:
 * 1) Primero SN (15). Cuando es válido → aparece input de Modelo.
 * 2) Con SN válido + Modelo encontrado → se muestran resultados:
 *    - W49 o Inactive → solo Antes.
 *    - RF4500 o apply = 24-ene → SN < feb-2025 = Antes; SN >= feb-2025 = Después.
 *    - Resto → Antes y Después.
 * Al final se resume qué motor y PCB corresponden.
 */

// =================== DATA (boletín) ===================
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

const DEFAULT_PART_IMAGES = {
  before: { compressor: url_compresor, pcb: url_pcb },
  after:  { compressor: url_compresor, pcb: url_pcb },
};

// =================== HELPERS ===================
function badgeClass(apply) {
  if (!apply) return styles.badgeGray;
  const val = String(apply).toLowerCase();
  if (val.includes("inactive")) return styles.badgeRed;
  if (val.endsWith("w49") || val.startsWith("w")) return styles.badgeBlue;
  return styles.badgeGreen;
}
function copy(text) { if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text); }
const normalize = (s) => (s || "").toString().trim().toLowerCase();

function normalizeSerial(snRaw = "") {
  return (snRaw || "").toUpperCase().replace(/Υ/g, "Y").replace(/[^A-Z0-9]/g, "");
}
const YEAR_MAP = { H: 2016, J: 2017, K: 2018, M: 2019, N: 2020, R: 2021, T: 2022, W: 2023, X: 2024, Y: 2025 };
const MONTH_MAP = { "1":1,"2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9, A:10, B:11, C:12 };
const MONTH_NAMES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const CUTOFF = new Date(2025, 1, 1); // 01-feb-2025

function decodeSerial(snRaw) {
  const sn = normalizeSerial(snRaw);
  const valid = /^[A-Z0-9]{15}$/.test(sn);
  if (!valid) return { sn, valid, message: "SN debe tener 15 caracteres alfanuméricos." };
  const yearCode = sn[7];
  const monthCode = sn[8];
  const year = YEAR_MAP[yearCode];
  const month = MONTH_MAP[monthCode?.toUpperCase()];
  if (!year) return { sn, valid: false, message: `Código de año no definido (${yearCode}).` };
  if (!month) return { sn, valid: false, message: `Código de mes no válido (${monthCode}).` };
  const dateObj = new Date(year, month - 1, 1);
  const nice = `${MONTH_NAMES[month - 1]} ${year}`;
  const isBeforeCutoff = dateObj < CUTOFF;
  return { sn, valid: true, year, month, nice, isBeforeCutoff };
}

function isApply24Ene(apply = "") {
  const norm = String(apply).toLowerCase().replace(/[\s-]/g, "");
  return norm === "24ene";
}

// Resolver imágenes por modelo con fallback
function getImagesForModel(model = "") {
  const entry = MODEL_PART_IMAGES[model] || {};
  return {
    before: {
      compressor: entry?.before?.compressor || DEFAULT_PART_IMAGES.before.compressor,
      pcb: entry?.before?.pcb || DEFAULT_PART_IMAGES.before.pcb,
    },
    after: {
      compressor: entry?.after?.compressor || DEFAULT_PART_IMAGES.after.compressor,
      pcb: entry?.after?.pcb || DEFAULT_PART_IMAGES.after.pcb,
    },
  };
}

// Mini-componente imagen + lightbox
function ImgBox({ src, alt, caption, onOpen }) {
  return (
    <figure className={styles.imgBox}>
      <button type="button" className={styles.imgBtn} onClick={() => onOpen?.(src, alt, caption)} title="Ver en grande">
        <div className={styles.imageWrap}>
          <Image src={src} alt={alt} fill sizes="(max-width: 768px) 50vw, 33vw" className={styles.imageContain} />
        </div>
      </button>
      <figcaption className={styles.imgCaption}>{caption}</figcaption>
    </figure>
  );
}

// =================== COMPONENTE ===================
export default function RefrigeratorLookup() {
  // Paso 1: SN
  const [serial, setSerial] = useState("");
  const snInfo = useMemo(() => decodeSerial(serial), [serial]);
  const snValid = !!snInfo?.valid;

  // Paso 2: Modelo (solo aparece cuando SN es válido)
  const [modelInput, setModelInput] = useState("");
  const chosen = useMemo(() => {
    const q = normalize(modelInput);
    if (!q) return null;
    return DATA.find((r) => normalize(r.model) === q) || null;
  }, [modelInput]);

  // Lightbox
  const [lightbox, setLightbox] = useState({ open: false, src: "", alt: "", caption: "" });
  const openLightbox = useCallback((src, alt, caption) => setLightbox({ open: true, src, alt, caption }), []);
  const closeLightbox = useCallback(() => setLightbox((p) => ({ ...p, open: false })), []);
  useEffect(() => {
    if (!lightbox.open) return;
    const onKey = (e) => { if (e.key === "Escape") closeLightbox(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox.open, closeLightbox]);

  // Reglas por modelo
  const isRF4500 = (chosen?.pjt || "").toUpperCase() === "RF4500";
  const applyStr = String(chosen?.apply || "").toUpperCase();
  const isW49 = applyStr.endsWith("W49");
  const isInactive = applyStr.includes("INACTIVE");
  const needs24EneSN = isApply24Ene(chosen?.apply);

  // Recomendación y secciones a mostrar (solo cuando hay SN válido + modelo encontrado)
  const ready = snValid && !!chosen;

  const recommended = useMemo(() => {
    if (!ready) return null;
    if (isW49 || isInactive) return "before";
    if (isRF4500 || needs24EneSN) return snInfo.isBeforeCutoff ? "before" : "after";
    return "both";
  }, [ready, isW49, isInactive, isRF4500, needs24EneSN, snInfo]);

  const showBefore = recommended === "before" || recommended === "both";
  const showAfter  = recommended === "after"  || recommended === "both";

  // Mensaje decisión
  const decision = useMemo(() => {
    if (!snValid) return { text: "Escribe el número de serie (15).", tone: "info" };
    if (!chosen) return { text: "Escribe el modelo exacto.", tone: "info" };

    if (isW49) return { text: "Aplica W49: usar compresor y PCB originales (Antes).", tone: "info" };
    if (isInactive) return { text: "Estado Inactive: usar compresor y PCB originales (Antes).", tone: "info" };

    if (isRF4500 || needs24EneSN) {
      if (snInfo.isBeforeCutoff) {
        return { text: `${chosen.apply}: fabricado en ${snInfo.nice} (antes de feb-2025). Usar Antes (original).`, tone: "warn" };
      }
      return { text: `${chosen.apply}: fabricado en ${snInfo.nice} (feb-2025 o después). Usar Después (kit nuevo).`, tone: "ok" };
    }

    return { text: "Este modelo admite Antes y Después.", tone: "info" };
  }, [snValid, chosen, isW49, isInactive, isRF4500, needs24EneSN, snInfo]);

  const toneIcon = (t) =>
    t === "ok" ? <CheckCircle2 className={styles.iconGreen} /> :
    t === "warn" ? <AlertTriangle className={styles.iconAmber} /> :
    <Info className={styles.iconMuted} />;

  const toneBadgeClass = (t) =>
    t === "ok" ? styles.badgeGreen : t === "warn" ? styles.badgeRed : styles.badgeBlue;

  // Imágenes segun modelo
  const partImgs = getImagesForModel(chosen?.model);

  // Datos para resumen
  const motorCode = chosen?.compressor_before || "-"; // no hay compresor_after en el boletín
  const pcbBefore = chosen?.pcb_before || "-";
  const pcbAfter  = chosen?.pcb_after  || "-";
  const eeprom    = chosen?.eeprom_after && chosen.eeprom_after !== "-" ? chosen.eeprom_after : null;

  return (
    <div className={styles.container}>
      {/* Paso 1: Número de serie */}
      <div className={styles.searchRow}>
        <Search className={styles.iconMuted} />
        <input
          type="text"
          value={serial}
          onChange={(e) => setSerial(normalizeSerial(e.target.value))}
          placeholder="Número de serie (15 caracteres, ej. 0B2R4BBX400343M)"
          className={styles.input}
          maxLength={15}
        />
        <span className={`${styles.badge} ${serial ? (snValid ? styles.badgeGreen : styles.badgeRed) : styles.badgeGray}`}>
          {serial ? (snValid ? "SN válido" : "SN inválido") : "SN"}
        </span>
        {snValid && (
          <span className={`${styles.badge} ${styles.badgeBlue}`} title="Fecha de fabricación">
            {snInfo.nice}
          </span>
        )}
      </div>

      {/* Paso 2: Modelo (solo si SN válido) */}
      {snValid && (
        <div className={styles.searchRow}>
          <Search className={styles.iconMuted} />
          <input
            type="text"
            value={modelInput}
            onChange={(e) => setModelInput(e.target.value)}
            placeholder="Modelo exacto (ej. RS27T5200B1/EM)"
            className={styles.input}
          />
        </div>
      )}

      {/* Ayudas cuando falta info */}
      {!snValid && (
        <div className={styles.helper}>
          <Info className={styles.helperIcon} />
          <p>Primero escribe un SN válido de 15 caracteres.</p>
        </div>
      )}
      {snValid && !chosen && modelInput && (
        <div className={styles.helper}>
          <AlertTriangle className={styles.iconAmber} />
          <p>Modelo no encontrado. Revisa mayúsculas, guiones y sufijos.</p>
        </div>
      )}

      {/* Tarjeta de resultado: solo con SN válido + modelo */}
      {ready && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <small style={{ display: "block", color: "#6b7280", fontSize: 12 }}>PJT / Plataforma</small>
              <strong style={{ display: "block" }}>{chosen.pjt}</strong>
            </div>
            <div style={{ textAlign: "right" }}>
              <small style={{ display: "block", color: "#6b7280", fontSize: 12 }}>Modelo</small>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
                {chosen.model}
                <button onClick={() => copy(chosen.model)} title="Copiar modelo" className={styles.copyBtn}>
                  <ClipboardCopy className={styles.copyIcon} />
                </button>
              </div>
            </div>
          </div>

          <div className={styles.cardGrid}>
            {/* ANTES */}
            {showBefore && (
              <div className={`${styles.section} ${styles.sectionBefore}`}>
                <div className={styles.sectionTitle}>
                  <AlertTriangle className={styles.iconAmber} />
                  <h3>Antes</h3>
                  {recommended === "before" && <span className={`${styles.badge} ${styles.badgeGreen}`} style={{ marginLeft: 8 }}>Indicado</span>}
                </div>
                <ul className={styles.list}>
                  <li className={styles.listItem}>
                    <span className={styles.label}>Compresor:</span>
                    <span className={styles.code}>{chosen.compressor_before}</span>
                    <button onClick={() => copy(chosen.compressor_before)} className={styles.copyBtn} title="Copiar compresor">
                      <ClipboardCopy className={styles.copyIcon} />
                    </button>
                  </li>
                  <li className={styles.listItem}>
                    <span className={styles.label}>PCB:</span>
                    <span className={styles.code}>{chosen.pcb_before}</span>
                    <button onClick={() => copy(chosen.pcb_before)} className={styles.copyBtn} title="Copiar PCB">
                      <ClipboardCopy className={styles.copyIcon} />
                    </button>
                  </li>
                </ul>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
                  <ImgBox src={partImgs.before.compressor} alt={`Compresor - ${chosen.model}`} caption="Compresor (Antes)" onOpen={openLightbox} />
                  <ImgBox src={partImgs.before.pcb}        alt={`PCB - ${chosen.model}`}        caption="PCB (Antes)"        onOpen={openLightbox} />
                </div>
              </div>
            )}

            {/* DESPUÉS */}
            {showAfter && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>
                  <CheckCircle2 className={styles.iconGreen} />
                  <h3>Después</h3>
                  {recommended === "after" && <span className={`${styles.badge} ${styles.badgeGreen}`} style={{ marginLeft: 8 }}>Indicado</span>}
                </div>
                <ul className={styles.list}>
                  <li className={styles.listItem}>
                    <span className={styles.label}>EEPROM:</span>
                    <span className={styles.code}>{chosen.eeprom_after}</span>
                    {eeprom && (
                      <button onClick={() => copy(chosen.eeprom_after)} className={styles.copyBtn} title="Copiar EEPROM">
                        <ClipboardCopy className={styles.copyIcon} />
                      </button>
                    )}
                  </li>
                  <li className={styles.listItem}>
                    <span className={styles.label}>PCB:</span>
                    <span className={styles.code}>{chosen.pcb_after}</span>
                    <button onClick={() => copy(chosen.pcb_after)} className={styles.copyBtn} title="Copiar PCB">
                      <ClipboardCopy className={styles.copyIcon} />
                    </button>
                  </li>
                </ul>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
                  <ImgBox src={partImgs.after.compressor} alt={`Compresor - ${chosen.model}`} caption="Compresor (Después)" onOpen={openLightbox} />
                  <ImgBox src={partImgs.after.pcb}        alt={`PCB - ${chosen.model}`}        caption="PCB (Después)"        onOpen={openLightbox} />
                </div>

                <div className={styles.helper} style={{ marginTop: 10 }}>
                  <Info className={styles.helperIcon} />
                  <p>W## son semanas; 10-ene y 24-ene son fechas (día-mes). Inactive indica actualización retirada.</p>
                </div>
              </div>
            )}
          </div>

          {/* Indicación general */}
          <div className={styles.section}>
            <div className={styles.sectionTitle} style={{ marginBottom: 6 }}>
              {toneIcon(decision.tone)}
              <h3>Indicación</h3>
            </div>
            <div className={styles.helper}>
              <span className={`${styles.badge} ${toneBadgeClass(decision.tone)}`}>
                {isW49 ? "W49" : isInactive ? "Inactive" : (isRF4500 || needs24EneSN) ? snInfo.nice : "Modelo"}
              </span>
              <p style={{ margin: 0 }}>{decision.text}</p>
            </div>
          </div>

          {/* Resumen final */}
          <div className={styles.section}>
            <div className={styles.sectionTitle} style={{ marginBottom: 6 }}>
              <Info className={styles.iconMuted} />
              <h3>Resumen</h3>
            </div>

            {recommended === "before" && (
              <div className={styles.helper}>
                <span className={`${styles.badge} ${styles.badgeGreen}`}>Antes</span>
                <p style={{ margin: 0 }}>
                  Motor: <strong>{motorCode}</strong> — PCB: <strong>{pcbBefore}</strong>.
                </p>
              </div>
            )}

            {recommended === "after" && (
              <div className={styles.helper}>
                <span className={`${styles.badge} ${styles.badgeGreen}`}>Después</span>
                <p style={{ margin: 0 }}>
                  Motor: <strong>{motorCode}</strong> (sin cambio). PCB: <strong>{pcbAfter}</strong>
                  {eeprom ? <> — EEPROM: <strong>{eeprom}</strong></> : null}.
                </p>
              </div>
            )}

            {recommended === "both" && (
              <>
                <div className={styles.helper}>
                  <span className={`${styles.badge} ${styles.badgeBlue}`}>De fábrica</span>
                  <p style={{ margin: 0 }}>
                    Motor: <strong>{motorCode}</strong> — PCB: <strong>{pcbBefore}</strong>.
                  </p>
                </div>
                <div className={styles.helper}>
                  <span className={`${styles.badge} ${styles.badgeBlue}`}>Actualizado</span>
                  <p style={{ margin: 0 }}>
                    PCB: <strong>{pcbAfter}</strong>{eeprom ? <> — EEPROM: <strong>{eeprom}</strong></> : null}. El compresor no cambia.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* LIGHTBOX */}
      {lightbox.open && (
        <div className={styles.lbBackdrop} onClick={closeLightbox}>
          <div
            className={styles.lbCard}
            role="dialog"
            aria-modal="true"
            aria-label="Vista ampliada"
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className={styles.lbClose} onClick={closeLightbox} aria-label="Cerrar" title="Cerrar">
              <X size={20} />
            </button>
            <div className={styles.lbImgWrap}>
              <Image
                src={lightbox.src}
                alt={lightbox.alt || "Imagen ampliada"}
                fill
                sizes="100vw"
                className={styles.imageContain}
                priority
              />
            </div>
            {lightbox.caption && <div className={styles.lbCaption}>{lightbox.caption}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
