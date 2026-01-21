import React, { useState } from "react";
import styles from "../../styles/AdminPanel.module.css";
import { createAsc } from "../../lib/services/adminService";

const AscForm = ({ onSaved }) => {
  const [ascData, setAscData] = useState({
    nameAsc: "",
    ascCode: "",
    area: "",
    contact: "",
    email: "",
    tels: [""]
  });

  const handleChange = (field, value) => {
    setAscData(prev => ({ ...prev, [field]: value }));
  };

  const handleTelChange = (index, value) => {
    const newTels = [...ascData.tels];
    newTels[index] = value;
    setAscData(prev => ({ ...prev, tels: newTels }));
  };

  const addTel = () => {
    setAscData(prev => ({ ...prev, tels: [...prev.tels, ""] }));
  };

  const removeTel = (index) => {
    const newTels = ascData.tels.filter((_, i) => i !== index);
    setAscData(prev => ({ ...prev, tels: newTels }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await createAsc({
        ...ascData,
        tels: ascData.tels.filter(t => t.trim() !== "")
      });

      alert("ASC registrado con éxito");

      setAscData({
        nameAsc: "",
        ascCode: "",
        area: "",
        contact: "",
        email: "",
        tels: [""]
      });

      onSaved();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Registrar Nuevo ASC</h2>

      <form className={styles.gridForm} onSubmit={handleSubmit}>
        <input
          className={styles.input}
          placeholder="Nombre ASC"
          value={ascData.nameAsc}
          onChange={e => handleChange("nameAsc", e.target.value)}
          required
        />

        <input
          className={styles.input}
          placeholder="Código ASC"
          value={ascData.ascCode}
          onChange={e => handleChange("ascCode", e.target.value)}
          required
        />

        <input
          className={styles.input}
          placeholder="Área"
          value={ascData.area}
          onChange={e => handleChange("area", e.target.value)}
        />

        <input
          className={styles.input}
          placeholder="Contacto Principal"
          value={ascData.contact}
          onChange={e => handleChange("contact", e.target.value)}
        />

        <input
          className={styles.input}
          type="email"
          placeholder="Email"
          value={ascData.email}
          onChange={e => handleChange("email", e.target.value)}
        />

        {/* TELÉFONOS DINÁMICOS */}
        <div className={styles.telGroup}>
          <label className={styles.label}>Teléfonos</label>

          {ascData.tels.map((tel, index) => (
            <div key={index} className={styles.telRow}>
              <input
                className={styles.input}
                placeholder={`Teléfono ${index + 1}`}
                value={tel}
                onChange={e => handleTelChange(index, e.target.value)}
              />

              {ascData.tels.length > 1 && (
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeTel(index)}
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            className={styles.addBtn}
            onClick={addTel}
          >
            + Agregar teléfono
          </button>
        </div>

        <button className={styles.submitBtn} type="submit">
          Guardar ASC
        </button>
      </form>
    </div>
  );
};

export default AscForm;
