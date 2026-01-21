// pages/admin/new-tech.jsx

import { useState } from "react";
import { db, adminAuth } from "../../lib/firebase"; // <-- adminAuth en lugar de auth
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDocs, collection, query, where } from "firebase/firestore";
import styles from "../../styles/NewTech.module.css";

export default function NewTech() {
  const [form, setForm] = useState({
    userName: "",
    alias: "",
    asc: "",
    bp: "",
    email: "",
    password: "",
    avatar: "default1",
  });

  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const createTech = async () => {
    try {
      setLoading(true);
      setOk("");

      // ---------------------------
      // VALIDACIONES
      // ---------------------------
      if (form.asc.length < 7) {
        setOk("El ASC debe tener al menos 7 dígitos.");
        setLoading(false);
        return;
      }

      if (form.bp.length < 10) {
        setOk("El BP debe tener al menos 10 dígitos.");
        setLoading(false);
        return;
      }

      // Validar BP único
      const qBP = query(
        collection(db, "technicians"),
        where("bp", "==", form.bp)
      );
      const existingBP = await getDocs(qBP);
      if (!existingBP.empty) {
        setOk("Error: Ya existe un técnico con ese BP.");
        setLoading(false);
        return;
      }

      // ---------------------------
      // CREAR USER SIN CERRAR SESIÓN DEL ADMIN
      // ---------------------------
      const userCred = await createUserWithEmailAndPassword(
        adminAuth,             // <--- EN VEZ DE "auth"
        form.email,
        form.password
      );

      const uid = userCred.user.uid;

      // ---------------------------
      // OBJETO DEL TÉCNICO
      // ---------------------------
      const techData = {
        uid,
        userName: form.userName,
        alias: form.alias,
        asc: form.asc,
        bp: form.bp,
        avatar: form.avatar,
        email: form.email,
        createdAt: new Date(),
        role: "Tecnico",

        level: 1,
        xp: 0,

        skills: {
          refrigeracion: { level: 0, xp: 0, tests: 0 },
          lavadoras: { level: 0, xp: 0, tests: 0 },
          secadoras: { level: 0, xp: 0, tests: 0 },
          estufas: { level: 0, xp: 0, tests: 0 },
          electronica: { level: 0, xp: 0, tests: 0 },
          electricidad: { level: 0, xp: 0, tests: 0 },
          mecanica: { level: 0, xp: 0, tests: 0 },
          instalaciones: { level: 0, xp: 0, tests: 0 },
        },

        examHistory: [],
        medals: [],
        rankingScore: 0,
      };

      // ---------------------------
      // GUARDAR EN technicians
      // ---------------------------
      await setDoc(doc(db, "technicians", uid), techData);

      // ---------------------------
      // GUARDAR EN users
      // ---------------------------
      await setDoc(doc(db, "users", uid), techData, { merge: true });

      setOk("Técnico creado exitosamente.");

      // limpiar formulario
      setForm({
        userName: "",
        alias: "",
        asc: "",
        bp: "",
        email: "",
        password: "",
        avatar: "default1",
      });

    } catch (e) {
      console.error(e);
      setOk("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Registrar Técnico</h2>

      <input className={styles.input} name="userName" placeholder="Nombre"
        onChange={handleChange} value={form.userName} />
      <input className={styles.input} name="alias" placeholder="Alias (visible públicamente)"
        onChange={handleChange} value={form.alias} />
      <input className={styles.input} name="asc" placeholder="ASC"
        onChange={handleChange} value={form.asc} />
      <input className={styles.input} name="bp" placeholder="BP (código ingeniero)"
        onChange={handleChange} value={form.bp} />
      <input className={styles.input} name="email" placeholder="Correo"
        onChange={handleChange} value={form.email} />
      <input className={styles.input} type="password" name="password" placeholder="Contraseña"
        onChange={handleChange} value={form.password} />

      <label>Avatar</label>
      <select className={styles.select} name="avatar"
        onChange={handleChange} value={form.avatar}>
        <option value="default1">Avatar 1</option>
        <option value="default2">Avatar 2</option>
        <option value="default3">Avatar 3</option>
      </select>

      <button className={styles.button} onClick={createTech} disabled={loading}>
        {loading ? "Guardando..." : "Crear Técnico"}
      </button>

      {ok && <p className={styles.msg}>{ok}</p>}
    </div>
  );
}
