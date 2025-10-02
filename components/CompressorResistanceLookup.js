import React, { useEffect, useMemo, useState } from "react";
import styles from "../styles/CompressorLookup.module.css";
import Link from "next/link";
const STORAGE_KEY = "compressor_resistances_dataset_v1";

const seedData = [
  { model: "MKV190CL2B/SM1", u_v: 7.9, v_w: 7.9, w_u: 7.9 },
  { model: "MKV190CL2J/SM1", u_v: 11.4, v_w: 11.4, w_u: 11.4 },
  { model: "MKV190GL2J/SM1", u_v: 11.4, v_w: 11.4, w_u: 11.4 },
  { model: "MSV172AL2J/SM1", u_v: 14.3, v_w: 14.3, w_u: 14.3 },
  { model: "MSV172AL2J/SM3", u_v: 14.3, v_w: 14.3, w_u: 14.3 },
  { model: "NC1MV72ASR/SM3", u_v: 10.4, v_w: 10.4, w_u: 10.4 },
  { model: "NC1MV90ALP/SM1", u_v: 8.1, v_w: 8.1, w_u: 8.1 },
  { model: "NC1MV90ALP/SM3", u_v: 8.1, v_w: 8.1, w_u: 8.1 },
  { model: "NF54M5151ARTT3", u_v: 11.2, v_w: 11.2, w_u: 11.2 },
  { model: "NF54M7151ANTT3", u_v: 12.0, v_w: 12.0, w_u: 12.0 },
  { model: "MSV4A1AL1R/TT3", u_v: 14.3, v_w: 14.3, w_u: 14.3 },
  { model: "MSV488AL1R/TT3", u_v: 13.3, v_w: 13.3, w_u: 13.3 },
  { model: "NN34M9112ARTT3", u_v: 14.3, v_w: 14.3, w_u: 14.3 },
  { model: "NN34J9902APTT3", u_v: 14.6, v_w: 14.6, w_u: 14.6 },
  { model: "NN34H9112APPT3", u_v: 9.9, v_w: 9.9, w_u: 9.9 },
  { model: "NF54M7151ANSM9", u_v: 12.0, v_w: 12.0, w_u: 12.0 },
  { model: "NN54N9112AVTT3", u_v: 9.15, v_w: 9.15, w_u: 9.15 },
  { model: "NF54M5151ARTT7", u_v: 11.2, v_w: 11.2, w_u: 11.2 },
  { model: "NN34M9112ARST7", u_v: 14.3, v_w: 14.3, w_u: 14.3 },
  { model: "NO14C9151AKTT9", u_v: 15.3, v_w: 15.3, w_u: 15.3 },
  { model: "NO14C9151ALTT9", u_v: 16.4, v_w: 16.4, w_u: 16.4 },
  { model: "NO14D7151ALTT9", u_v: 12.0, v_w: 12.0, w_u: 12.0 },
  { model: "NI3AN9802ADTT2", u_v: 12.6, v_w: 12.6, w_u: 12.6 },
  { model: "NI34T9101ADTT1", u_v: 14.2, v_w: 14.2, w_u: 14.2 },
  { model: "NI34T9102ADTT1", u_v: 14.2, v_w: 14.2, w_u: 14.2 },
  { model: "NC4AV80A2LRTT3", u_v: 12.8, v_w: 12.8, w_u: 12.8 },
  { model: "NI34T9103ALRTT3", u_v: 13.8, v_w: 13.8, w_u: 13.8 },
  { model: "NI34T9101ABST7", u_v: 11.5, v_w: 11.5, w_u: 11.5 },
  { model: "NI34T9102ABST7", u_v: 11.5, v_w: 11.5, w_u: 11.5 },
  { model: "NI34T9102ADST7", u_v: 14.2, v_w: 14.2, w_u: 14.2 },
  { model: "NI34T9103ADST7", u_v: 14.2, v_w: 14.2, w_u: 14.2 },
  { model: "NI54D9905AB7TS", u_v: 10.0, v_w: 10.0, w_u: 10.0 },
];


function normalize(s) {
  return s.toLowerCase().replace(/\s+/g, "").replace(/[_-]/g, "");
}

