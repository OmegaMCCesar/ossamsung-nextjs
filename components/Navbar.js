// components/Navbar.js
import Link from 'next/link';
import { useState } from 'react'; // Importa useState para manejar el estado del menú
import styles from '../styles/Navbar.module.css'; // Importa el módulo CSS

export default function Navbar() {
  // Estado para controlar si el menú móvil está abierto o cerrado
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  console.log(isMenuOpen, 'isMenuOpen');
  
  // Función para alternar el estado del menú
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Función para cerrar el menú al hacer clic en un enlace (mejora la UX en móvil)
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className={styles.navbar}>
      <div className={`container ${styles.navbarContent}`}> {/* Contenedor principal: logo/marca + botón hamburguesa + enlaces */}

        {/* Botón Hamburguesa (visible solo en móvil por CSS) */}
        <button
          className={styles.hamburgerButton}
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"} // Accesibilidad
        >
           {/* Icono de hamburguesa simple con spans */}
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
        </button>

        {/* Contenedor de Enlaces: Se mostrará como menú en móvil (cuando está abierto)
            y como una fila horizontal en desktop por CSS */}
        <div className={`${styles.navLinks} ${isMenuOpen ? styles.menuOpen : ''}`}>

          {/* Todos los enlaces van aquí, ahora dentro de este div */}
          <Link href="/" className={styles.navLink} onClick={closeMenu}>
            Inicio
          </Link>
          <Link href="/acerca" className={styles.navLink} onClick={closeMenu}>
            Acerca
          </Link>
          <Link href="/contacto" className={styles.navLink} onClick={closeMenu}>
            Contacto
          </Link>
          <Link href="/terminos" className={styles.navLink} onClick={closeMenu}>
            Términos
          </Link>
          <Link href="/privacidad" className={styles.navLink} onClick={closeMenu}>
            Privacidad
          </Link>
          <Link href="/aviso_legal" className={styles.navLink} onClick={closeMenu}>
            Aviso Legal
          </Link>
           <Link href="/FaultSearch" className={styles.navLink} onClick={closeMenu}>
            Diagnostico Inteligente
          </Link>
          {/* El enlace de Admin también se incluye en el menú desplegable */}
          {/* Mantenemos la clase navLinkAdmin para sus estilos específicos (. invisible) */}
           <Link href="/admin" className={styles.navLinkAdmin} onClick={closeMenu}>
            Login
          </Link>
        </div>

      </div>
    </nav>
  );
}