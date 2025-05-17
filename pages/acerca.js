import Layout from "../components/Layout";
import styles from "../styles/acerca.module.css"
// import styles from './Acerca.module.css';

export default function Acerca() {
  return (
    <Layout title="Acerca de LC Munios">
      {/* Usa la clase importada del módulo CSS */}
      <div className={styles.acercaPageContent}>

        <h1>Sobre Nosotros</h1>
        <p>
          En LC Munios, nos dedicamos a proporcionar soporte técnico y educativo en
          línea blanca. Nuestro objetivo es ayudar a técnicos
          profesionales y nuevos aprendices a mejorar sus habilidades, ofreciendo guías detalladas de
          diagnóstico y reparación.
        </p>
      </div>
    </Layout>
  );
}