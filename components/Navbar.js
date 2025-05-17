// components/Navbar.js
import Link from 'next/link';
import styles from '../styles/Navbar.module.css'; // Importa el módulo CSS

export default function Navbar() {
  // Si usas next-themes, puedes obtener el tema actual si lo necesitas para lógica JS
  // const { theme, setTheme } = useTheme();

  return (
    // <nav> principal: usa la clase del módulo
    <nav className={styles.navbar}>
      {/* Contenedor global para centrar y limitar el ancho */}
      {/* Añadimos una clase del módulo para el contenido interno (flex, altura) */}
      {/* Mantenemos la clase 'container' global si la definiste en globals.css */}
      <div className={`container ${styles.navbarContent}`}>
      {/* Si NO definiste .container en globals.css, usa solo la clase del módulo:
      <div className={styles.navbarContent}> */}


        {/* Grupo de enlaces principales (izquierda) */}
        <div className={styles.navbarNavLeft}>
          {/* Cada Link usa la clase general de enlace del módulo */}
          <Link href="/" className={styles.navLink}>
            Inicio
          </Link>
          <Link href="/acerca" className={styles.navLink}>
            Acerca
          </Link>
          <Link href="/contacto" className={styles.navLink}>
            Contacto
          </Link>
          {/* Estos enlaces usan la clase para ocultar/mostrar */}
          <Link href="/terminos" className={styles.navLink}>
            Términos
          </Link>
          <Link href="/privacidad" className={styles.navLink}>
            Privacidad
          </Link>
          <Link href="/aviso_legal" className={styles.navLink}>
            Aviso Legal
          </Link>
        </div>

        {/* Grupo de elementos a la derecha (Admin y ThemeSwitcher) */}
        <div className={styles.navbarNavRight}>
          {/* El enlace de Admin usa la clase general de enlace */}
          <Link href="/admin" className={styles.navLinkAdmin}>
            .
          </Link>
          {/* Si tuvieras un ThemeSwitcher, lo pondrías aquí.
              Podría necesitar sus propios estilos o usar clases globales/utilidades.
              <ThemeSwitcher />
          */}
        </div>

      </div>
    </nav>
  );
}