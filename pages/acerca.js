import Layout from "../components/Layout";
import styles from "../styles/acerca.module.css";
import { FiUsers } from "react-icons/fi";

export default function Acerca() {
  return (
    <Layout title="Acerca de LC Muños">
      <section className={styles.heroSection}>
        <div className={styles.overlay}></div>
        <div className={styles.heroContent}>
          <FiUsers className={styles.icon} />
          <h1>Sobre Nosotros</h1>
          <p>
            En LC Muños, impulsamos el conocimiento técnico en línea blanca.
            Ofrecemos soporte especializado y formación práctica para técnicos
            profesionales y nuevos aprendices. Nuestra misión es facilitar el
            diagnóstico y la reparación mediante herramientas digitales,
            aprendizaje guiado y recursos accesibles desde cualquier lugar.
          </p>
        </div>
      </section>

      <section className={styles.valuesSection}>
        <h2>Nuestros Valores</h2>
        <div className={styles.valuesGrid}>
          <div className={styles.valueCard}>
            <img
              src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
              alt="Profesionalismo"
            />
            <h3>Profesionalismo</h3>
            <p>
              Brindamos contenido verificado y actualizado, con enfoque en la
              calidad técnica y el aprendizaje continuo.
            </p>
          </div>
          <div className={styles.valueCard}>
            <img
              src="https://cdn-icons-png.flaticon.com/512/1828/1828884.png"
              alt="Innovación"
            />
            <h3>Innovación</h3>
            <p>
              Desarrollamos herramientas de diagnóstico y formación que integran
              IA y procesos digitales de nueva generación.
            </p>
          </div>
          <div className={styles.valueCard}>
            <img
              src="https://cdn-icons-png.flaticon.com/512/190/190411.png"
              alt="Colaboración"
            />
            <h3>Colaboración</h3>
            <p>
              Conectamos técnicos, centros de servicio y especialistas para
              fortalecer la comunidad de soporte técnico.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
