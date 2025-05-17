import Link from 'next/link';
import styles from '../styles/aviso_legal.module.css'

function LegalInfo() {
    return (
        // Use the main container class from the module
        <div className={styles.legalContainer}>
            {/* Use the main title class */}
            <h1 className={styles.mainTitle}>Aviso Legal, Derechos de Autor y Políticas</h1>

            {/* Use section classes */}
            <section className={styles.section}>
                {/* Use section title class */}
                <h2 className={styles.sectionTitle}>Responsable del Sitio</h2>
                {/* Use paragraph class */}
                <p className={styles.paragraph}>
                    Esta aplicación es desarrollada y mantenida por <strong>Luis César Muñoz Cervantes</strong> . Todos los derechos reservados.
                </p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Derechos de Autor</h2>
                <p className={styles.paragraph}>
                    Todo el contenido textual, código fuente, diseño y funcionalidades presentes en esta aplicación están protegidos por derechos de autor. Se prohíbe la reproducción total o parcial sin autorización expresa del autor.
                </p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Uso de Imágenes</h2>
                <p className={styles.paragraph}>
                    Algunas imágenes utilizadas en esta aplicación son propiedad de Samsung y se presentan únicamente como referencia visual con fines técnicos y educativos. Esta web no mantiene afiliación, patrocinio ni relación comercial directa con Samsung.
                </p>
                <p className={styles.paragraph}> {/* Apply paragraph class to the second paragraph too */}
                    Si usted es titular de los derechos de alguna imagen y considera que su uso no es adecuado, por favor contáctenos para resolver la situación.
                </p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Nota Técnica y Educativa</h2>
                <p className={styles.paragraph}>
                    Esta aplicación está destinada exclusivamente al aprendizaje y referencia técnica sobre el cierre correcto de las OS de equipos de línea blanca y refrigeración, en apoyo al personal administrativo.
                </p>
            </section>

            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Política de Contacto</h2>
                <p className={styles.paragraph}>
                    Para cualquier reclamación, solicitud de retiro de contenido o consulta legal, por favor escriba a:
                </p>
                {/* Use contact list classes */}
                <ul className={styles.contactList}>
                    <li className={styles.contactItem}><strong>Nombre:</strong> Luis César Muñoz Cervantes</li>
                    <li className={styles.contactItem}><strong>Correo:</strong> luiscesar.munoz.cervantes.upiit@gmail.com</li>
                    <li className={styles.contactItem}><strong>Teléfono:</strong> 56 26 88 57 26</li>
                </ul>
            </section>

            {/* Container to center the back link */}
            <div className={styles.backLinkContainer}>
                 {/* Use the back link button style */}
                <Link href="/" className={styles.backLink}>Volver al inicio</Link>
            </div>

        </div>
    );
}

export default LegalInfo;
