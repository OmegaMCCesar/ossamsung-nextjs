import Link from 'next/link';
import styles from '../../../styles/admin.module.css';
import TechList from '../tech-list/TechList';

export default function TecnicosPanel() {
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Gestión de Técnicos</h1>
      <div className={styles.subContainer}>
      <div className={styles.sectionTech}>
      <TechList />
       </div> 
       <div>
        <div className={styles.section}>
        <Link href="/admin/tecnicos/ranking" className={styles.link}>
          Ver Ranking Global
        </Link>
      </div>

      <div className={styles.section}>
        <Link href="/admin/tecnicos/cards" className={styles.link}>
          Ver Cards de Técnicos
        </Link>
      </div>

      <div className={styles.section}>
        <Link href="/admin/tecnicos/medallas" className={styles.link}>
          Diseñar Medallas y Niveles
        </Link>
      </div>

      <div className={styles.section}>
        <Link href="/admin/tecnicos/comparador" className={styles.link}>
          Comparador entre Técnicos
        </Link>
      </div>

      <div className={styles.section}>
         <Link href="/admin/new-tech" className={styles.link}>
          Crear Técnico
         </Link>
      </div>

       </div>
        </div>
    </div>
  );
}
