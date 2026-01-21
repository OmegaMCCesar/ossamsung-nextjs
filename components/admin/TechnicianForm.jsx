import React, { useState } from "react";
import styles from "../../styles/AdminPanel.module.css";
import { createTechnician } from "../../pages/services/adminService";

const TechnicianForm = ({ ascs, onSaved }) => {
  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    asc: "",
    bp: "",
    raExpiration: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await createTechnician({
        ...formData,
        raExpiration: formData.raExpiration
          ? new Date(formData.raExpiration)
          : null
      });

      alert("Técnico registrado correctamente");
      setFormData({
        userName: "",
        email: "",
        asc: "",
        bp: "",
        raExpiration: ""
      });

      onSaved();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Registrar Técnico a ASC</h2>
      <h3 className={styles.subtitle}>Ingrese los datos solicitados</h3>

      <form className={styles.gridForm} onSubmit={handleSubmit}>
        <input
          className={styles.input}
          placeholder="Nombre del Técnico"
          value={formData.userName}
          onChange={e => setFormData({ ...formData, userName: e.target.value })}
          required
        />

        <input
          className={styles.input}
          placeholder="Email"
          value={formData.email}
          onChange={e => setFormData({ ...formData, email: e.target.value })}
        />

        <select
          className={styles.input}
          value={formData.asc}
          onChange={e => setFormData({ ...formData, asc: e.target.value })}
          required
        >
          <option value="">Selecciona ASC</option>
          {ascs.map(a => (
            <option key={a.id} value={a.ascCode}>
              {a.nameAsc} ({a.ascCode})
            </option>
          ))}
        </select>

        <input
          className={styles.input}
          placeholder="BP"
          value={formData.bp}
          onChange={e => setFormData({ ...formData, bp: e.target.value })}
        />

        <input
          type="date"
          className={styles.input}
          value={formData.raExpiration}
          onChange={e =>
            setFormData({ ...formData, raExpiration: e.target.value })
          }
        />

        <button className={styles.submitBtn} type="submit">
          Guardar Técnico
        </button>
      </form>
    </div>
  );
};

export default TechnicianForm;
