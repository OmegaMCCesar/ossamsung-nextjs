import React, { useState, useEffect, useRef } from "react";
import styles from "../../styles/ExamScreen.module.css";

export default function ExamScreen({ user }) {
  // ---------------------------------------------
  // PERFIL
  // ---------------------------------------------
  const [bp, setBp] = useState("");
  const [name, setName] = useState("");
  const [asc, setAsc] = useState("");
  const [level, setLevel] = useState(1);

  // ---------------------------------------------
  // EXAMEN Y METADATA
  // ---------------------------------------------
  const [product, setProduct] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [scores, setScores] = useState({});
  const [computedLevel, setComputedLevel] = useState(null);
  const [improvements, setImprovements] = useState([]);
  
  // 🔥 Nuevo estado para guardar el ID del examen en curso y su info
  const [testId, setTestId] = useState(null);
  const [examMeta, setExamMeta] = useState(null);

  // ---------------------------------------------
  // ESTADOS DE CONTROL
  // ---------------------------------------------
  const [loadingExam, setLoadingExam] = useState(false);
  const [loadingEval, setLoadingEval] = useState(false);
  const [error, setError] = useState("");

  // 🔒 Lock absoluto anti-reintentos rápidos
  const evaluationLock = useRef(false);

  const PRODUCTS = [
    "Refrigerador",
    "Lavadora",
    "Lavasecadora",
    "Microondas",
    "Aire Acondicionado",
  ];

  // ---------------------------------------------
  // CARGAR DATOS DE USUARIO
  // ---------------------------------------------
  useEffect(() => {
    if (user) {
      setBp(user.bp || "");
      setName(user.name || "");
      setAsc(user.asc || "");
      setLevel(user.testLevel || 1);
    }
  }, [user]);

  // ---------------------------------------------
  // 1️⃣ GENERAR EXAMEN
  // ---------------------------------------------
  async function handleGenerateExam() {
    if (loadingExam || loadingEval) return;

    setError("");

    if (!bp || !name || !asc) {
      return setError("Faltan datos del perfil (BP, Nombre o ASC).");
    }

    if (!product) {
      return setError("Selecciona un producto.");
    }

    setLoadingExam(true);

    try {
      const res = await fetch("/api/device-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product,
          userId: user.id,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || data.message || "Error generando examen.");
      }

      // Guardamos preguntas y el ID vital para la evaluación
      setQuestions(data.questions || []);
      setTestId(data.testId); 
      setExamMeta({
        diagnostic: data.diagnostic,
        level: data.difficultyContext?.level,
        mode: data.difficultyContext?.mode
      });
      
      // Reiniciamos estados de respuesta
      setAnswers({});
      setScores({});
      setComputedLevel(null);
      setImprovements([]);
      evaluationLock.current = false;

    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingExam(false);
    }
  }

  // ---------------------------------------------
  // RESPONDER
  // ---------------------------------------------
  function handleAnswerChange(qid, value) {
    setAnswers(prev => ({
      ...prev,
      [qid]: value,
    }));
  }

  // ---------------------------------------------
  // 2️⃣ EVALUAR EXAMEN
  // ---------------------------------------------
  async function handleEvaluateExam() {
    if (loadingEval || evaluationLock.current) return;

    setError("");

    // Validación estricta en frontend
    for (const q of questions) {
      if (!answers[q.id] || answers[q.id].trim().length < 5) {
        setError("⚠️ Todas las preguntas deben estar respondidas completamente (mínimo 5 caracteres).");
        return;
      }
    }

    if (!testId) {
      setError("Error interno: Falta el ID del examen en curso.");
      return;
    }

    // 🔒 Bloqueamos botón
    evaluationLock.current = true;
    setLoadingEval(true);

    try {
      const res = await fetch("/api/evaluate-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          product,
          questions,
          answers,
          testId, // 🔥 Enviamos el testId al backend
        }),
      });

      const data = await res.json();

      if (res.status === 429) {
        throw new Error("⏳ El sistema está evaluando o la cuota fue alcanzada. Intenta más tarde.");
      }

      if (!res.ok) {
        throw new Error(data.error || "Error evaluando examen.");
      }

      // ✔️ Resultados recibidos
      setScores(data.scores || {});
      setComputedLevel(Math.round(data.averageScore || 0));

      // ✔️ Filtrar áreas a mejorar (menor a 70 puntos)
      const weakAreas = Object.values(data.scores || {}).filter(
        s => s.score < 70
      );

      setImprovements(weakAreas);

    } catch (e) {
      setError(e.message);
      evaluationLock.current = false; // Liberamos para que intente de nuevo si falló la red
    } finally {
      setLoadingEval(false);
    }
  }

  // ---------------------------------------------
  // 3️⃣ REINICIAR (SIN RECARGAR PÁGINA)
  // ---------------------------------------------
  const handleReset = () => {
    setProduct("");
    setQuestions([]);
    setAnswers({});
    setScores({});
    setComputedLevel(null);
    setImprovements([]);
    setExamMeta(null);
    setTestId(null);
    setError("");
    evaluationLock.current = false;
  };

  // ---------------------------------------------
  // COMPONENTE: OVERLAY DE CARGA
  // ---------------------------------------------
  const LoadingOverlay = () => {
    if (!loadingEval) return null;

    return (
      <div className={styles.loadingOverlay}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>
          Evaluando examen técnico…<br />
          No cierres esta pantalla
        </p>
      </div>
    );
  };

  // ---------------------------------------------
  // RENDER
  // ---------------------------------------------
  return (
    <div className={styles.container}>
      <LoadingOverlay />
      
      <h1 className={styles.title}>Examen Técnico — ODS-SAMG</h1>

      <div className={styles.row}>
        <input className={styles.input} value={bp} readOnly title="BP" />
        <input className={styles.input} value={name} readOnly title="Nombre Técnico" />
        <input className={styles.input} value={asc} readOnly title="Centro de Servicio (ASC)" />
      </div>

      <div className={styles.row}>
        <select
          className={styles.select}
          value={product}
          onChange={e => setProduct(e.target.value)}
          disabled={loadingExam || loadingEval || questions.length > 0}
        >
          <option value="">-- Seleccionar Producto --</option>
          {PRODUCTS.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <button
          className={styles.button}
          onClick={handleGenerateExam}
          disabled={loadingExam || loadingEval || !product || questions.length > 0}
        >
          {loadingExam ? "Generando..." : "Generar examen"}
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Indicador visual de la dificultad del examen */}
      {examMeta && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.5rem', color: '#1e40af', fontSize: '0.9rem' }}>
          {examMeta.diagnostic ? (
            <strong>📝 Examen Diagnóstico (Nivel Inicial)</strong>
          ) : (
            <strong>⚙️ Examen Adaptativo — Nivel {examMeta.level} (Modo: {examMeta.mode})</strong>
          )}
        </div>
      )}

      {/* RENDERIZADO DE PREGUNTAS */}
      {questions.map((q, i) => (
        <div key={q.id} className={styles.questionBlock}>
          <div className={styles.qHeader}>
            <strong>Pregunta {i + 1}</strong>
            <span className={styles.badge}>
              Dificultad {q.difficulty}/5
            </span>
          </div>

          <p className={styles.prompt}>{q.prompt}</p>

          <textarea
            className={styles.textarea}
            value={answers[q.id] || ""}
            placeholder="Describe tu procedimiento técnico detalladamente..."
            onChange={e => handleAnswerChange(q.id, e.target.value)}
            disabled={loadingEval || computedLevel !== null}
          />

          {/* RENDERIZADO DE RESULTADOS INDIVIDUALES */}
          {scores[q.id] && (
            <div
              className={`${styles.feedback} ${
                scores[q.id].score >= 70 ? styles.good : styles.bad
              }`}
            >
              <strong>Resultado: {scores[q.id].score}%</strong>
              <p>{scores[q.id].feedback}</p>
            </div>
          )}
        </div>
      ))}

      {/* BOTÓN DE EVALUACIÓN FINAL */}
      {questions.length > 0 && computedLevel === null && (
        <button
          className={styles.primary}
          onClick={handleEvaluateExam}
          disabled={loadingEval}
        >
          {loadingEval ? "Evaluando examen..." : "Finalizar y Evaluar Examen"}
        </button>
      )}

      {/* RESUMEN FINAL Y ÁREAS DE MEJORA */}
      {computedLevel !== null && (
        <div className={styles.summary}>
          <h3>Nivel de Competencia Final: {computedLevel}%</h3>

          {improvements.length > 0 ? (
            <>
              <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>Áreas técnicas a reforzar:</p>
              <ul style={{ marginTop: '0.5rem', marginBottom: '1.5rem', paddingLeft: '1.5rem', listStyleType: 'disc' }}>
                {improvements.map((item, i) => (
                  <li key={i} style={{ marginBottom: '0.5rem' }}>
                    <strong>{item.score}%</strong> — {item.feedback}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p style={{ marginTop: '1rem', marginBottom: '1.5rem', color: '#15803d', fontWeight: 'bold' }}>
              ✅ Excelente desempeño técnico. Demuestras gran dominio del producto.
            </p>
          )}

          <button
            className={styles.button}
            onClick={handleReset}
          >
            Tomar otro examen
          </button>
        </div>
      )}
    </div>
  );
}