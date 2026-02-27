import React, { useState, useEffect, useRef } from "react";
import { 
  Zap, 
  BrainCircuit, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  Loader2 
} from "lucide-react";

export default function ExamScreen({ user, onFinish }) {
  const [bp, setBp] = useState("");
  const [name, setName] = useState("");
  const [asc, setAsc] = useState("");
  const [product, setProduct] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [scores, setScores] = useState({});
  const [computedLevel, setComputedLevel] = useState(null);
  const [improvements, setImprovements] = useState([]);
  const [testId, setTestId] = useState(null);
  const [examMeta, setExamMeta] = useState(null);
  const [loadingExam, setLoadingExam] = useState(false);
  const [loadingEval, setLoadingEval] = useState(false);
  const [error, setError] = useState("");
  const evaluationLock = useRef(false);

  const PRODUCTS = ["Refrigerador", "Lavadora", "Lavasecadora", "Microondas", "Aire Acondicionado"];

  useEffect(() => {
    if (user) {
      setBp(user.bp || "");
      setName(user.name || "");
      setAsc(user.asc || "");
    }
  }, [user]);

  const handleAnswerChange = (qid, value) => {
    setAnswers(prev => ({ ...prev, [qid]: value }));
  };

  async function handleGenerateExam() {
    if (loadingExam || loadingEval) return;
    setError("");
    if (!product) return setError("Selecciona un producto.");

    setLoadingExam(true);
    try {
      const res = await fetch("/api/device-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al generar.");

      setQuestions(data.questions || []);
      setTestId(data.testId);
      setExamMeta({ diagnostic: data.diagnostic, level: data.difficultyContext?.level, mode: data.difficultyContext?.mode });
      setAnswers({});
      setScores({});
      setComputedLevel(null);
      evaluationLock.current = false;
    } catch (e) { setError(e.message); } finally { setLoadingExam(false); }
  }

  async function handleEvaluateExam() {
    // Forzamos el estado de carga primero
    setError("");
    
    // Validación de seguridad
    const unanswered = questions.some(q => !answers[q.id] || answers[q.id].trim().length < 5);
    if (unanswered) {
      setError("⚠️ Todas las respuestas requieren al menos 5 caracteres técnicos.");
      return;
    }

    if (evaluationLock.current) return;

    setLoadingEval(true);
    evaluationLock.current = true;

    try {
      const res = await fetch("/api/evaluate-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, product, questions, answers, testId }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error en la evaluación de IA.");

      setScores(data.scores || {});
      setComputedLevel(Math.round(data.averageScore || 0));
      setImprovements(Object.values(data.scores || {}).filter(s => s.score < 70));
      
      // DISPARADOR AL PADRE
      if (onFinish) {
        onFinish(data);
      }
    } catch (e) {
      setError(e.message);
      evaluationLock.current = false;
    } finally {
      setLoadingEval(false);
    }
  }

  return (
    <div className="relative w-full min-h-screen">
      {/* OVERLAY CORREGIDO */}
      {loadingEval && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-xl text-white text-center p-6 animate-in fade-in duration-300">
          <Loader2 size={64} className="animate-spin text-blue-500 mb-6" />
          <h2 className="text-3xl font-black uppercase italic tracking-tighter">Procesando con Axiom IA</h2>
          <p className="text-slate-400 font-bold mt-2">Analizando precisión técnica y asignando módulos...</p>
        </div>
      )}

      {/* HEADER DE DATOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[ {l: "BP", v: bp}, {l: "Técnico", v: name}, {l: "ASC", v: asc} ].map((d, i) => (
          <div key={i} className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{d.l}</p>
            <p className="font-bold text-slate-800 text-sm truncate">{d.v}</p>
          </div>
        ))}
      </div>

      {questions.length === 0 && (
        <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-xl animate-in fade-in slide-in-from-bottom-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-200">
              <BrainCircuit size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase italic">Nueva Evaluación</h2>
          </div>
          <div className="flex flex-col md:flex-row gap-5">
            <select
              className="flex-1 p-5 rounded-[1.5rem] bg-slate-100 border-none font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/20 transition-all"
              value={product}
              onChange={e => setProduct(e.target.value)}
              disabled={loadingExam}
            >
              <option value="">-- Seleccionar Producto --</option>
              {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button
              className="px-10 py-5 bg-blue-600 text-white font-black rounded-[1.5rem] uppercase text-xs tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
              onClick={handleGenerateExam}
              disabled={!product || loadingExam}
            >
              {loadingExam ? "Generando..." : "Generar Examen"}
            </button>
          </div>
          {error && <p className="mt-6 text-sm font-bold text-rose-500 flex items-center gap-2"><AlertTriangle size={18}/> {error}</p>}
        </div>
      )}

      {questions.length > 0 && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {questions.map((q, i) => (
            <div key={q.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <span className="bg-slate-900 text-white px-4 py-1 rounded-full text-[10px] font-black italic">P {i + 1}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nivel {q.difficulty}/5</span>
              </div>
              <p className="text-slate-800 font-bold text-lg mb-6 leading-tight">{q.prompt}</p>
              <textarea
                className="w-full p-6 rounded-[2rem] bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white transition-all outline-none font-medium text-slate-700 min-h-[160px] resize-none"
                placeholder="Describe tu procedimiento..."
                value={answers[q.id] || ""}
                onChange={e => handleAnswerChange(q.id, e.target.value)}
                disabled={loadingEval}
              />
            </div>
          ))}

          <div className="sticky bottom-10 flex justify-center pb-10">
            <button
              className="group px-16 py-6 bg-slate-900 text-white font-black rounded-full uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-black transition-all hover:scale-105 active:scale-95 flex items-center gap-4"
              onClick={handleEvaluateExam}
              disabled={loadingEval}
            >
              {loadingEval ? "Evaluando..." : "Finalizar Evaluación"}
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}