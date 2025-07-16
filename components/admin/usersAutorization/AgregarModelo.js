import React, { useEffect, useState } from "react";
import { db } from "../../../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import styles from "../../../styles/panelAdmin.module.css";

export default function AgregarModelo() {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("inverter");
  const [categoria, setCategoria] = useState("lavadora");
  const [requisitos, setRequisitos] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const fetchRequisitos = async () => {
      const snapshot = await getDocs(collection(db, "requisitosInstalacion"));
      setRequisitos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchRequisitos();
  }, []);

  const toggleSeleccionado = (id) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    const q = query(collection(db, "modelosInstal"), where("nombre", "==", nombre));
    const snapshot = await getDocs(q);

    let modeloRef;
    let fueActualizado = false;

    if (!snapshot.empty) {
      const existingDoc = snapshot.docs[0];
      modeloRef = doc(db, "modelosInstal", existingDoc.id);
      await updateDoc(modeloRef, { tipo, categoria });
      fueActualizado = true;
    } else {
      const newDoc = await addDoc(collection(db, "modelosInstal"), {
        nombre,
        tipo,
        categoria,
      });
      modeloRef = newDoc;
    }

    for (const id of seleccionados) {
      const ref = doc(db, "requisitosInstalacion", id);
      const requisitoDoc = requisitos.find(r => r.id === id);
      const nuevosModelos = [...(requisitoDoc.modelosCompatibles || []), nombre];
      await updateDoc(ref, {
        modelosCompatibles: Array.from(new Set(nuevosModelos)),
      });
    }

    setNombre("");
    setSeleccionados([]);
    setMensaje(fueActualizado ? "✅ Modelo actualizado correctamente" : "✅ Modelo creado exitosamente");

    setTimeout(() => setMensaje(""), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.card}>
      <h2 className={styles.subtitle}>Agregar nuevo modelo</h2>
      <input
        className={styles.input}
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Nombre del modelo"
      />
      <select
        className={styles.input}
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
      >
        <option value="inverter">Inverter</option>
        <option value="convencional">Convencional</option>
      </select>
      <select
        className={styles.input}
        value={categoria}
        onChange={(e) => setCategoria(e.target.value)}
      >
        <option value="lavadora">Lavadora</option>
        <option value="refrigerador">Refrigerador</option>
        <option value="secadora">Secadora</option>
        <option value="lavasecadora">Lavasecadora</option>
      </select>
      <div className={styles.checkboxList}>
        {requisitos.map((r) => (
          <label key={r.id} className={styles.checkboxItem}>
            <input
              type="checkbox"
              checked={seleccionados.includes(r.id)}
              onChange={() => toggleSeleccionado(r.id)}
            />
            {r.nombre} ({r.tipo})
          </label>
        ))}
      </div>
      <button className={styles.button} type="submit">
        Guardar Modelo
      </button>
      {mensaje && <p className={styles.successMessage}>{mensaje}</p>}
    </form>
  );
}
