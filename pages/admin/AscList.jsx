import React from "react";
import styles from "../../styles/AdminPanel.module.css";

const AscList = ({ ascs = [] }) => {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>ASC Registrados</h3>

      <ul className={styles.ascList}>
        {ascs.map(asc => (
          <li key={asc.id}>
            <strong>{asc.nameAsc}</strong> — {asc.ascCode} ({asc.area})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AscList;
