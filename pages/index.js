import Link from "next/link";
import Layout from "../components/Layout";
import styles from "../styles/index.module.css";

export default function Home() {
  return (
    <Layout title="Inicio - OSSamsung">
      <div className={styles.hero}>
        <div className={styles.overlay}></div>

        <div className={styles.content}>
          <img
            src="https://firebasestorage.googleapis.com/v0/b/samsungcodeclose.firebasestorage.app/o/samsung-group-vector-logo.png?alt=media&token=cb5fa39b-42e0-4a13-b8d8-7fddc46bcb49"
            alt="Logo Samsung"
            className={styles.logo}
          />

          <h1 className={styles.title}>Smart Support para Centros de Servicio</h1>
          <p className={styles.subtitle}>
            Optimiza tus cierres y diagnósticos con herramientas impulsadas por IA.
          </p>

          <div className={styles.buttonContainer}>
            <Link href="/equips" className={styles.startButton}>
              Cierre de Órdenes de Servicio
            </Link>
            <Link href="/diagnosticoPage" className={styles.secondaryButton}>
              Pre Diagnóstico IA
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
