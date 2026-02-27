import Link from "next/link";
import Layout from "../components/Layout";
import { ClipboardCheck, ArrowRight, Settings2, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <Layout title="OSSamsung - Gestión Técnica">
      {/* Hero Section con fondo corregido */}
      <div className="relative min-h-[95vh] flex items-center justify-center overflow-hidden bg-slate-900">
        
        {/* IMAGEN DE FONDO: Ruta corregida para Next.js */}
        <div 
          className="absolute inset-0 z-0 opacity-50 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
          style={{ 
            backgroundImage: "url('/samsung.png')", 
          }}
        ></div>

        {/* Overlay para contraste profesional */}
        <div className="absolute inset-0 z-10 bg-linear-to-tr from-slate-900 via-slate-900/40 to-transparent"></div>

        <div className="relative z-20 max-w-6xl mx-auto px-6 py-20 text-center">
          
          {/* LOGO SAMSUNG: Elegante y proporcionado */}
          {/* <div className="mb-10 flex justify-center">
            <img
              src="https://firebasestorage.googleapis.com/v0/b/samsungcodeclose.firebasestorage.app/o/samsung-group-vector-logo.png?alt=media&token=cb5fa39b-42e0-4a13-b8d8-7fddc46bcb49"
              alt="Samsung Logo"
              className="h-12 md:h-16 w-auto object-contain brightness-0 invert opacity-90"
            />
          </div> */}

          {/* Badge de Plataforma */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-8">
            <ShieldCheck size={14} className="text-blue-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-100/80">
              Technical Service Suite
            </span>
          </div>

          {/* Títulos Refinados: Menos "gritado", más "Premium" */}
          <h1 className="text-4xl md:text-6xl font-semibold text-white tracking-tight leading-tight mb-6">
            Gestión de Soporte <br />
            <span className="font-light text-slate-300">Ecosistema Inteligente</span>
          </h1>
          
          <p className="max-w-xl mx-auto text-base md:text-lg text-white font-normal mb-16 leading-relaxed">
            Herramientas avanzadas para la optimización de procesos técnicos, 
            diagnóstico preventivo y gestión de órdenes de servicio.
          </p>

          {/* Grid de Acciones: Estilo One UI */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            
            {/* Tarjeta 1: Cierre de Órdenes */}
            <Link href="/equips" className="group relative p-8 bg-white/3 backdrop-blur-md border border-white/10 rounded-4xl text-left transition-all hover:bg-white/[0.07] hover:border-white/20">
              <div className="flex flex-col h-full">
                <div className="mb-6 inline-flex p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-900/20">
                  <ClipboardCheck size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center justify-between">
                    Cierre de Órdenes <ArrowRight size={18} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </h3>
                  <p className="text-slate-500 text-sm leading-snug">
                    Finalización y reporte de servicios técnicos Samsung.
                  </p>
                </div>
              </div>
            </Link>

            {/* Tarjeta 2: Pre-Diagnóstico */}
            <Link href="/diagnosticoPage" className="group relative p-8 bg-white/3 backdrop-blur-md border border-white/10 rounded-4xl text-left transition-all hover:bg-white/[0.07] hover:border-white/20">
              <div className="flex flex-col h-full">
                <div className="mb-6 inline-flex p-3 bg-slate-700 rounded-2xl text-white shadow-lg">
                  <Settings2 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center justify-between">
                    Pre-Diagnóstico <ArrowRight size={18} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </h3>
                  <p className="text-slate-500 text-sm leading-snug">
                    Análisis técnico asistido para detección de fallas.
                  </p>
                </div>
              </div>
            </Link>

          </div>
        </div>
      </div>
    </Layout>
  );
}