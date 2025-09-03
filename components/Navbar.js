// components/Navbar.js
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTheme } from '../components/ThemeProvider'; // ⬅️ del provider que te di
import styles from '../styles/Navbar.module.css';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const toggleMenu = () => setIsMenuOpen(v => !v);
  const closeMenu = () => setIsMenuOpen(false);

  // Cerrar al cambiar de ruta
  useEffect(() => {
    const handleRoute = () => setIsMenuOpen(false);
    router.events.on('routeChangeStart', handleRoute);
    return () => router.events.off('routeChangeStart', handleRoute);
  }, [router.events]);

  // Cerrar con ESC y bloquear scroll en móvil cuando está abierto
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setIsMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  return (
    <nav className={styles.navbar}>
      <div className={`container ${styles.navbarContent}`}>
        {/* (Opcional) Marca a la izquierda */}
        {/* <div className={styles.navbarBrand}>
          <Link href="/" className={styles.brandLink}>OSSamsung</Link>
        </div> */}

        {/* Botón de tema (siempre visible) */}
        <button
          className={styles.themeButton}
          onClick={toggleTheme}
          aria-label={`Cambiar tema (actual: ${theme})`}
          title={`Tema: ${theme}`}
        >
          {theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '🖥'}
        </button>

        {/* Hamburguesa (solo móvil por CSS) */}
        <button
          className={styles.hamburgerButton}
          onClick={toggleMenu}
          aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={isMenuOpen}
          aria-controls="main-navlinks"
        >
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
        </button>

        {/* Enlaces */}
        <div
          id="main-navlinks"
          className={`${styles.navLinks} ${isMenuOpen ? styles.menuOpen : ''}`}
        >
          <Link href="/" className={styles.navLink} onClick={closeMenu}>Inicio</Link>
          <Link href="/acerca" className={styles.navLink} onClick={closeMenu}>Acerca</Link>
          <Link href="/contacto" className={styles.navLink} onClick={closeMenu}>Contacto</Link>
          <Link href="/terminos" className={styles.navLink} onClick={closeMenu}>Términos</Link>
          <Link href="/privacidad" className={styles.navLink} onClick={closeMenu}>Privacidad</Link>
          <Link href="/aviso_legal" className={styles.navLink} onClick={closeMenu}>Aviso Legal</Link>
          <Link href="/FaultSearch" className={styles.navLink} onClick={closeMenu}>Pre Diagnóstico</Link>
          <Link href="/admin" className={styles.navLinkAdmin} onClick={closeMenu}>Login</Link>
        </div>
      </div>

      {/* Backdrop para cerrar tocando fuera (móvil) */}
      {isMenuOpen && <div className={styles.backdrop} onClick={closeMenu} />}
    </nav>
  );
}
