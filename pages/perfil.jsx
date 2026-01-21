import { useAuth } from "@/context/UserContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import styles from "@/styles/Profile.module.css";

export default function Perfil() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [techData, setTechData] = useState(null);
  const [loadingTech, setLoadingTech] = useState(true);

  // Redirige si no hay usuario
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user]);

  // Carga datos del técnico desde Firestore
  useEffect(() => {
    const fetchTech = async () => {
      if (!user?.uid) return;

      try {
        const ref = doc(db, "technicians", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setTechData(snap.data());
        }
      } catch (e) {
        console.error("Error cargando técnico:", e);
      } finally {
        setLoadingTech(false);
      }
    };

    fetchTech();
  }, [user]);

  if (loading || !user) return <p className={styles.loading}>Cargando...</p>;

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  const isAdmin = user.role === "admin";

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Mi Perfil</h1>

      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Información general</h2>

        <p><strong>Correo:</strong> {user.email}</p>
        <p><strong>Rol:</strong> {user.role}</p>

        {techData && (
          <>
            <p><strong>Nombre:</strong> {techData.name}</p>
            <p><strong>Alias:</strong> {techData.alias}</p>
            <p><strong>ASC:</strong> {techData.asc}</p>
            <p><strong>BP:</strong> {techData.bp}</p>

            <div className={styles.avatarBox}>
              <img
                src={`/avatars/avatarSamg.png`}
                alt="avatar"
                className={styles.avatar}
              />
            </div>

            {/* Progreso */}
            <h2 className={styles.sectionTitle}>Progreso</h2>
            <p><strong>Nivel:</strong> {techData.level || "Sin nivel asignado"}</p>
            <p><strong>Experiencia:</strong> {techData.experience || 0} XP</p>

            {/* Medallas */}
            <h2 className={styles.sectionTitle}>Medallas</h2>
            <div className={styles.medallasBox}>
              {techData.medallas?.length > 0
                ? techData.medallas.map((m, i) => (
                    <span key={i} className={styles.medalla}>
                      🥇 {m}
                    </span>
                  ))
                : <p>Aún no tienes medallas.</p>}
            </div>

            {/* Exámenes */}
            <h2 className={styles.sectionTitle}>Exámenes</h2>
            <p>{techData.examStatus || "Sin historial todavía"}</p>
          </>
        )}
      </div>

      {/* Opciones de administración solo para admin */}
      {isAdmin && (
        <div className={styles.adminBox}>
          <h2 className={styles.sectionTitle}>Administración</h2>

          <button
            className={styles.adminButton}
            onClick={() => router.push("/admin")}
          >
            Ir al Panel de Administración
          </button>
        </div>
      )}

      <button onClick={handleLogout} className={styles.logoutButton}>
        Cerrar sesión
      </button>
    </div>
  );
}
