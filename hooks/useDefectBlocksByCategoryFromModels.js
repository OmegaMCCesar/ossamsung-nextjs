import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collectionGroup, getDocs, query, where } from 'firebase/firestore';

const useDefectBlocksByCategoryFromModels = (category = '') => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlocks = async () => {
      setLoading(true);
      try {
        const modelosRef = collectionGroup(db, 'modelos');
        const q = query(modelosRef, where('category', '==', category));
        const querySnapshot = await getDocs(q);
        let allBlocks = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.defectBlocks && Array.isArray(data.defectBlocks)) {
            data.defectBlocks.forEach((block) => {
              // Verificamos si ya existe este bloque para fusionar los datos
              const existingBlock = allBlocks.find((b) => b.defectBlock === block.defectBlock);

              if (existingBlock) {
                // Si ya existe, fusionamos los datos asegurándonos de no perder información
                existingBlock.symptoms = [...new Set([...existingBlock.symptoms, ...block.symptoms.map(s => s.symptomCode)])];
                existingBlock.subSymptoms = [...new Set([...existingBlock.subSymptoms, ...block.symptoms.flatMap(s => s.subSymptoms.map(ss => ss.subSymptomCode))])];
                existingBlock.repairCodes = [...new Set([...existingBlock.repairCodes, ...block.symptoms.flatMap(s => s.subSymptoms.flatMap(ss => ss.repairCodes.map(rc => rc.repairCode)))])];
                existingBlock.subRepairCodes = [...new Set([...existingBlock.subRepairCodes, ...block.symptoms.flatMap(s => s.subSymptoms.flatMap(ss => ss.repairCodes.flatMap(rc => rc.subRepairCodes)))])];
              } else {
                // Si no existe, lo agregamos asegurando que tenga todos los datos
                allBlocks.push({
                  defectBlock: block.defectBlock,
                  defectBlockImageUrl: block.defectBlockImageUrl || '',
                  symptoms: block.symptoms ? block.symptoms.map(s => s.symptomCode) : [],
                  subSymptoms: block.symptoms ? block.symptoms.flatMap(s => s.subSymptoms.map(ss => ss.subSymptomCode)) : [],
                  repairCodes: block.symptoms ? block.symptoms.flatMap(s => s.subSymptoms.flatMap(ss => ss.repairCodes.map(rc => rc.repairCode))) : [],
                  subRepairCodes: block.symptoms ? block.symptoms.flatMap(s => s.subSymptoms.flatMap(ss => ss.repairCodes.flatMap(rc => rc.subRepairCodes))) : [],
                });
              }
            });
          }
        });

        setBlocks(allBlocks);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (category) {
      fetchBlocks();
    } else {
      setBlocks([]);
      setLoading(false);
    }
  }, [category]);

  return { blocks, loading, error };
};

export default useDefectBlocksByCategoryFromModels;

