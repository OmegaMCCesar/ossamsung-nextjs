import React, { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import styles from "../styles/checkIList.module.css";

export default function InstalationRequisites() {
  const [modelos, setModelos] = useState([]);
  const [modeloSeleccionado, setModeloSeleccionado] = useState(null);
  const [requisitos, setRequisitos] = useState([]);
  const [paso, setPaso] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [mensajeError, setMensajeError] = useState("");

  const categorias = ["hidraulico", "electrico", "espacio", "plomeria"];

  useEffect(() => {
    const fetchModelos = async () => {
      const snapshot = await getDocs(collection(db, "modelos"));
      const lista = snapshot.docs.map(doc => doc.data());
      setModelos(lista);
    };
    fetchModelos();
  }, []);

  useEffect(() => {
    const fetchRequisitos = async () => {
      if (!modeloSeleccionado) return;

      const q = query(
        collection(db, "requisitosInstalacion"),
        where("modelosCompatibles", "array-contains", modeloSeleccionado.nombre)
      );
      const snapshot = await getDocs(q);
      const resultados = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          tipo: data.tipo.trim().toLowerCase(),
          cumplido: false,
          imgRef: Array.isArray(data.imgRef) ? data.imgRef : [],
        };
      });
      setRequisitos(resultados);
      setPaso(0);
    };

    fetchRequisitos();
  }, [modeloSeleccionado]);

  const requisitosPorCategoria = categorias.map(cat =>
    requisitos.filter(r => r.tipo === cat)
  );

  const categoriaActual = categorias[paso];
  const requisitosActuales = requisitosPorCategoria[paso] || [];

  const todosCumplidosCategoriaActual = requisitosActuales.every(r => r.cumplido);

  const todosLosRequisitosCumplidos =
    requisitos.length > 0 && requisitos.every(r => r.cumplido);

  const handleCheck = (index) => {
    const updated = [...requisitos];
    const requisitoIndex = requisitos.findIndex(
      r => r.id === requisitosActuales[index].id
    );
    updated[requisitoIndex].cumplido = !updated[requisitoIndex].cumplido;
    setRequisitos(updated);
  };

  const buscarModelo = () => {
    const modelo = modelos.find(m => m.nombre.toLowerCase() === busqueda.toLowerCase().trim());
    if (modelo) {
      setModeloSeleccionado(modelo);
      setMensajeError("");
    } else {
      setMensajeError("Modelo no encontrado. Verifica el nombre e intenta de nuevo.");
    }
  };

  const resetear = () => {
    setModeloSeleccionado(null);
    setBusqueda("");
    setMensajeError("");
    setPaso(0);
    setRequisitos([]);
  };

  return (
    <div className={styles.container}>
      {!modeloSeleccionado ? (
        <>
          <h2 className={styles.title}>Buscar modelo a instalar</h2>
          <input
            className={styles.input}
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Ej. WF45T6000AW"
          />
          <button className={styles.button} onClick={buscarModelo}>
            Buscar
          </button>
          {mensajeError && <p className={styles.error}>{mensajeError}</p>}
        </>
      ) : (
        <>
          <h2 className={styles.title}>
            Checklist instalación - {modeloSeleccionado.nombre}
          </h2>
          <h3 className={styles.subTitle}>
            {categoriaActual?.toUpperCase()}
          </h3>
          <ul className={styles.list}>
            {requisitosActuales.map((req, idx) => (
              <li key={req.id} className={styles.item}>
                <label>
                  <input
                    type="checkbox"
                    checked={req.cumplido}
                    onChange={() => handleCheck(idx)}
                  />
                  {req.nombre} {req.detalle && `(${req.detalle})`}
                </label>

                {req.imgRef.length > 0 && (
                  <div className={styles.imgContainer}>
                    {req.imgRef.map((img, i) => (
                      <img key={i} src={img} alt={`Imagen ${i}`} />
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className={styles.actions}>
            {paso > 0 && (
              <button onClick={() => setPaso(paso - 1)} className={styles.button}>
                Anterior
              </button>
            )}
            {paso < categorias.length - 1 && (
              <button
                onClick={() => setPaso(paso + 1)}
                className={styles.button}
                disabled={!todosCumplidosCategoriaActual}
              >
                Siguiente
              </button>
            )}
            {paso === categorias.length - 1 && (
              <button
                onClick={resetear}
                className={styles.buttonSecundary}
              >
                Reiniciar
              </button>
            )}
          </div>

          {todosLosRequisitosCumplidos && (
            <div className={styles.successMessage}>
              ✅ ¡Equipo listo para instalar!
            </div>
          )}
        </>
      )}
    </div>
  );
}
