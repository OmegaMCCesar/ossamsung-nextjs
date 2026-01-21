import React from "react";
import styles from "../../styles/AdminPanel.module.css";

const getRAStatus = (raExpiration) => {
  if (!raExpiration) return "Sin Fecha";

  const today = new Date();
  const exp = raExpiration.toDate();
  const diff = (exp - today) / (1000 * 60 * 60 * 24);

  if (diff <= 0) return "Vencido";
  if (diff <= 5) return "Por Vencer";
  return "Vigente";
};

const TechniciansTable = ({ techs }) => {
  return (
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
        {techs.map(tech => {
          const status = getRAStatus(tech.raExpiration);

          return (
            <tr key={tech.id}>
              <td>{tech.userName}</td>
              <td>{tech.asc}</td>
              <td>
                <span className={`${styles.statusBadge} ${styles[status]}`}>
                  {status}
                </span>
              </td>
              <td>
                {tech.raExpiration
                  ? tech.raExpiration.toDate().toLocaleDateString("es-MX")
                  : "-"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default TechniciansTable;
