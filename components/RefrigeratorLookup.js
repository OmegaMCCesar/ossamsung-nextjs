// RefrigeratorLookup.jsx
import React, { useMemo, useState } from "react";
import Image from "next/image";
import { Search, Info, CheckCircle2, AlertTriangle, ClipboardCopy } from "lucide-react";
import styles from "../styles/RefrigeratorLookup.module.css";

/**
 * Reglas:
 * - RF4500 y apply === "24-ene": exige SN (15). < feb-2025 => solo "Antes"; >= feb-2025 => "Antes" + "Después".
 * - apply termina en "W49" o "Inactive": sin SN, solo "Antes".
 * - Resto: sin SN, "Antes" + "Después".
 * Imágenes:
 * - Por modelo y por estado (Antes/Después) y por parte (compresor/PCB).
 * - Si no hay mapeo => placeholders.
 */

// =================== DATA (boletín) ===================
const DATA = [
  // Schema: { pjt, model, compressor_before, pcb_before, eeprom_after, pcb_after, apply }
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
// URL temporal (logo Samsung) para compresor y PCB:
const url_compresor = "https://images.samsung.com/is/image/samsung/assets/global/about-us/brand/logo/256_144_2.png?$512_N_PNG$";
const url_pcb       = "https://images.samsung.com/is/image/samsung/assets/global/about-us/brand/logo/256_144_2.png?$512_N_PNG$";

const MODEL_PART_IMAGES = {
  "RF22A4010S9/EM": {
    before: { compressor: url_compresor, pcb: url_pcb },
    after:  { compressor: url_compresor, pcb: url_pcb },
  },
  "RF22A4110S9/EM": {
    before: { compressor: url_compresor, pcb: url_pcb },
    after:  { compressor: url_compresor, pcb: url_pcb },
  },
  "RS27T5200B1/EM": {
    before: { compressor: url_compresor, pcb: url_pcb },
    after:  { compressor: url_compresor, pcb: url_pcb },
  },
  "RS27T5200S9/EM": {
    before: { compressor: url_compresor, pcb: url_pcb },
    after:  { compressor: url_compresor, pcb: url_pcb },
  },
  "RT31DG5124S9EM": {
    before: { compressor: url_compresor, pcb: url_pcb },
    after:  { compressor: url_compresor, pcb: url_pcb },
  },
  "RT53DG6128S9EM": {
    before: { compressor: url_compresor, pcb: url_pcb },
    after:  { compressor: url_compresor, pcb: url_pcb },
  },
  "RT42DG6734B1EM": {
    before: { compressor: url_compresor, pcb: url_pcb },
    after:  { compressor: url_compresor, pcb: url_pcb },
  },
  // ...cuando tengas URLs reales, solo reemplázalas aquí.
};

// Placeholders por defecto → también URLs
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
  return styles.badgeGreen; // fecha (10-ene / 24-ene)
}
function copy(text) { if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text); }
const normalize = (s) => (s || "").toString().trim().toLowerCase();

function normalizeSerial(snRaw = "") {
  return (snRaw || "").toUpperCase().replace(/Υ/g, "Y").replace(/[^A-Z0-9]/g, "");
}
const YEAR_MAP = { W: 2023, X: 2024, Y: 2025 };
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

// Pequeño wrapper para usar next/image con fill
function ImgBox({ src, alt, caption }) {
  return (
    <figure style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", margin: 0 }}>
      <div className={styles.imageWrap}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 50vw, 33vw"
          className={styles.imageContain}
        />
      </div>
      <figcaption style={{ padding: "6px 10px", fontSize: 12, color: "#6b7280" }}>{caption}</figcaption>
    </figure>
  );
}

