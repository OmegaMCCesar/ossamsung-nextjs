import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { 
  Zap, 
  ShieldCheck, 
  FileText, 
  PlayCircle, 
  Info,
  ArrowLeft,
  ArrowRight,
  Youtube,
  Lock,
  Wrench
} from 'lucide-react';
import Link from 'next/link';

export default function TopicDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [part, setPart] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchPartData = async () => {
      try {
        const docRef = doc(db, "partsForDiagnosis", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPart(docSnap.data());
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPartData();
  }, [id]);

  const getYouTubeID = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url?.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (loading) return <div className="min-h-screen flex flex-col items-center justify-center font-black uppercase tracking-[0.4em] text-blue-600 animate-pulse">Sincronizando Protocolos...</div>;
  if (!part) return <div className="min-h-screen flex items-center justify-center font-bold">Documentación no disponible.</div>;

  const videoId = getYouTubeID(part.videoUrl);

  // LOGICA DE PROTOCOLO DINÁMICO
  // Si no hay 'steps' en Firebase, usamos un protocolo inteligente basado en el nombre
  const defaultSteps = [
    { t: `Inspección de ${part.partName}`, d: `Verificar daños físicos, quemaduras o sarro en los terminales del componente.` },
    { t: "Prueba de Resistencia", d: `Medir con multímetro. Valor esperado según ODS: ${part.technicalData || 'Consultar manual'}.` },
    { t: "Prueba de Alimentación", d: `Comprobar que la tarjeta principal envíe el voltaje correcto hacia este componente.` }
  ];

  const displaySteps = part.steps && part.steps.length > 0 ? part.steps : defaultSteps;

  return (
    <div className="min-h-screen bg-white font-sans antialiased text-slate-900">
      
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/academy" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-all">
            <ArrowLeft size={16} /> Regresar a la Academia
          </Link>
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 italic">Technical Knowledge Engine</span>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row gap-12 items-start mb-20">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-md text-[9px] font-black uppercase tracking-widest italic">
              <Wrench size={12} /> Samsung Service Protocol
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-[0.85]">
              {part.partName}
            </h1>
            <p className="text-slate-500 font-medium text-xl leading-snug max-w-2xl">
              {part.partFunctionText || "Análisis de fallas críticas y procedimientos de corrección estandarizados."}
            </p>
            <div className="flex flex-wrap gap-3 pt-4">
                <span className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase">PN: {part.partNumber}</span>
                <span className="bg-slate-100 text-slate-400 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase italic">Axiom Certified</span>
            </div>
          </div>
          
          <div className="w-full md:w-96 shrink-0">
            <div className="aspect-square bg-slate-50 border border-slate-100 rounded-[3rem] p-10 flex items-center justify-center shadow-inner group overflow-hidden relative">
              {part.imageUrl ? (
                <img src={part.imageUrl} className="max-h-full object-contain group-hover:scale-110 transition-transform duration-700 relative z-10" />
              ) : (
                <FileText size={80} className="text-slate-200" />
              )}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
          
          <div className="lg:col-span-8 space-y-12">
            {/* VIDEO PLAYER */}
            {videoId ? (
              <div className="space-y-6">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                  <Youtube size={18} className="text-red-600" /> Entrenamiento Visual
                </h3>
                <div className="relative aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl bg-slate-900 ring-4 ring-slate-900">
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                    title="Entrenamiento Técnico"
                    frameBorder="0"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-[2.5rem] p-12 text-center border-2 border-dashed border-slate-200 flex flex-col items-center">
                <Lock size={48} className="text-slate-200 mb-4" />
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">Video de entrenamiento no disponible</p>
              </div>
            )}

            {/* PROTOCOLO DINÁMICO */}
            <div className="bg-white border border-slate-100 rounded-[3rem] p-8 md:p-12 shadow-sm">
              <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-12 flex items-center gap-3">
                <PlayCircle className="text-blue-600" /> Pasos de Verificación
              </h3>
              <div className="space-y-12">
                {displaySteps.map((step, i) => (
                  <div key={i} className="flex gap-8 items-start group">
                    <div className="flex-none flex flex-col items-center">
                        <span className="text-5xl font-black text-slate-100 leading-none group-hover:text-blue-50 transition-colors">0{i+1}</span>
                        {i < displaySteps.length - 1 && <div className="w-px h-12 bg-slate-100 mt-2"></div>}
                    </div>
                    <div className="pt-2">
                      <h4 className="font-black text-slate-900 uppercase text-sm mb-2 tracking-tight underline decoration-blue-500/30 underline-offset-4">{step.t}</h4>
                      <p className="text-slate-500 font-medium leading-relaxed text-sm">{step.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="lg:col-span-4 space-y-8">
             <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl"></div>
                <ShieldCheck size={32} className="text-blue-500 mb-6 relative z-10" />
                <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2 relative z-10">Dato Maestro ODS</p>
                <h4 className="text-3xl font-black tracking-tighter leading-tight mb-6 italic relative z-10">
                   {part.technicalData || "Consultar Manual"}
                </h4>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed relative z-10">
                   Referencia obligatoria para aprobación de garantías y diagnóstico de primer contacto.
                </div>
             </div>

             <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Equipos Compatibles</h4>
                <div className="grid grid-cols-2 gap-2">
                   {part.modelCompatibility?.map((m, i) => (
                     <span key={i} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[9px] font-black text-slate-700 uppercase text-center">{m}</span>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-50 py-16 px-6 border-t border-slate-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="space-y-1">
              <h3 className="text-xl font-black uppercase italic tracking-tighter">Entrenamiento Finalizado</h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">¿Listo para validar tus nuevos conocimientos?</p>
           </div>
           <Link href="/academy/test_device" className="flex items-center gap-4 px-12 py-6 bg-blue-600 text-white rounded-full font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95">
              Refrescar Evaluación <ArrowRight size={18} />
           </Link>
        </div>
      </footer>
    </div>
  );
}