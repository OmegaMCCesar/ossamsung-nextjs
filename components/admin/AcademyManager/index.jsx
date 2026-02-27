import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, updateDoc, doc } from 'firebase/firestore';
import { Save, Search, AlertCircle, Loader2, Database } from 'lucide-react';

export default function AcademyManager() {
  const [parts, setParts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    const fetchParts = async () => {
      try {
        const q = query(collection(db, "partsForDiagnosis"));
        const querySnapshot = await getDocs(q);
        const partsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).filter(part => !part.technicalData || !part.diagnosticSteps);
        
        setParts(partsList);
      } catch (error) {
        console.error("Error al obtener partes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchParts();
  }, []);

  const handleUpdate = async (id) => {
    const techVal = document.getElementById(`tech-${id}`).value;
    const diagVal = document.getElementById(`diag-${id}`).value;

    if (!techVal || !diagVal) return alert("Por favor llena ambos campos.");

    setUpdating(id);
    try {
      const partRef = doc(db, "partsForDiagnosis", id);
      await updateDoc(partRef, {
        technicalData: techVal,
        diagnosticSteps: diagVal,
        updatedAt: new Date()
      });
      setParts(parts.filter(p => p.id !== id));
    } catch (error) {
      console.error("Error actualizando:", error);
      alert("Error al guardar.");
    } finally {
      setUpdating(null);
    }
  };

  const filteredParts = parts.filter(p => 
    p.partName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.partNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center p-12">
      <Loader2 className="animate-spin text-blue-600 mr-2" />
      <p className="text-gray-500 font-medium">Cargando catálogo técnico...</p>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Database className="text-blue-600" size={24} />
            Gestión de Conocimiento Academy
          </h2>
          <p className="text-sm text-gray-500">
            Vincula datos técnicos reales a las partes para que la IA los use en el Academy.
          </p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Buscar por nombre o #..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {parts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 max-h-150 overflow-y-auto pr-2 custom-scrollbar">
          {filteredParts.map((part) => (
            <div key={part.id} className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:border-blue-300 transition-all shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Info de la Parte */}
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-white rounded-lg border shrink-0 overflow-hidden">
                    {part.imageUrl ? (
                      <img src={part.imageUrl} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50 text-[10px] text-center p-1">Sin Imagen</div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 leading-tight">{part.partName}</h4>
                    <p className="text-xs text-blue-600 font-mono mt-1">{part.partNumber}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded uppercase">Pendiente</span>
                  </div>
                </div>

                {/* Inputs de Datos */}
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Especificación Técnica (Ohms/V)</label>
                    <input 
                      id={`tech-${part.id}`}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none transition-all"
                      placeholder="Ej: 150-200Ω / 120V AC"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Método de Diagnóstico</label>
                    <textarea 
                      id={`diag-${part.id}`}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none transition-all h-10.5 resize-none"
                      placeholder="Ej: Bloquear eje y medir torque..."
                    ></textarea>
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <button 
                      onClick={() => handleUpdate(part.id)}
                      disabled={updating === part.id}
                      className="flex items-center gap-2 bg-gray-900 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-xs font-bold transition-all disabled:bg-gray-400"
                    >
                      {updating === part.id ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                      Guardar en Academy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-green-50 rounded-2xl border border-green-100">
          <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
          <p className="text-green-800 font-bold">¡Todo al día!</p>
          <p className="text-green-600 text-sm">Todas las partes registradas tienen información técnica completa.</p>
        </div>
      )}
    </div>
  );
}