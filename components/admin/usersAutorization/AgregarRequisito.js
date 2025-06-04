import React, { useState } from "react";
import { db } from "../../../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";
import styles from "../../../styles/panelAdmin.module.css";

export default function AgregarRequisito() {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("hidraulico");
  const [detalle, setDetalle] = useState("");
  const [imgRef, setImgRef] = useState([""]);
  const [mensaje, setMensaje] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    const q = query(collection(db, "requisitosInstalacion"), where("nombre", "==", nombre));
    const snapshot = await getDocs(q);

    const cleanedImgRef = imgRef.filter((url) => url.trim() !== "");
    let fueActualizado = false;

    if (!snapshot.empty) {
      // Requisito ya existe → actualizar
      const existingDoc = snapshot.docs[0];
      const ref = doc(db, "requisitosInstalacion", existingDoc.id);

      const modelosCompatibles = existingDoc.data().modelosCompatibles || [];

      await updateDoc(ref, {
        nombre,
        tipo,
        detalle,
        imgRef: cleanedImgRef,
        modelosCompatibles, // preservamos el campo
      });

      fueActualizado = true;
    } else {
      // Nuevo requisito → crear
      await addDoc(collection(db, "requisitosInstalacion"), {
        nombre,
        tipo,
        detalle,
        imgRef: cleanedImgRef,
        modelosCompatibles: [],
      });
    }

    setNombre("");
    setDetalle("");
    setImgRef([""]);
    setMensaje(fueActualizado ? "✅ Requisito actualizado correctamente" : "✅ Requisito creado exitosamente");

    setTimeout(() => setMensaje(""), 3000);
  };

  const handleImgChange = (value, idx) => {
    const updated = [...imgRef];
    updated[idx] = value;
    setImgRef(updated);
  };

  const addImgField = () => setImgRef([...imgRef, ""]);

  return (
    <form onSubmit={handleSubmit} className={styles.card}>
      <h2 className={styles.subtitle}>Agregar nuevo requisito</h2>
      <input
        className={styles.input}
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Nombre del requisito"
      />
      <select className={styles.input} value={tipo} onChange={(e) => setTipo(e.target.value)}>
        <option value="hidraulico">Hidráulico</option>
        <option value="electrico">Eléctrico</option>
        <option value="espacio">Espacio</option>
        <option value="plomeria">Plomería</option>
      </select>
      <input
        className={styles.input}
        value={detalle}
        onChange={(e) => setDetalle(e.target.value)}
        placeholder="Detalle (opcional)"
      />
      {imgRef.map((url, idx) => (
        <input
          key={idx}
          className={styles.input}
          value={url}
          onChange={(e) => handleImgChange(e.target.value, idx)}
          placeholder={`URL de imagen ${idx + 1}`}
        />
      ))}
      <button type="button" className={styles.addButton} onClick={addImgField}>
        + Añadir imagen
      </button>
      <button className={styles.button} type="submit">Guardar Requisito</button>
      {mensaje && <p className={styles.successMessage}>{mensaje}</p>}
    </form>
  );
}
