// pages/index.js
import Link from "next/link";
import Layout from "../components/Layout"; // Asumiendo que usas este Layout
import styles from '../styles/index.module.css'; // Importa el módulo CSS

export default function Home() {
  // Si tu Layout se aplica globalmente en _app.js o layout.js, puedes omitir el <Layout> aquí.
  // Si lo usas aquí, asegúrate que el título se pase correctamente.
  return (
    <Layout title="Inicio - OSSamsung">
      {/* Contenedor principal de la página de inicio */}
      <div className={styles.container}>
        {/* Contenedor del Logo */}
        <div className={styles.logoContainer}>
          <img
            src="https://tse4.mm.bing.net/th?id=OIP.Irb0SUESk0MSJiqSt5y3tQHaEf&pid=Api&P=0&h=180" // Tu URL de logo
            alt="Logo Samsung"
            className={styles.logo}
          />
        </div>

        {/* Título Principal */}
        <h1 className={styles.title}>
          Apoyo de cierre de Órdenes de servicio
        </h1>

        {/* Link/Botón de Iniciar */}
        <div className={styles.buttonContainer}>
        <Link
          href={'/equips'}
          className={styles.startButton}
        >
          Cierre de Órdenes de Servicio
        </Link>
        {/* <Link href={'/checkIList'}
        className={styles.startButton} >Check List de Instalacion</Link> */}
        </div>
      </div>
    </Layout>
  );
}