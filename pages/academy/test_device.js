import { useState, useEffect } from "react";
import ExamScreen from "@/components/ExamModule/ExamScreen";
import AcademySuggestion from "@/components/Academy/AcademySuggestion";
import { useAuth } from "@/context/UserContext";
import { useRouter } from "next/router";
import { ChevronLeft, ClipboardCheck, RotateCcw, Activity } from "lucide-react";
import Link from "next/link";

export default function TestDevice() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [examResult, setExamResult] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Activity className="animate-spin text-blue-600 mb-4" size={40} />
        <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Sincronizando Sistema...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans antialiased">
      <header className="bg-[#0F172A] text-white pt-16 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-[150px] opacity-10 translate-x-1/2 -translate-y-1/2"></div>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
          <div className="space-y-4 text-center md:text-left">
            <Link href="/academy" className="inline-flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] hover:text-blue-300 transition-colors">
              <ChevronLeft size={14} /> Volver al Panel
            </Link>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none">
              Control de <span className="text-blue-500 font-normal not-italic">Calidad</span>
            </h1>
            <p className="text-slate-400 font-bold text-sm tracking-tight uppercase">
              Sesión de: <span className="text-white underline underline-offset-4 decoration-blue-500">{user.userName || user.email}</span>
            </p>
          </div>

          <div>
            {examResult ? (
              <button onClick={() => setExamResult(null)} className="flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all">
                <RotateCcw size={18} /> Reintentar Evaluación
              </button>
            ) : (
              <div className="px-8 py-4 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3">
                <ClipboardCheck size={18} /> Entorno Certificado
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 -mt-16 relative z-30">
        {!examResult ? (
          <ExamScreen 
            user={{
              id: user.uid || user.id,
              name: user.userName || "Usuario",
              email: user.email || "",
              bp: user.bp || "",
              asc: user.asc || "",
            }} 
            onFinish={(data) => setExamResult(data)} 
          />
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-700">
            <AcademySuggestion 
              result={examResult} 
              onGoToAcademy={() => router.push("/academy")} 
            />
          </div>
        )}
      </main>
    </div>
  );
}