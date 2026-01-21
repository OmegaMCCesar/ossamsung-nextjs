import React, { useState, useEffect } from 'react';
import styles from '../../styles/adminPanel.module.css';
import { db } from '../../lib/firebase'; 
import { collection, addDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';

const AdminPanel = () => {
  const [techs, setTechs] = useState([]);
  const [ascs, setAscs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para Técnicos
  const [formData, setFormData] = useState({
    userName: '', email: '', asc: '', bp: '', raExpiration: ''
  });

  // Estado para ASC
  const [ascData, setAscData] = useState({
    area: '', ascCode: '', contact: '', email: '', nameAsc: '', tels: ['', '']
  });

  // 1. Cargar Técnicos filtrados por ASC
  const fetchTechs = async () => {
    let q = collection(db, "technicians");
    if (searchTerm) {
      q = query(q, where("asc", "==", searchTerm));
    }
    const querySnapshot = await getDocs(q);
    setTechs(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    fetchTechs();
  }, [searchTerm]);

  // 2. Guardar ASC
  const handleSaveAsc = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "ascInfo"), ascData);
      alert("ASC registrado con éxito");
    } catch (err) { console.error(err); }
  };

  return (
    <div className={styles.container}>
      {/* SECCIÓN REGISTRO ASC */}
      <div className={styles.card}>
        <h2 className={styles.title}>Registrar Nuevo ASC</h2>
        <form className={styles.gridForm} onSubmit={handleSaveAsc}>
          <input className={styles.input} placeholder="Nombre ASC" onChange={e => setAscData({...ascData, nameAsc: e.target.value})} />
          <input className={styles.input} placeholder="Código ASC" onChange={e => setAscData({...ascData, ascCode: e.target.value})} />
          <input className={styles.input} placeholder="Área (Ejem: PACIFICO)" onChange={e => setAscData({...ascData, area: e.target.value})} />
          <input className={styles.input} placeholder="Contacto" onChange={e => setAscData({...ascData, contact: e.target.value})} />
          <button type="submit" className={styles.submitBtn}>Guardar ASC</button>
        </form>
      </div>

      {/* SECCIÓN LISTADO Y BÚSQUEDA */}
      <div className={styles.card}>
        <h2 className={styles.title}>Listado de Técnicos</h2>
        <input 
          className={styles.input} 
          placeholder="🔍 Buscar por ASC Code..." 
          onChange={(e) => setSearchTerm(e.target.value)} 
          style={{marginBottom: '20px', width: '100%'}}
        />
        
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>ASC</th>
              <th>RA Status</th>
              <th>Vence</th>
            </tr>
          </thead>
          <tbody>
            {techs.map(tech => (
              <tr key={tech.id}>
                <td>{tech.userName}</td>
                <td>{tech.asc}</td>
                <td>
                   <span className={styles.statusBadge}>
                     {tech.raExpiration ? 'Revisando...' : 'Sin Fecha'}
                   </span>
                </td>
                <td>{tech.raExpiration?.toDate().toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPanel;