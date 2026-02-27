import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/UserContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  BookOpen,
  GraduationCap,
  ChevronRight,
  PlayCircle,
  AlertCircle,
  Zap,
  Activity,
  ArrowRight,
  Award
} from "lucide-react";

export default function AcademyHome() {
  const { user, loading } = useAuth();
  const [lastResult, setLastResult] = useState(null);
  const [suggestedParts, setSuggestedParts] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user || loading) return;

    const fetchData = async () => {
      try {
        const userId = user.uid || user.id;
        
        // 1. Obtener último examen (Sincronizado con la nueva API de evaluación)
        const examQuery = query(
          collection(db, "examResults"),
          where("userId", "==", userId),
          orderBy("createdAt", "desc"),
          limit(1)
        );

        const examSnap = await getDocs(examQuery);

        if (!examSnap.empty) {
          const examData = examSnap.docs[0].data();
          setLastResult(examData);

          // Si el examen ya tiene las sugerencias cruzadas por la IA
          if (examData.academySuggestions && examData.academySuggestions.length > 0) {
            setSuggestedParts(examData.academySuggestions);
            setLoadingData(false);
            return;
          }
        }

        // 2. Fallback: Si no hay examen o no hay sugerencias, mostrar módulos generales
        const partsQuery = query(
          collection(db, "partsForDiagnosis"),
          limit(6)
        );

        const partsSnap = await getDocs(partsQuery);
        const partsData = partsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setSuggestedParts(partsData);
      } catch (error) {
        console.error("Error loading academy data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [user, loading]);

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <LoaderPulse />
      </div>
    );
  }

  const averageScore = lastResult?.averageScore || 0;
  const difficulty = lastResult?.difficultyReached || 1;
  const mode = lastResult?.mode || "Normal";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans antialiased">
      
      {/* HERO PREMIUM */}
      <div className="bg-[#0F172A] text-white pt-24 pb-32 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-[150px] opacity-20 translate-x-1/2 -translate-y-1/2"></div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-8 relative z-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em]">
              <GraduationCap size={14} /> ODS-SAMG Academy
            </div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none italic uppercase">
              Ecosistema de <br/><span className="text-blue-500">Capacitación</span>
            </h1>

            <p className="text-slate-400 font-medium italic text-lg tracking-tight">
              Bienvenido, {user?.userName || user?.email}
            </p>
          </div>

          <Link
            href="/academy/test_device"
            className="group flex items-center gap-4 px-10 py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-blue-900/40 transition-all active:scale-95"
          >
            Nueva Evaluación <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* PANEL DE ESTATUS TÉCNICO */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-2">
                <Activity size={14} /> Nivel de Competencia
              </h3>

              {lastResult ? (
                <div className="space-y-8">
                  <div className="relative inline-flex items-center justify-center w-full">
                    <svg className="w-48 h-48 transform -rotate-90">
                      <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="14" fill="transparent" className="text-slate-50" />
                      <circle cx="96" cy="96" r="80" stroke="currentColor" strokeWidth="14" fill="transparent" 
                        strokeDasharray={502.6} 
                        strokeDashoffset={502.6 - (502.6 * averageScore) / 100}
                        className={`${averageScore >= 80 ? 'text-emerald-500' : 'text-blue-600'} transition-all duration-1000 stroke-round`} 
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-5xl font-black text-slate-900">{averageScore}%</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aciertos</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Rango</p>
                      <p className="text-lg font-black text-slate-800">Nivel {difficulty}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Estatus</p>
                      <p className="text-lg font-black text-blue-600 uppercase italic">{mode}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award size={32} className="text-slate-200" />
                  </div>
                  <p className="text-slate-400 text-[10px] font-black uppercase leading-tight tracking-widest">
                    Sin registros de <br/> evaluación
                  </p>
                </div>
              )}
            </div>

            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl">
                <Zap className="text-blue-500 mb-4" size={32} />
                <h4 className="font-black text-lg uppercase italic mb-2 tracking-tight">Axiom Adaptive</h4>
                <p className="text-slate-400 text-xs font-medium leading-relaxed">
                    Tu plan de estudio se actualiza automáticamente basado en los fallos detectados por la IA.
                </p>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-600/20 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
            </div>
          </div>

          {/* PLAN DE ESTUDIO DINÁMICO */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-100 min-h-[600px]">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 flex items-center gap-4 uppercase italic tracking-tighter">
                        <BookOpen className="text-blue-600" size={32} />
                        Ruta de Refuerzo
                    </h2>
                    <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest ml-12">Basado en tus últimos resultados técnicos</p>
                </div>

                <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-5 py-2 rounded-full uppercase tracking-[0.2em] border border-blue-100">
                  {suggestedParts.length} Módulos
                </span>
              </div>

              <div className="grid gap-6">
                {suggestedParts.map((part) => (
                  <div
                    key={part.id || part.partNumber}
                    className="group bg-slate-50/50 rounded-[2.5rem] p-6 border border-transparent hover:border-blue-500 hover:bg-white transition-all duration-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    <div className="flex items-center gap-8 text-left">
                      <div className="w-24 h-24 bg-white rounded-3xl border border-slate-100 flex items-center justify-center p-3 shadow-sm group-hover:scale-105 transition-transform">
                        {part.imageUrl ? (
                          <img
                            src={part.imageUrl}
                            alt=""
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="bg-blue-50 w-full h-full rounded-2xl flex items-center justify-center text-blue-500">
                             <PlayCircle size={32} />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md">Recomendado</span>
                        <h4 className="font-black text-slate-800 text-xl uppercase tracking-tighter leading-none">
                          {part.partName || part.topic || "Módulo Técnico"}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          Identificador: <span className="text-slate-900 font-mono font-black">{part.partNumber || "GENERAL"}</span>
                        </p>
                        {part.technicalData && (
                            <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-black text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-xl">
                                <Zap size={12} className="text-blue-500" />
                                {part.technicalData}
                            </div>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/academy/topic/${part.id || part.partNumber}`}
                      className="flex items-center justify-center gap-3 px-10 py-5 bg-white border border-slate-200 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all shadow-sm active:scale-95"
                    >
                      Estudiar Módulo <ChevronRight size={16} />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Subcomponente de Carga Estilizado
const LoaderPulse = () => (
    <div className="flex flex-col items-center gap-4">
        <div className="flex gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
        </div>
        <p className="font-black text-slate-400 uppercase tracking-[0.4em] text-[10px]">Sincronizando Academia</p>
    </div>
);