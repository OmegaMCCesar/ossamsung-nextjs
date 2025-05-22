import React, { useState, useEffect } from 'react';
import { collectionGroup, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import styles from '../styles/FaultSearch.module.css';
import DefectCard from '../components/DefectCard';
import DefectDetailModal from '../components/DefectDetailModal';

const DiagnosticoScreen = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [resultados, setResultados] = useState([]);
  const [modelosData, setModelosData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDefecto, setSelectedDefecto] = useState(null);

  useEffect(() => {
    const cargarModelos = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collectionGroup(db, 'modelos'));
        const data = snapshot.docs.map(doc => doc.data());
        setModelosData(data);
      } catch (err) {
        setError('Error al cargar modelos.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    cargarModelos();
  }, []);

  const handleSearch = (e) => setSearchTerm(e.target.value);

  useEffect(() => {
    if (!searchTerm) return setResultados([]);

    const term = searchTerm.toLowerCase();
    const defectMap = new Map();

    modelosData.forEach(modelo => {
      modelo?.defectBlocks?.forEach(defect => {
        const key = defect.defectBlock;
        if (!key) return;

        const fallaTipo = defect.fallaTipo?.toLowerCase() || '';
        const caracteristicas = (defect.caracteristicas || []).join(' ').toLowerCase();

        const match =
          key.toLowerCase().includes(term) ||
          fallaTipo.includes(term) ||
          caracteristicas.includes(term) ||
          modelo.productModel?.toLowerCase().includes(term) ||
          modelo.productName?.toLowerCase().includes(term) ||
          (Array.isArray(defect.symptoms) && defect.symptoms.some(sym =>
            sym.symptomCode?.toLowerCase().includes(term) ||
            sym.subSymptoms?.some(sub => sub.subSymptomCode?.toLowerCase().includes(term)) ||
            sym.repairCodes?.some(rep =>
              rep.repairCode?.toLowerCase().includes(term) ||
              rep.subRepairCodes?.some(sub => sub.toLowerCase().includes(term))
            )
          ));

        if (match) {
          if (!defectMap.has(key)) {
            defectMap.set(key, {
              defectBlockInfo: {
                ...defect,
                symptoms: [],
              },
              modelos: new Set(),
            });
          }

          const entry = defectMap.get(key);
          entry.modelos.add(modelo.productModel);

          // Agrupar síntomas únicos por symptomCode
          if (Array.isArray(defect.symptoms)) {
            defect.symptoms.forEach(sym => {
              if (!entry.defectBlockInfo.symptoms.some(s => s.symptomCode === sym.symptomCode)) {
                entry.defectBlockInfo.symptoms.push(sym);
              }
            });
          }
        }
      });
    });

    const resultadoFinal = Array.from(defectMap.entries()).map(([key, value]) => ({
      defectBlockInfo: value.defectBlockInfo,
      modelos: Array.from(value.modelos),
    }));

    setResultados(resultadoFinal);
  }, [searchTerm, modelosData]);

  if (loading) return <p>Cargando información de diagnóstico...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className={styles.diagnosticoContainer}>
      <h1>Proyecto First Time Complete</h1>
      <input
        type="text"
        placeholder="Ingrese un síntoma, código o parte defectuosa"
        value={searchTerm}
        onChange={handleSearch}
        className={styles.searchInput}
      />

      {searchTerm && resultados.length > 0 ? (
        <div className={styles.gridContainer}>
          {resultados.map((resultado, index) => (
            <DefectCard
              key={index}
              nombre={resultado.defectBlockInfo?.comunName || resultado.defectBlockInfo?.defectBlock}
              imagen={resultado.defectBlockInfo?.defectBlockImageUrl}
              fallaTipo={resultado.defectBlockInfo?.fallaTipo}
              caracteristicas={resultado.defectBlockInfo?.caracteristicas}
              modelos={resultado.modelos}
              onClick={() => setSelectedDefecto(resultado)}
            />
          ))}
        </div>
      ) : (
        searchTerm && <p>No se encontraron coincidencias.</p>
      )}

      {selectedDefecto && (
        <DefectDetailModal
          defecto={selectedDefecto}
          onClose={() => setSelectedDefecto(null)}
        />
      )}
    </div>
  );
};

export default DiagnosticoScreen;
