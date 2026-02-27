import React from "react";
import { BookOpen, AlertTriangle, CheckCircle, ArrowRight, Zap, Target } from "lucide-react";

const AcademySuggestion = ({ result, onGoToAcademy }) => {
  const { averageScore, academySuggestions = [] } = result;
  const isApproved = averageScore >= 80;

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-500">
      
      {/* HEADER DINÁMICO CON GRADIENTE TÉCNICO */}
      <div
        className={`p-10 text-white relative overflow-hidden ${
          isApproved
            ? "bg-gradient-to-br from-emerald-600 to-teal-500"
            : "bg-gradient-to-br from-rose-600 to-orange-500"
        }`}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-md border border-white/30">
              {isApproved ? (
                <CheckCircle size={40} className="text-white" />
              ) : (
                <Target size={40} className="text-white" />
              )}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-1">Resultado de Evaluación</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                {averageScore}% <span className="text-xl font-medium not-italic">Score</span>
              </h2>
            </div>
          </div>
          
          <div className="text-center md:text-right max-w-xs">
            <p className="text-sm font-bold leading-tight">
              {isApproved
                ? "¡Certificación aprobada! Has demostrado un dominio técnico sólido."
                : "Evaluación completada. Identificamos puntos clave para mejorar tu precisión."}
            </p>
          </div>
        </div>
      </div>

      <div className="p-8 md:p-12 space-y-10">
        
        {/* SECCIÓN DE TEMAS SUGERIDOS */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <Zap className="text-blue-600" size={24} />
            <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">
              Ruta de Aprendizaje Axiom
            </h3>
          </div>

          {academySuggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
               <CheckCircle size={48} className="text-emerald-500 mb-4" />
               <p className="text-slate-500 font-black uppercase text-xs tracking-widest">No se detectaron brechas técnicas</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {academySuggestions.map((item, idx) => (
                <div
                  key={idx}
                  className="group bg-slate-50 border border-slate-200 rounded-[2rem] p-6 hover:bg-white hover:border-blue-500 hover:shadow-xl transition-all duration-500 flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start gap-4 mb-6">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md">
                        Módulo Recomendado
                      </span>
                      <h4 className="font-black text-slate-800 text-lg leading-none uppercase tracking-tight">
                        {item.partName}
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 font-mono">
                        REF: {item.partNumber}
                      </p>
                    </div>

                    {item.imageUrl && (
                      <div className="w-20 h-20 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm group-hover:scale-110 transition-transform duration-500">
                        <img
                          src={item.imageUrl}
                          alt={item.partName}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {/* DATO TÉCNICO RESALTADO (ESENCIAL) */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 group-hover:border-blue-100 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap size={12} className="text-blue-600" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dato Maestro ODS</span>
                      </div>
                      <p className="text-xs font-bold text-slate-700 leading-relaxed">
                        {item.technicalData}
                      </p>
                    </div>

                    {item.reason && (
                      <p className="text-[11px] text-slate-500 italic px-2">
                        💡 {item.reason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BOTÓN DE ACCIÓN FINAL */}
        <button
          onClick={onGoToAcademy}
          className="w-full group flex items-center justify-center gap-4 py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] transition-all hover:bg-black hover:shadow-2xl hover:shadow-blue-900/20 active:scale-[0.98]"
        >
          <BookOpen size={20} className="group-hover:rotate-12 transition-transform" />
          Ir a mi panel de estudio
          <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default AcademySuggestion;