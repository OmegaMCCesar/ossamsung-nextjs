import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collectionGroup, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

const useFetchInfFirebase = (category = '', searchTerm = '') => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const infoRef = collectionGroup(db, 'modelos');
        let filterQuery = infoRef;

        // Aplicar filtro por categoría si se proporciona
        if (category) {
          filterQuery = query(filterQuery, where('category', '==', category));
        }

        // Aplicar filtro por modelo si se proporciona
        if (searchTerm) {
          filterQuery = query(
            filterQuery,
            where('productModel', '>=', searchTerm.toUpperCase()),
            where('productModel', '<=', searchTerm.toUpperCase() + '\uf8ff'),
            orderBy('productModel'),
            limit(10)
          );
        }

        const querySnapshot = await getDocs(filterQuery);
        const fetchedData = [];
        querySnapshot.forEach((doc) => {
          fetchedData.push({ id: doc.id, ...doc.data() });
        });
        setData(fetchedData);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [category, searchTerm]);

  return { data, loading, error };
};

export default useFetchInfFirebase;



