import React, { useEffect, useState } from "react";
import styles from "../../styles/AdminPanel.module.css";

import {
  getTechniciansByAsc,
  getAscs
} from "../../lib/services/adminService";

import AscForm from "../../pages/admin/AscForm";
import AscList from "../../pages/admin/AscList";
import TechniciansTable from "./TechniciansTable";
import TechnicianForm from "./TechnicianForm";

const AdminPanel = () => {
  const [techs, setTechs] = useState([]);
  const [ascs, setAscs] = useState([]);
  const [selectedAsc, setSelectedAsc] = useState("");

  const fetchAscs = async () => {
    const data = await getAscs();
    setAscs(data);
  };

  const fetchTechs = async () => {
    const data = await getTechniciansByAsc(selectedAsc);
    setTechs(data);
  };

  useEffect(() => {
    fetchAscs();
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchTechs();
    }, 400);

    return () => clearTimeout(delay);
  }, [selectedAsc]);

  return (
    <div className={styles.container}>
      <AscForm onSaved={fetchAscs} />
      <AscList ascs={ascs} />
      <TechnicianForm
  ascs={ascs}
  onSaved={fetchTechs}
/>


      <div className={styles.card}>
        <h2 className={styles.title}>Listado de Técnicos</h2>

        <select
          className={styles.input}
          value={selectedAsc}
          onChange={e => setSelectedAsc(e.target.value)}
        >
          <option value="">Todos los ASC</option>
          {ascs.map(a => (
            <option key={a.id} value={a.ascCode}>
              {a.nameAsc} ({a.ascCode})
            </option>
          ))}
        </select>

        <TechniciansTable techs={techs} />
      </div>
    </div>
  );
};

export default AdminPanel;
