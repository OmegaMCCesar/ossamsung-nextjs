import { useEffect, useState } from "react";
import { db } from "../../../lib/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  deleteDoc,
  doc,
} from "firebase/firestore";
import styles from "../../../styles/TechList.module.css";

export default function TechList() {
  const [techs, setTechs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [ascFilter, setAscFilter] = useState("");

  // Cargar técnicos
  useEffect(() => {
    const q = query(collection(db, "technicians"), orderBy("userName", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTechs(list);
      setFiltered(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Filtros dinámicos
  useEffect(() => {
    let data = [...techs];

    if (search.trim() !== "") {
      data = data.filter((t) =>
        (t.name + " " + t.alias)
          .toLowerCase()
          .includes(search.trim().toLowerCase())
      );
    }

    if (ascFilter.trim() !== "") {
      data = data.filter((t) => t.asc === ascFilter);
    }

    setFiltered(data);
  }, [search, ascFilter, techs]);

  // Eliminar técnico
  const deleteTech = async (id) => {
    if (!confirm("¿Eliminar técnico definitivamente?")) return;
    await deleteDoc(doc(db, "technicians", id));
  };

  if (loading) return <p>Cargando técnicos...</p>;

  // Obtener lista de ASC dinámicos
  const ascList = [...new Set(techs.map((t) => t.asc))].sort();

  return (
    <div className={styles.container}>
      <h2>Técnicos Registrados</h2>

      {/* Filtros */}
      <div className={styles.filters}>
        <input
          placeholder="Buscar por nombre o alias..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={ascFilter} onChange={(e) => setAscFilter(e.target.value)}>
          <option value="">Todos los ASC</option>
          {ascList.map((asc) => (
            <option key={asc} value={asc}>
              {asc}
            </option>
          ))}
        </select>
      </div>

      {/* Lista */}
      <div className={styles.list}>
        {filtered.map((t) => (
          <div className={styles.card} key={t.id}>
            <img
              src={`/avatars/${t.avatar}.png`}
              className={styles.avatar}
              alt="avatar"
            />

            <div className={styles.info}>
              <p><strong>{t.name}</strong> ({t.alias})</p>
              <p>ASC: {t.asc}</p>
              <p>BP: {t.bp}</p>
              <p>{t.email}</p>
            </div>

            <div className={styles.actions}>
              <button
                className={styles.editBtn}
                onClick={() => (window.location.href = `/admin/edit-tech/${t.id}`)}
              >
                Editar
              </button>

              <button
                className={styles.deleteBtn}
                onClick={() => deleteTech(t.id)}
              >
                Borrar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