function useDataset() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRows(parsed);
        return;
      } catch {}
    }
    setRows(seedData);
  }, []);

  const save = (next) => {
    setRows(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  return { rows, save };
}

export default function CompressorResistanceLookup() {
  const { rows, save } = useDataset();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("lookup");

  const suggestions = useMemo(() => {
    const n = normalize(q);
    if (!n) return rows.slice(0, 10);
    return rows.filter((r) => normalize(r.model).includes(n)).slice(0, 15);
  }, [q, rows]);

  function onPick(model) {
    setQ(model);
    const hit = rows.find((r) => r.model === model);
    setSelected(hit || null);
  }

  function parseCSV(input) {
    const lines = input
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .filter((l) => !/^\s*(model|comp\s*model)/i.test(l));

    const out = [];
    for (const line of lines) {
      const cells = line
        .split(/[,;\t]/)
        .map((c) => c.trim())
        .filter((c) => c.length > 0);
      if (cells.length < 4) continue;
      const [model, u, v, w] = cells;
      const u_v = Number(u.replace(",", "."));
      const v_w = Number(v.replace(",", "."));
      const w_u = Number(w.replace(",", "."));
      if (!model || [u_v, v_w, w_u].some((n) => Number.isNaN(n))) continue;
      out.push({ model, u_v, v_w, w_u });
    }
    return out;
  }

  function mergeUnique(base, add) {
    const map = new Map();
    for (const r of base) map.set(r.model, r);
    for (const r of add) map.set(r.model, r);
    return Array.from(map.values()).sort((a, b) => a.model.localeCompare(b.model));
  }

  const [bulkText, setBulkText] = useState("");

  function handleImportCSV() {
    const parsed = parseCSV(bulkText);
    if (parsed.length === 0) return alert("No se detectaron filas válidas.");
    const merged = mergeUnique(rows, parsed);
    save(merged);
    setBulkText("");
    alert(`Se importaron ${parsed.length} filas.`);
  }

  function handleImportJSON() {
    try {
      const parsed = JSON.parse(bulkText);
      if (!Array.isArray(parsed)) throw new Error("Formato JSON inválido");
      const merged = mergeUnique(rows, parsed);
      save(merged);
      setBulkText("");
      alert(`Se importaron ${parsed.length} filas desde JSON.`);
    } catch (e) {
      alert(e?.message || "JSON inválido");
    }
  }

  function handleExportJSON() {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "compressor_resistances.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.wrapper}>
        
        <Link href='/equips' > ← volver</Link>
      <header className={styles.header}>
        <h1 className={styles.title}>Resistencia de bobinas – Buscador por modelo</h1>
        <div className={styles.tabButtons}>
        </div>
      </header>

      {tab === "lookup" ? (
        <section className={styles.section}>
          <div className={styles.searchBox}>
            <label className={styles.label}>Modelo de compresor</label>
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setSelected(null);
              }}
              placeholder="Ej. MSV488AL1R/TT3"
              className={styles.input}
            />
            {suggestions.length > 0 && (
              <div className={styles.suggestions}>
                {suggestions.map((r) => (
                  <button
                    key={r.model}
                    className={styles.suggestion}
                    onClick={() => onPick(r.model)}
                  >
                    {r.model}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selected && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.model}>{selected.model}</h2>
                <span className={styles.unit}>valores en ohms</span>
              </div>
              <div className={styles.valuesGrid}>
                <div className={styles.valueBox}>
                  <div className={styles.valueLabel}>U – V</div>
                  <div className={styles.value}>{selected.u_v} Ω</div>
                </div>
                <div className={styles.valueBox}>
                  <div className={styles.valueLabel}>V – W</div>
                  <div className={styles.value}>{selected.v_w} Ω</div>
                </div>
                <div className={styles.valueBox}>
                  <div className={styles.valueLabel}>W – U</div>
                  <div className={styles.value}>{selected.w_u} Ω</div>
                </div>
              </div>
            </div>
          )}

          {!selected && q && suggestions.length === 0 && (
            <div className={styles.noResults}>No se encontraron coincidencias para “{q}”.</div>
          )}
        </section>
      ) : (
        <section className={styles.section}>
          <p className={styles.info}>
            Pega tu tabla en formato <strong>CSV</strong> o <strong>JSON</strong>. Para CSV usa columnas: <code>model,u_v,v_w,w_u</code>.
          </p>
          <textarea
            className={styles.textarea}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={`Ej. CSV\nMSV488AL1R/TT3,13.3,13.3,13.3`}
          />
          <div className={styles.importButtons}>
            <button onClick={handleImportCSV} className={styles.primaryButton}>Importar CSV</button>
            <button onClick={handleImportJSON} className={styles.primaryButton}>Importar JSON</button>
            <button onClick={handleExportJSON} className={styles.secondaryButton}>Exportar dataset (JSON)</button>
          </div>
          <div className={styles.counter}>Registros actuales: {rows.length}</div>
        </section>
      )}

      <img className={styles.imgCom} src='compre.ico' />

      <footer className={styles.footer}>
        Consejo: escribe solo una parte del modelo para ver sugerencias rápidas.
      </footer>
    </div>
  );
}