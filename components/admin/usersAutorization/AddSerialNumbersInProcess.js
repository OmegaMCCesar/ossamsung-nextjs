import { db } from "../../../lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
  writeBatch,
  doc,
} from "firebase/firestore";
import { useState } from "react";
import styles from "../../../styles/AddSerialNumbersInProcess.module.css";

const AddSerialNumbersInProcess = () => {
  const [inputSerialNumbers, setInputSerialNumbers] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddSerialNumbers = async () => {
    setStatusMessage("");
    setLoading(true);

    const serialNumbersArray = inputSerialNumbers
      .trim()
      .split(/\s+/)
      .filter((sn) => sn.length >= 15);

    const uniqueSerialNumbers = Array.from(new Set(serialNumbersArray));

    if (uniqueSerialNumbers.length === 0) {
      setStatusMessage("No se ingresaron números de serie válidos (mínimo 15 caracteres).");
      setLoading(false);
      return;
    }

    try {
      const serialNumbersRef = collection(db, "serialNumbersInProcess");

      // Dividir en grupos de hasta 30 para la consulta 'where in'
      const chunkArray = (array, size) => {
        const result = [];
        for (let i = 0; i < array.length; i += size) {
          result.push(array.slice(i, i + size));
        }
        return result;
      };

      const chunks = chunkArray(uniqueSerialNumbers, 30);
      let existingSerialNumbers = [];

      for (const chunk of chunks) {
        const q = query(serialNumbersRef, where("serialNumber", "in", chunk));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          existingSerialNumbers.push(doc.data().serialNumber);
        });
      }

      const newSerialNumbers = uniqueSerialNumbers.filter(
        (sn) => !existingSerialNumbers.includes(sn)
      );

      // Escritura en lotes
      const batch = writeBatch(db);
      newSerialNumbers.forEach((sn) => {
        const docRef = doc(serialNumbersRef);
        batch.set(docRef, {
          serialNumber: sn,
          createdAt: serverTimestamp(),
        });
      });

      await batch.commit();

      setStatusMessage(
        `✅ Se agregaron ${newSerialNumbers.length} números de serie nuevos. ⚠️ ${existingSerialNumbers.length} ya existían.`
      );
      setInputSerialNumbers("");
    } catch (error) {
      console.error("Error al agregar números de serie:", error);
      setStatusMessage("❌ Ocurrió un error al agregar los números de serie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.containerSerialNumbers}>
      <h1>Agregar Números de Serie en Proceso</h1>
      <div className={styles.subContainerSerialNumbers}>
        <input
          value={inputSerialNumbers}
          onChange={(e) => setInputSerialNumbers(e.target.value.toUpperCase())}
          placeholder="Ingrese números de serie separados por espacios"
        />
        <button onClick={() => setInputSerialNumbers("")}>Limpiar</button>
        <button onClick={handleAddSerialNumbers} disabled={loading}>
          {loading ? "Procesando..." : "Agregar"}
        </button>
      </div>
      {statusMessage && <p>{statusMessage}</p>}
      <ul>
        {inputSerialNumbers.length > 0 &&
          inputSerialNumbers
            .trim()
            .split(/\s+/)
            .map((serialNumber, index) => (
              <li key={index}>{serialNumber}</li>
            ))}
      </ul>
    </div>
  );
};

export default AddSerialNumbersInProcess;
