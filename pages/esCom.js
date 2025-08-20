import RefrigeratorLookup from "../components/RefrigeratorLookup";
import Link from "next/link";
import styles from '../styles/equips.module.css'; // Asegúrate de que la ruta sea correcta

const esComp = () => {
    return (
        <div>
        <Link href="/equips" className={styles.volverButton}>Volver a la página cierres ODS</Link>
        <RefrigeratorLookup />
        </div>
    )
}

export default esComp;