// =================== COMPONENTE ===================
export default function RefrigeratorLookup() {
  const [query, setQuery] = useState("");
  const [pjtFilter, setPjtFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [serial, setSerial] = useState("");

  const platformSet = useMemo(() => [...new Set(DATA.map((d) => d.pjt))], []);

  // Búsqueda por modelo
  const results = useMemo(() => {
    const q = normalize(query);
    const pf = normalize(pjtFilter);
    let base = DATA.filter((r) => !pf || normalize(r.pjt) === pf);
    if (!q) return base.slice(0, 50);
    const starts = base.filter((r) => normalize(r.model).startsWith(q));
    const includes = base.filter((r) => !starts.includes(r) && normalize(r.model).includes(q));
    return [...starts, ...includes].slice(0, 50);
  }, [query, pjtFilter]);

  const exact = useMemo(() => {
    const q = normalize(query);
    if (!q) return null;
    return DATA.find((r) => normalize(r.model) === q && (!pjtFilter || normalize(r.pjt) === normalize(pjtFilter))) || null;
  }, [query, pjtFilter]);

  const chosen = selected || exact || (results.length === 1 ? results[0] : null);

  // Flags por modelo
  const isRF4500 = (chosen?.pjt || "").toUpperCase() === "RF4500";
  const applyStr = String(chosen?.apply || "").toUpperCase();
  const isW49 = applyStr.endsWith("W49");
  const isInactive = applyStr.includes("INACTIVE");
  const needs24EneSN = isApply24Ene(chosen?.apply);

  // ¿Se pide SN?
  const requireSerial = !!chosen && (isRF4500 || needs24EneSN);

  // Info SN si aplica
  const snInfo = useMemo(() => (requireSerial ? decodeSerial(serial) : null), [serial, requireSerial]);

  // Mostrar sección "Después"
  const showAfterSection = useMemo(() => {
    if (!chosen) return false;
    if (isW49 || isInactive) return false; // siempre solo "Antes"
    if (isRF4500 || needs24EneSN) {
      if (!snInfo?.valid) return false;
      return !snInfo.isBeforeCutoff; // solo si >= feb-2025
    }
    // Otros modelos → siempre ambas
    return true;
  }, [chosen, isRF4500, isW49, isInactive, needs24EneSN, snInfo]);

  // ¿Qué columna va “Indicado”?
  const indicated = useMemo(() => {
    if (!chosen) return null;
    if (isW49 || isInactive) return "before";
    if ((isRF4500 || needs24EneSN) && snInfo?.valid) {
      return snInfo.isBeforeCutoff ? "before" : "after";
    }
    return null; // otros modelos, sin SN → sin indicado explícito
  }, [chosen, isRF4500, isW49, isInactive, needs24EneSN, snInfo]);

  // Mensaje final
  const decision = useMemo(() => {
    if (!chosen) return { text: "Selecciona un modelo para revisar si aplica al boletín.", tone: "info" };
    if (isW49) return { text: "“Aplica W49”: seguir utilizando compresor y PCB originales (no se usa SN).", tone: "info" };
    if (isInactive) return { text: "Estado “Inactive”: seguir utilizando compresor y PCB originales.", tone: "info" };

    if (isRF4500 || needs24EneSN) {
      if (!serial) return { text: "Ingresa el número de serie (15) para validar fecha de fabricación.", tone: "info" };
      if (!snInfo?.valid) return { text: snInfo?.message || "SN inválido.", tone: "warn" };
      if (snInfo.isBeforeCutoff) {
        return { text: `${chosen.apply}: fabricado en ${snInfo.nice} (ANTES de feb-2025) → usar compresor y PCB originales (solo “Antes”).`, tone: "warn" };
      }
      return { text: `${chosen.apply}: fabricado en ${snInfo.nice} (feb-2025 o DESPUÉS) → usar “Después” (EEPROM/PCB nuevos).`, tone: "ok" };
    }

    return { text: "Este modelo no requiere validación por SN. Se muestran “Antes” y “Después”.", tone: "info" };
  }, [chosen, isRF4500, needs24EneSN, isW49, isInactive, serial, snInfo]);

  const toneIcon = (t) =>
    t === "ok" ? <CheckCircle2 className={styles.iconGreen} /> :
    t === "warn" ? <AlertTriangle className={styles.iconAmber} /> :
    <Info className={styles.iconMuted} />;

  const toneBadgeClass = (t) =>
    t === "ok" ? styles.badgeGreen : t === "warn" ? styles.badgeRed : styles.badgeBlue;

  // Estilo inline para resaltar la sección indicada
  const indicatedStyle = (side) =>
    indicated === side
      ? { borderColor: "#10b981", boxShadow: "0 0 0 1px #10b981 inset" }
      : undefined;

  // Imágenes según modelo (compresor + PCB)
  const partImgs = getImagesForModel(chosen?.model);

  return (
    <div className={styles.container}>
      {/* Buscador de modelo (primero) */}
      <div className={styles.searchRow}>
        <Search className={styles.iconMuted} />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
          placeholder="Escribe el modelo (ej. RS27T5200B1/EM)"
          className={styles.input}
        />
      </div>

      {/* Filtro por PJT */}
      <div className={styles.filters}>
        <div className={styles.filtersLabel}>Filtrar por plataforma (PJT)</div>
        <div className={styles.filtersRow}>
          {platformSet.map((p) => (
            <button
              key={p}
              onClick={() => { setPjtFilter(p); setQuery(""); setSelected(null); }}
              className={styles.filterBtn}
              aria-pressed={normalize(pjtFilter) === normalize(p)}
              style={{ borderColor: normalize(pjtFilter) === normalize(p) ? "#3b82f6" : undefined }}
              title={`Filtrar por ${p}`}
            >
              {p}
            </button>
          ))}
          {pjtFilter && (
            <button onClick={() => { setPjtFilter(""); setSelected(null); }} className={styles.filterBtn}>
              Quitar filtro
            </button>
          )}
        </div>
      </div>

      {/* Sugerencias de modelo */}
      {(results.length > 0 && (query || pjtFilter)) && (
        <div className={styles.suggestionsGrid}>
          {results.map((r) => (
            <button
              key={r.model}
              onClick={() => setSelected(r)}
              className={styles.suggestionBtn}
              style={{ borderColor: (selected?.model === r.model) ? "#3b82f6" : undefined }}
            >
              <div className={styles.pjt}>{r.pjt}</div>
              <div className={styles.model}>{r.model}</div>
              <span className={`${styles.badge} ${badgeClass(r.apply)}`}>{r.apply}</span>
            </button>
          ))}
        </div>
      )}

      {/* Campo de Número de Serie: RF4500 o 24-ene */}
      {chosen && (isRF4500 || needs24EneSN) && (
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
          <span className={`${styles.badge} ${serial && snInfo?.valid ? styles.badgeGreen : serial ? styles.badgeRed : styles.badgeGray}`}>
            {serial ? (snInfo?.valid ? "SN válido" : "SN inválido") : "SN"}
          </span>
          {snInfo?.valid && (
            <span className={`${styles.badge} ${styles.badgeBlue}`} title="Fecha de fabricación">
              {snInfo.nice}
            </span>
          )}
        </div>
      )}

      {/* Tarjeta de resultado */}
      {chosen ? (
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
            <div className={`${styles.section} ${styles.sectionBefore}`} style={indicatedStyle("before")}>
              <div className={styles.sectionTitle}>
                <AlertTriangle className={styles.iconAmber} />
                <h3>Antes</h3>
                {indicated === "before" && (
                  <span className={`${styles.badge} ${styles.badgeGreen}`} style={{ marginLeft: 8 }}>Indicado</span>
                )}
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

              {/* Imágenes ANTES */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
                <ImgBox src={partImgs.before.compressor} alt={`Compresor (Antes) - ${chosen.model}`} caption="Compresor (Antes)" />
                <ImgBox src={partImgs.before.pcb}        alt={`PCB (Antes) - ${chosen.model}`}        caption="PCB (Antes)" />
              </div>
            </div>

            {/* DESPUÉS */}
            {showAfterSection && (
              <div className={styles.section} style={indicatedStyle("after")}>
                <div className={styles.sectionTitle}>
                  <CheckCircle2 className={styles.iconGreen} />
                  <h3>Después</h3>
                  {indicated === "after" && (
                    <span className={`${styles.badge} ${styles.badgeGreen}`} style={{ marginLeft: 8 }}>Indicado</span>
                  )}
                </div>
                <ul className={styles.list}>
                  <li className={styles.listItem}>
                    <span className={styles.label}>EEPROM:</span>
                    <span className={styles.code}>{chosen.eeprom_after}</span>
                    {chosen.eeprom_after && chosen.eeprom_after !== "-" && (
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

                {/* Imágenes DESPUÉS */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
                  <ImgBox src={partImgs.after.compressor} alt={`Compresor (Después) - ${chosen.model}`} caption="Compresor (Después)" />
                  <ImgBox src={partImgs.after.pcb}        alt={`PCB (Después) - ${chosen.model}`}        caption="PCB (Después)" />
                </div>

                <div className={styles.helper} style={{ marginTop: 10 }}>
                  <Info className={styles.helperIcon} />
                  <p>
                    “W##” son semanas de calendario; “10-ene / 24-ene” son fechas (día-mes).
                    Si ves <strong>Inactive</strong>, la actualización fue retirada/no vigente.
                  </p>
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
                {(isRF4500 || needs24EneSN) && snInfo?.valid ? snInfo.nice : isW49 ? "W49" : isInactive ? "Inactive" : "Modelo"}
              </span>
              <p style={{ margin: 0 }}>{decision.text}</p>
            </div>
          </div>
        </div>
      ) : (query || pjtFilter) ? (
        <div className={styles.empty}>
          {pjtFilter ? "Selecciona un modelo de la lista filtrada o escribe uno específico." : "Escribe el modelo completo para ver los detalles."}
        </div>
      ) : (
        <div className={styles.empty}>Empieza escribiendo un modelo y/o filtra por PJT.</div>
      )}
    </div>
  );
}
