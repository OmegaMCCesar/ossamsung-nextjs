import { Html, Head, Main, NextScript } from "next/document";

// Aplica el tema guardado en localStorage ANTES de que React hidrate (evita flash)
const noFlashScript = `
(function() {
  try {
    var root = document.documentElement; // <html>
    var saved = localStorage.getItem('theme'); // 'dark' | 'light' | 'system' | null

    if (saved === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (saved === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      // 'system' o null -> deja que el @media (prefers-color-scheme) gobierne
      root.classList.remove('dark', 'light');
    }
  } catch (e) { /* no-op */ }
})();
`;

export default function Document() {
  return (
    <Html lang="es" suppressHydrationWarning>
      <Head>
        {/* Indica al navegador que soportas ambos esquemas (ajusta formularios/controles nativos) */}
        <meta name="color-scheme" content="dark light" />

        <meta name="google-adsense-account" content="ca-pub-4497215621533514" />
        <link rel="icon" href="/logo.ico" />
        <meta name="description" content="App cierres ods" />
      </Head>
      <body className="antialiased">
        {/* Inyecta el script ANTES del contenido para evitar el “flash” de tema */}
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
