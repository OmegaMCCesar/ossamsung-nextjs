import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import useFetchInfFirebase from '../hooks/useFetchInfFirebase';
import { useAuth } from '../context/UserContext';
import { db } from '../lib/firebase';
import {
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

import emailjs from '@emailjs/browser';
import Validador from '@/components/validador';
import { ChevronLeft, RotateCcw, Search, Mail, Database, ShieldCheck, AlertCircle, X } from 'lucide-react';

const LOCAL_STORAGE_ASC_KEY = 'ASC_CODE_SAVED';

/* ============================================================
   MODAL DE 4 IMÁGENES PARA SELECCIÓN DE PUNTO DE FUGA
   ============================================================ */
const LeakModal = ({ onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-10 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
          <X size={20} className="text-slate-600" />
        </button>

        <div className="flex justify-center mb-8">
          <img src={`/leaks/0.jpg`} className="rounded-3xl max-h-64 md:max-h-80 object-contain shadow-xl border border-slate-100" />
        </div>
        
        <h3 className="text-2xl font-black text-center text-slate-800 mb-8 uppercase tracking-tighter">Seleccione el punto de fuga</h3>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-10">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18 ].map((n) => (
            <div
              key={n}
              className="group relative cursor-pointer aspect-square rounded-2xl overflow-hidden border-2 border-slate-100 hover:border-blue-600 transition-all hover:shadow-lg"
              onClick={() => onSelect(n)}
            >
              <img src={`/leaks/${n}.jpg`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                <span className="text-white font-black text-xl">{n}</span>
              </div>
              <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-slate-900 text-[10px] px-2 py-0.5 rounded-lg font-black shadow-sm">{n}</span>
            </div>
          ))}
        </div>

        <button className="w-full py-5 bg-slate-100 text-slate-700 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-xs" onClick={onClose}>
          Cerrar y Revisar
        </button>
      </div>
    </div>
  );
};

