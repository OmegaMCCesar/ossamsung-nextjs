// components/Layout.js
import Head from "next/head";
import Navbar from "./Navbar"; // Asegúrate que la ruta a Navbar.js sea correcta
import styles from '../styles/Layout.module.css'; // Importa el módulo CSS

export default function Layout({ title, children }) {
  const effectiveTitle = title || "OSSamsung Cierres"; // Usamos un título por defecto consistente

  return (
    // Contenedor principal del layout: usa la clase del módulo
    <div className={styles.layoutWrapper}>
      <Head>
        <title>{effectiveTitle}</title>
        <meta name="description" content="Soporte técnico Samsung y guías de cierre de ordenes de servicio." />
        <link rel="icon" href="/logo.ico" /> {/* Asegúrate de tener un favicon.ico en tu carpeta public */}
        {/* Meta tags adicionales recomendadas, ya están en CSS estándar o HTML */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#111827" media="(prefers-color-scheme: dark)" />
        {/* Las meta tags no usan clases CSS, se mantienen igual */}
      </Head>

      {/* Navbar se renderiza aquí, sus estilos están en Navbar.module.css */}
      <Navbar />

      {/* Área de contenido principal */}
      {/* Mantenemos la clase global 'container' para centrar y ancho máximo */}
      {/* Añadimos la clase del módulo para flex-grow y el padding vertical/horizontal */}
      <main className={`container ${styles.mainContent}`}>
      {/* Si NO definiste .container globalmente, usa solo la clase del módulo:
      <main className={styles.mainContent}> */}
        {children} {/* Aquí se renderiza el contenido de cada página */}
      </main>

      {/* Footer: usa la clase del módulo */}
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} OSSamsung Cierres. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}