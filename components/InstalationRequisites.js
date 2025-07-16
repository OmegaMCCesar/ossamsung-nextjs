import React, { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc
} from "firebase/firestore";
import styles from "../styles/checkIList.module.css";

export default function InstalationRequisites() {
  const [modelos, setModelos] = useState([]);
  const [modeloSeleccionado, setModeloSeleccionado] = useState(null);
  const [requisitos, setRequisitos] = useState([]);
  const [categoriasValidas, setCategoriasValidas] = useState([]);
  const [paso, setPaso] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [mensajeError, setMensajeError] = useState("");

  const categorias = ["hidraulico", "electrico", "espacio", "plomeria"];

  useEffect(() => {
    const fetchModelos = async () => {
      const snapshot = await getDocs(collection(db, "modelosInstal"));
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

      const cats = categorias.filter(cat =>
        resultados.some(r => r.tipo === cat)
      );
      setCategoriasValidas(cats);
      setPaso(0);
    };

    fetchRequisitos();
  }, [modeloSeleccionado]);

  const requisitosPorCategoria = categoriasValidas.map(cat =>
    requisitos.filter(r => r.tipo === cat)
  );

  const categoriaActual = categoriasValidas[paso];
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

  const guardarModeloNoEncontrado = async (modeloNoEncontrado) => {
    const nombreUpper = modeloNoEncontrado.toUpperCase();

    try {
      const q = query(
        collection(db, "modelosNoEncontrados"),
        where("nombre", "==", nombreUpper)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        await addDoc(collection(db, "modelosNoEncontrados"), {
          nombre: nombreUpper,
          timestamp: new Date()
        });
        console.log(`✅ Modelo no encontrado guardado: ${nombreUpper}`);
      } else {
        console.log(`ℹ️ El modelo ${nombreUpper} ya estaba registrado como no encontrado.`);
      }
    } catch (error) {
      console.error("❌ Error al guardar modelo no encontrado:", error);
    }
  };

  const buscarModelo = () => {
    const nombreBuscado = busqueda.trim().toUpperCase();
    const modelo = modelos.find(m => m.nombre.toUpperCase() === nombreBuscado);

    if (modelo) {
      setModeloSeleccionado(modelo);
      setMensajeError("");
    } else {
      setMensajeError("Modelo no encontrado. Verifica el modelo e intenta de nuevo. Si el modelo no aparece aun después de verificar, este se agregara de 1 a 3 dias despues. Puedes intentar buscarlo nuevamente despues de este periodo.");
      guardarModeloNoEncontrado(nombreBuscado);
    }
  };

  const resetear = () => {
    setModeloSeleccionado(null);
    setBusqueda("");
    setMensajeError("");
    setPaso(0);
    setRequisitos([]);
    setCategoriasValidas([]);
  };

  if (modeloSeleccionado && paso >= categoriasValidas.length) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Checklist instalación</h2>
        <p>No hay más requisitos por mostrar.</p>
        <button onClick={resetear} className={styles.buttonSecundary}>Reiniciar</button>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${styles.fadeIn}`}>
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
              <li
                key={req.id}
                className={`${styles.item} ${req.cumplido ? styles.completed : ""}`}
              >
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
                      <img key={i} src={img} alt={`Imagen ${i}`} className={styles.img} />
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
            {paso < categoriasValidas.length - 1 && (
              <button
                onClick={() => setPaso(paso + 1)}
                className={styles.button}
                disabled={!todosCumplidosCategoriaActual}
              >
                Siguiente
              </button>
            )}
            {paso === categoriasValidas.length - 1 && (
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
