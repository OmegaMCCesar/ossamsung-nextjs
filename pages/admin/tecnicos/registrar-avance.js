import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import styles from '../../../styles/admin.module.css';

export default function RegistrarAvance() {
  const [tecnicos, setTecnicos] = useState([]);
  const [areas, setAreas] = useState([]);

  const [userId, setUserId] = useState("");
  const [categoria, setCategoria] = useState("");
  const [subcategoria, setSubcategoria] = useState("");
  const [puntaje, setPuntaje] = useState(0);
  const [descripcion, setDescripcion] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const techSnap = await getDocs(collection(db, 'technicians'));
      const areaSnap = await getDocs(collection(db, 'areasTecnicas'));

      setTecnicos(techSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setAreas(areaSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    fetchData();
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!userId || !categoria || puntaje == 0) return;

    await addDoc(collection(db, 'technicianProgress'), {
      userId,
      categoria,
      subcategoria,
      puntaje: Number(puntaje),
      descripcion,
      timestamp: Date.now()
    });

    alert("Avance guardado");
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Registrar avance de técnico</h1>

      <form onSubmit={handleSubmit} className={styles.form}>

        <label>Técnico</label>
        <select value={userId} onChange={e => setUserId(e.target.value)}>
          <option value="">Selecciona...</option>
          {tecnicos.map(t => (
            <option key={t.id} value={t.userId}>{t.name}</option>
          ))}
        </select>

        <label>Área técnica</label>
        <select value={categoria} onChange={e => setCategoria(e.target.value)}>
          <option value="">Selecciona...</option>
          {areas.map(a => (
            <option key={a.id} value={a.nombre}>{a.nombre}</option>
          ))}
        </select>

        <label>Puntaje</label>
        <input 
          type="number"
          value={puntaje}
          onChange={e => setPuntaje(e.target.value)}
        />

        <label>Descripción</label>
        <textarea
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
        />

        <button type="submit" className={styles.logoutButton}>Guardar avance</button>
      </form>
    </div>
  );
}
