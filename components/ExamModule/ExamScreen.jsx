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
  // EXAMEN
  // ---------------------------------------------
  const [product, setProduct] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [scores, setScores] = useState({});
  const [computedLevel, setComputedLevel] = useState(null);
  const [improvements, setImprovements] = useState([]);

  // ---------------------------------------------
  // ESTADOS DE CONTROL
  // ---------------------------------------------
  const [loadingExam, setLoadingExam] = useState(false);
  const [loadingEval, setLoadingEval] = useState(false);
  const [error, setError] = useState("");

  // 🔒 Lock absoluto anti-reintentos
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
  // GENERAR EXAMEN
  // ---------------------------------------------
  async function handleGenerateExam() {
    if (loadingExam || loadingEval) return;

    setError("");

    if (!bp || !name || !asc) {
      setError("Faltan datos del perfil (BP, Nombre o ASC).");
      return;
    }

    if (!product) {
      setError("Selecciona un producto.");
      return;
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
      if (!res.ok) throw new Error(data.error || "Error generando examen.");

      setQuestions(data.questions || []);
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
  // EVALUAR EXAMEN (ANTI-SPAM + 1 SOLA LLAMADA)
  // ---------------------------------------------
  async function handleEvaluateExam() {
    if (loadingEval || evaluationLock.current) return;

    setError("");

    for (const q of questions) {
      if (!answers[q.id] || answers[q.id].trim().length < 5) {
        setError("Todas las preguntas deben estar respondidas correctamente.");
        return;
      }
    }

    // 🔒 Lock inmediato
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
        }),
      });

      const data = await res.json();

      if (res.status === 429) {
        throw new Error(
          "⏳ El sistema está evaluando o la cuota fue alcanzada. Intenta más tarde."
        );
      }

      if (!res.ok) {
        throw new Error(data.error || "Error evaluando examen.");
      }

      // ✔️ Resultados
      setScores(data.scores || {});
      setComputedLevel(Math.round(data.averageScore || 0));

      // ✔️ Áreas a reforzar
      const weakAreas = Object.values(data.scores || {}).filter(
        s => s.score < 70
      );

      setImprovements(weakAreas);

    } catch (e) {
      setError(e.message);
      evaluationLock.current = false; // liberar solo si falló
    } finally {
      setLoadingEval(false);
    }
  }

  // ---------------------------------------------
  // RENDER
  // ---------------------------------------------
  // ---------------------------------------------
  // OVERLAY DE CARGA (EVALUACIÓN)
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


  return (
    <div className={styles.container}>
      <LoadingOverlay />
      <h1 className={styles.title}>Examen Técnico — ODS-SAMG</h1>

      <div className={styles.row}>
        <input className={styles.input} value={bp} readOnly />
        <input className={styles.input} value={name} readOnly />
        <input className={styles.input} value={asc} readOnly />
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
          disabled={loadingExam || loadingEval || !product}
        >
          {loadingExam ? "Generando..." : "Generar examen"}
        </button>
      </div>

      {error && <div className={styles.error}>⚠️ {error}</div>}

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
            placeholder="Escribe tu respuesta técnica aquí..."
            onChange={e => handleAnswerChange(q.id, e.target.value)}
            disabled={loadingEval || computedLevel !== null}
          />

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

      {questions.length > 0 && computedLevel === null && (
        <button
          className={styles.primary}
          onClick={handleEvaluateExam}
          disabled={loadingEval}
        >
          {loadingEval ? "Evaluando examen..." : "Finalizar y Evaluar Examen"}
        </button>
      )}

      {computedLevel !== null && (
        <div className={styles.summary}>
          <h3>Nivel de Competencia Final: {computedLevel}%</h3>

          {improvements.length > 0 ? (
            <>
              <p>Áreas a reforzar:</p>
              <ul>
                {improvements.map((item, i) => (
                  <li key={i}>
                    <strong>{item.score}%</strong> — {item.feedback}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>✅ Excelente desempeño técnico.</p>
          )}

          <button
            className={styles.button}
            onClick={() => window.location.reload()}
          >
            Tomar otro examen
          </button>
        </div>
      )}
    </div>
  );
}
