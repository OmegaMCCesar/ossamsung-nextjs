import InstalationRequisites from "@/components/InstalationRequisites";
import styles from "@/styles/checkIList.module.css"; // 👈 Importar hoja de estilos
import Link from "next/link";

const CheckIList = () => {
  return (
    <div className={`${styles.container} ${styles.fadeIn}`}>
      <h1 className={styles.title}>
        Check List de instalación
      </h1>
      <p className={styles.subTitle}>
        Las imágenes mostradas son solo una referencia de lo necesario.
      </p>
      <Link href="/" className={styles.backButton}> 
        Volver al inicio
      </Link>
      <InstalationRequisites />
    </div>
  );
};

export default CheckIList;