const EquipsPage = () => {
  const router = useRouter();
  const { user } = useAuth();

  // ESTADOS
  const [validadorVisible, setValidadorVisible] = useState(false);
  const [category, setCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { data, loading, error } = useFetchInfFirebase(category, searchTerm);

  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedDefectBlock, setSelectedDefectBlock] = useState(null);
  const [selectedSymptom, setSelectedSymptom] = useState(null);
  const [selectedSubSymptom, setSelectedSubSymptom] = useState(null);
  const [selectedRepairCode, setSelectedRepairCode] = useState(null);
  const [selectedSubRepairCode, setSelectedSubRepairCode] = useState(null);

  const [serialNumber, setSerialNumber] = useState('');
  const [isSerialNumberInProcess, setIsSerialNumberInProcess] = useState(false);
  const [serialNumberChecked, setSerialNumberChecked] = useState(false);
  const [serialNumberError, setSerialNumberError] = useState('');

  const [showSummary, setShowSummary] = useState(false);
  const [ascCode, setAscCode] = useState('');
  const [showLeakModal, setShowLeakModal] = useState(false);
  const [selectedLeakPoint, setSelectedLeakPoint] = useState(null);
  const [leakExtraInfo, setLeakExtraInfo] = useState('');

  // VALIDAR SN
  const NSValid = useMemo(() => {
    if (serialNumber.length !== 15) return false;
    const validChars7 = ['H', 'J', 'K', 'M', 'N', 'R', 'T', 'W', 'X', 'Y'];
    const validChars8 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C'];
    const char7 = serialNumber.charAt(7).toUpperCase();
    const char8 = serialNumber.charAt(8).toUpperCase();
    return validChars7.includes(char7) && validChars8.includes(char8);
  }, [serialNumber]);

  // ASC VALIDATION
  const validAscCodes = useMemo(() => [
    'Techsup','6448834','6434525','1401501','6449579','6283007','4907726','1658952',
    '1658994','1659040','4301958','1659075','1659136','1729840','1729975','1729981',
    '1730172','1730213','1730257','3453191','2485007','1730369','3329308','3490802',
    '3350595','3375393','3188990','3329209','3403522','3404483','3441335','2277262',
    '3456937','3464868','3465902','3467737','3491791','3861676','6420071','3903559',
    '4156881','4156884','4156883','4160663','4204348','4243700','4254175','4271992',
    '3887111','4292179','4366954','4375230','4377174','4789474','4789476','4894172',
    '4906330','4923659','4923680','4932655','4939874','4953466','4953467','4962883',
    '4979868','5777171','5777172','5779775','5785173','5788233','5791986','5798519',
    '5930135','5939508','5944496','5949511','5954013','5968133','5978055','6423092',
    '6423093','6423094','5981427','5984693','5995041','6421187','6420072','5999767',
    '6078654','6082798','4220824','6162465','4769819','6205424','6216903','3491830',
    '6266448','3191645','5283007','3865192','2484362','5288709','6288721','6288722',
    '6428335','8334950','8381572','8395034','9216816','2470144','7079673','Cessoss'
  ], []);

  const ascCodeCanonical = (ascCode || '').trim();
  const isAscCodeValid = useMemo(() => {
    const set = new Set(validAscCodes.map((c) => c.toUpperCase()));
    return set.has(ascCodeCanonical.toUpperCase());
  }, [ascCodeCanonical, validAscCodes]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(LOCAL_STORAGE_ASC_KEY);
    if (saved) setAscCode(saved);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isAscCodeValid) window.localStorage.setItem(LOCAL_STORAGE_ASC_KEY, ascCodeCanonical);
  }, [ascCodeCanonical, isAscCodeValid]);

  const resetAsc = () => {
    setAscCode('');
    if (typeof window !== 'undefined') window.localStorage.removeItem(LOCAL_STORAGE_ASC_KEY);
  };

  // VERIFICAR SN EN FIREBASE
  useEffect(() => {
    const check = async () => {
      setSerialNumberChecked(false);
      setSerialNumberError('');
      setIsSerialNumberInProcess(false);

      if (NSValid && isAscCodeValid && serialNumber.length === 15) {
        try {
          const ref = collection(db, 'serialNumbersInProcess');
          const q = query(ref, where('serialNumber', '==', serialNumber));
          const snap = await getDocs(q);

          if (!snap.empty) {
            setIsSerialNumberInProcess(true);
            await emailjs.send('service_hp5g9er', 'template_fw5dsio', {
              user_asc: ascCodeCanonical,
              serial_number: serialNumber,
              message: `El número de serie ${serialNumber} está en proceso de cierre por SSR o REDO.`,
              user_email: user?.email || 'N/A'
            }, 'OimePa9MbzuM5Lahj');
          }
        } catch (err) { console.error(err); } finally { setSerialNumberChecked(true); }
      } else if (serialNumber.length > 0 && serialNumber.length !== 15) {
        setSerialNumberError('El número de serie debe tener exactamente 15 caracteres.');
        setSerialNumberChecked(true);
      } else { setSerialNumberChecked(true); }
    };
    const t = setTimeout(check, 500);
    return () => clearTimeout(t);
  }, [serialNumber, isAscCodeValid, user]);

  // FLUJO DE SELECCIONES
  const handleModelClick = (m) => { setSelectedModel(m); setSelectedDefectBlock(null); setSelectedSymptom(null); setSelectedSubSymptom(null); setSelectedRepairCode(null); setSelectedSubRepairCode(null); };
  const handleDefectBlockClick = (b) => { setSelectedDefectBlock(b); setSelectedSymptom(null); setSelectedSubSymptom(null); setSelectedRepairCode(null); setSelectedSubRepairCode(null); };
  const handleSymptomClick = (s) => { setSelectedSymptom(s); setSelectedSubSymptom(null); setSelectedRepairCode(null); setSelectedSubRepairCode(null); };
  const handleSubSymptomClick = (ss) => { setSelectedSubSymptom(ss); setSelectedRepairCode(null); setSelectedSubRepairCode(null); };
  const handleRepairCodeClick = (r) => { setSelectedRepairCode(r); setSelectedSubRepairCode(null); };

  const handleSubRepairCodeClick = (subRep) => {
    setSelectedSubRepairCode(subRep);
    const strictGasFlow = selectedDefectBlock?.defectBlock === '4B09-GAS LEAKAGE' &&
      selectedSymptom?.symptomCode === 'SRC022-FUGA/FUGA' &&
      selectedSubSymptom?.subSymptomCode === 'HE9-FUGA DE GAS' &&
      selectedRepairCode?.repairCode === 'SRC001-REPARAR' &&
      subRep === 'B03-SEALED SYSTEM REPAIR WITH GAS PRESSURE';
    if (strictGasFlow) { setShowLeakModal(true); return; }
    setShowSummary(true);
  };

  const handleLeakSelect = (point) => {
    setSelectedLeakPoint(point);
    const table = {
      1: 'Compresor + descarga, Codigo: 1A, 1B',
      2: 'Condensaddor + clouster tuberia, Codigo: 2A, 2B',
      3: 'Cluster tuberia + tuberia de alta, Codigo: 3A, 3B',
      4: 'Tuberia de alta + dryer, Codigo: 4A, 4B',
      5: 'Dryer + tubo capilar, 5A, 5B',
      6: 'Tubo capilar + entrada del evaporador, Codigo: 6A, 6B',
      7: 'REF(FF) Salida del evaporador + REF(FF) succion, Codigo: 7A, 7B',
      8: 'REF(FF) Succion (Tubo capilar) + FRE(FZ) evaporador, Codigo: 8A, 8B',
      9: 'FRE(FZ) Evaporador + succion, Codigo: 9A, 9A',
      10: 'Tueberia de conexion de succión, Codigo: 10A, 10B',
      11: 'Tuberia de suucion + compresor, Codigo: 11A, 11B',
      12: 'Compresor + valvula de servico, Codigo: 12A, 12B',
      13: 'Valvula de servico, Codigo: 13A, 13B',
      14: 'Dryer + tuberia de carga, Codigo: 14A, 14B',
      15: 'Dryer + entrada de valvula step, Codigo: 15A, 15B',
      16: 'Valvula step + REF.(FF) tubo capilar, Codigo: 16A, 16B',
      17: 'Valvula step + FRE.(FZ) tubo capilar, Codigo: 17A, 17B',
      18: 'Punto de fuga no visible - fuga interna, Codigo: 18'
    };
    const code = table[point];
    setLeakExtraInfo(`Punto ${point}: ${code}`);
    setShowLeakModal(false);
    setShowSummary(true);
  };

  const handleBack = (step) => {
    if (step === 'model') return window.location.reload();
    const resets = {
      defectBlock: () => { setSelectedDefectBlock(null); setSelectedSymptom(null); setSelectedSubSymptom(null); setSelectedRepairCode(null); setSelectedSubRepairCode(null); },
      symptom: () => { setSelectedSymptom(null); setSelectedSubSymptom(null); setSelectedRepairCode(null); setSelectedSubRepairCode(null); },
      subSymptom: () => { setSelectedSubSymptom(null); setSelectedRepairCode(null); setSelectedSubRepairCode(null); },
      repairCode: () => { setSelectedRepairCode(null); setSelectedSubRepairCode(null); }
    };
    resets[step]?.();
  };

  const renderContent = () => {
    if (loading) return <div className="p-20 text-center font-black text-slate-400 animate-pulse">CARGANDO RECURSOS TÉCNICOS...</div>;
    if (error) return <div className="p-6 bg-rose-50 text-rose-600 rounded-2xl border border-rose-200">Error: {error.message}</div>;

    if (!ascCodeCanonical) return <div className="p-12 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-300 text-slate-400 font-bold italic">Primero, ingresa el código de tu centro de servicio.</div>;
    if (!isAscCodeValid) return <div className="p-12 text-center bg-rose-50 rounded-[2.5rem] border border-rose-200"><h2 className="text-rose-700 font-black">Código ASC no válido</h2></div>;
    if (serialNumberError) return <div className="p-12 text-center bg-amber-50 rounded-[2.5rem] border border-amber-200"><h2 className="text-amber-700 font-black mb-4">Error en Número de Serie</h2><p className="text-amber-600 mb-6">{serialNumberError}</p><button onClick={() => setSerialNumber('')} className="px-8 py-3 bg-amber-600 text-white rounded-xl font-bold">Reintentar</button></div>;
    if (!serialNumber || serialNumber.length !== 15 || !serialNumberChecked) return <div className="p-12 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-300 text-slate-400 font-bold italic">Ahora, ingresa el Número de Serie para continuar.</div>;

    if (showSummary) return (
      <div className="bg-white p-8 rounded-[3rem] border shadow-2xl animate-in zoom-in duration-300">
        <h2 className="text-2xl font-black text-slate-900 mb-6 border-b pb-4">Resumen de Selección</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-slate-50 p-6 rounded-3xl mb-8">
          <p><strong>Código ASC:</strong> {ascCodeCanonical}</p>
          <p><strong>SN:</strong> {serialNumber}</p>
          <p><strong>Modelo:</strong> {selectedModel?.productName}</p>
          <p><strong>Bloque:</strong> {selectedDefectBlock?.defectBlock}</p>
          <p><strong>Síntoma:</strong> {selectedSymptom?.symptomCode}</p>
          <p><strong>Sub-Síntoma:</strong> {selectedSubSymptom?.subSymptomCode}</p>
          <p><strong>Reparación:</strong> {selectedRepairCode?.repairCode}</p>
          <p><strong>Sub-código:</strong> {selectedSubRepairCode}</p>
          {leakExtraInfo && (
            <div className="md:col-span-2 mt-4 bg-blue-100 border border-blue-200 p-4 rounded-2xl">
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-1">Localización de Fuga:</span>
              <p className="text-blue-900 font-black text-base">{leakExtraInfo}</p>
            </div>
          )}
        </div>
        <button onClick={() => window.location.reload()} className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl flex items-center justify-center gap-2">
          <RotateCcw size={18} /> Reiniciar Selección
        </button>
      </div>
    );

    if (selectedRepairCode) return (
      <div className="animate-in slide-in-from-right-5 duration-300">
        <button onClick={() => handleBack('repairCode')} className="mb-6 flex items-center gap-2 text-slate-500 font-black hover:text-blue-600 transition-colors uppercase text-[10px] tracking-widest"><ChevronLeft size={16}/> Volver</button>
        <h2 className="text-xl font-black text-slate-900 mb-6 tracking-tight uppercase">Sub-Códigos: {selectedRepairCode.repairCode}</h2>
        <div className="grid grid-cols-1 gap-2">
          {selectedRepairCode.subRepairCodes?.map((sub, i) => (<button key={i} onClick={() => handleSubRepairCodeClick(sub)} className="w-full p-5 text-left bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 hover:border-blue-500 hover:bg-blue-50 transition-all shadow-sm">{sub}</button>))}
        </div>
      </div>
    );

    if (selectedSubSymptom) return (
        <div className="animate-in slide-in-from-right-5 duration-300">
          <button onClick={() => handleBack('subSymptom')} className="mb-6 flex items-center gap-2 text-slate-500 font-black hover:text-blue-600 transition-colors uppercase text-[10px] tracking-widest"><ChevronLeft size={16}/> Volver</button>
          <h2 className="text-xl font-black text-slate-900 mb-6 tracking-tight uppercase">Reparación: {selectedSubSymptom.subSymptomCode}</h2>
          <div className="grid grid-cols-1 gap-2">
            {selectedSubSymptom.repairCodes?.map((rc, i) => (<button key={i} onClick={() => handleRepairCodeClick(rc)} className="w-full p-5 text-left bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 hover:border-blue-500 hover:bg-blue-50 transition-all shadow-sm">{rc.repairCode}</button>))}
          </div>
        </div>
    );

    if (selectedSymptom) return (
        <div className="animate-in slide-in-from-right-5 duration-300">
          <button onClick={() => handleBack('symptom')} className="mb-6 flex items-center gap-2 text-slate-500 font-black hover:text-blue-600 transition-colors uppercase text-[10px] tracking-widest"><ChevronLeft size={16}/> Volver</button>
          <h2 className="text-xl font-black text-slate-900 mb-6 tracking-tight uppercase">Sub-Síntomas: {selectedSymptom.symptomCode}</h2>
          <div className="grid grid-cols-1 gap-2">
            {selectedSymptom.subSymptoms?.map((sub, i) => (<button key={i} onClick={() => handleSubSymptomClick(sub)} className="w-full p-5 text-left bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 hover:border-blue-500 hover:bg-blue-50 transition-all shadow-sm">{sub.subSymptomCode}</button>))}
          </div>
        </div>
    );

    if (selectedDefectBlock) return (
        <div className="animate-in slide-in-from-right-5 duration-300">
          <button onClick={() => handleBack('defectBlock')} className="mb-6 flex items-center gap-2 text-slate-500 font-black hover:text-blue-600 transition-colors uppercase text-[10px] tracking-widest"><ChevronLeft size={16}/> Volver</button>
          <h2 className="text-xl font-black text-slate-900 mb-6 tracking-tight uppercase">Síntomas: {selectedDefectBlock.defectBlock}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{selectedDefectBlock.symptoms?.map((sym, i) => (<button key={i} onClick={() => handleSymptomClick(sym)} className="w-full p-5 text-left bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 hover:border-blue-500 hover:bg-blue-50 transition-all shadow-sm">{sym.symptomCode}</button>))}</div>
        </div>
    );

    if (selectedModel) return (
        <div className="animate-in slide-in-from-right-5 duration-300">
          <button onClick={() => handleBack('model')} className="mb-6 flex items-center gap-2 text-slate-500 font-black hover:text-blue-600 transition-colors uppercase text-[10px] tracking-widest"><ChevronLeft size={16}/> Volver a Modelos</button>
          <h2 className="text-xl font-black text-slate-900 mb-6 tracking-tight uppercase">Bloques: {selectedModel.productName}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{selectedModel.defectBlocks?.map((block, i) => (<button key={i} onClick={() => handleDefectBlockClick(block)} className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-[2rem] hover:border-blue-500 hover:shadow-xl transition-all text-left shadow-sm">{block.defectBlockImageUrl && <img src={block.defectBlockImageUrl} className="w-20 h-20 object-contain rounded-xl border bg-slate-50"/>}<span className="font-black text-slate-800 text-sm uppercase tracking-tight">{block.defectBlock}</span></button>))}</div>
        </div>
    );

    const ready = isAscCodeValid && serialNumber.length === 15 && serialNumberChecked;
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-in fade-in duration-500">
        {data?.map((item) => item.imagenes?.modelo && (
          <button key={item.id} onClick={ready ? () => handleModelClick(item) : undefined} className={`group relative aspect-square bg-white p-4 rounded-[2.5rem] border border-slate-200 transition-all ${ready ? 'hover:border-blue-500 hover:shadow-2xl hover:-translate-y-1' : 'opacity-40 grayscale cursor-not-allowed'}`}>
            <img src={item.imagenes.modelo} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-slate-900">
      {showLeakModal && <LeakModal onSelect={handleLeakSelect} onClose={() => setShowLeakModal(false)} />}
      
      {/* HEADER REFINADO */}
      <div className="bg-[#0F172A] text-white p-6 md:p-10 mb-8 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none">White Line / Digital Lab</h1>
            <p className="text-[10px] text-blue-400 font-black tracking-[0.3em] mt-1">SOPORTE TÉCNICO V4.0</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/" className="px-5 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10">Inicio</Link>
            <Link href="resistanceComPage" className="px-5 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10">Resistencia Comp.</Link>
            <Link href="esCom" className="px-5 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10">Estandarización</Link>
            <Link href="/ContactForm" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/40">Buzón</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* PANEL LATERAL */}
        <aside className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={14}/> Acceso e Identificación</h3>
            
            <div className="space-y-4">
              <div className="relative">
                <input type="text" value={ascCode} onChange={(e) => setAscCode(e.target.value)} disabled={isAscCodeValid} className={`w-full p-4 rounded-2xl border-2 font-black transition-all text-sm uppercase ${isAscCodeValid ? 'bg-green-50 border-green-500 text-green-700' : 'bg-slate-50 border-slate-100 focus:border-blue-500 outline-none'}`} placeholder="Código de Centro (ASC)" />
                {isAscCodeValid && <button onClick={resetAsc} className="absolute right-4 top-4 text-rose-500 hover:scale-110 transition-transform"><RotateCcw size={18}/></button>}
              </div>

              <div className="relative">
                <input type="text" value={serialNumber} maxLength={15} onChange={(e) => { setSerialNumber(e.target.value); setSerialNumberChecked(false); setSerialNumberError(''); }} className={`w-full p-4 rounded-2xl border-2 font-black uppercase tracking-[0.2em] transition-all text-sm ${NSValid ? 'bg-green-50 border-green-500 text-green-700' : 'bg-slate-50 border-slate-100 focus:border-blue-500 outline-none'}`} placeholder="Número de Serie (15)" />
                {isSerialNumberInProcess && <div className="mt-2 p-3 bg-rose-100 text-rose-700 text-[10px] font-black rounded-xl border border-rose-200 animate-pulse uppercase">SSR / REDO EN PROCESO</div>}
              </div>

              <div className="pt-4 border-t space-y-3">
                  <select onChange={(e) => setCategory(e.target.value)} value={category} className="w-full p-4 rounded-2xl bg-slate-100 border-none font-black text-xs outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Todas las Categorías</option>
                      <option value="REF">REF</option><option value="WSM">WSM</option><option value="ACN">ACN</option><option value="MWO">MWO</option>
                  </select>
                  <div className="relative">
                      <Search className="absolute left-4 top-4 text-slate-400" size={16}/><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar modelo..." className="w-full pl-10 p-4 rounded-2xl bg-slate-100 border-none font-black text-xs outline-none" />
                  </div>
              </div>
            </div>
          </div>

          {/* VALIDADOR */}
          <div className={`p-4 rounded-[2.5rem] border transition-all ${validadorVisible ? 'bg-[#0F172A] border-slate-800 ring-4 ring-blue-500/10' : 'bg-slate-200 border-slate-300'}`}>
             <div className={validadorVisible ? "block p-2" : "hidden"}>
                <Validador numeroSerie={serialNumber} />
             </div>
             <button onClick={() => setValidadorVisible(!validadorVisible)} className={`w-full py-4 rounded-2xl font-black text-[10px] tracking-widest uppercase transition-all shadow-lg ${validadorVisible ? 'bg-white text-slate-900' : 'bg-slate-800 text-white hover:bg-slate-700'}`}>
                {validadorVisible ? 'Ocultar Guía' : 'Ver Guía de Validación'}
             </button>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="lg:col-span-2">
           {NSValid && isAscCodeValid ? (
             <div className="bg-white/50 backdrop-blur-sm rounded-[3.5rem] p-3 min-h-[500px]">
                {renderContent()}
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center p-20 bg-white border-4 border-dashed rounded-[4rem] text-center border-slate-100">
                <AlertCircle size={64} className="text-slate-100 mb-6"/>
                <p className="text-slate-300 font-black text-lg uppercase tracking-tight max-w-xs leading-tight">IDENTIFICACIÓN REQUERIDA PARA ACCEDER AL CATÁLOGO</p>
             </div>
           )}
        </main>
      </div>
    </div>
  );
};

export default EquipsPage;