// pages/_document.js
import Navbar from "@/components/Navbar";
import { Html, Head, Main, NextScript } from "next/document";

const noFlashScript = `
(function() {
  try {
    var root = document.documentElement;
    var saved = localStorage.getItem('theme'); // 'dark'|'light'|'system'|null
    if (saved === 'dark') { root.classList.add('dark'); root.classList.remove('light'); }
    else if (saved === 'light') { root.classList.add('light'); root.classList.remove('dark'); }
    else { root.classList.remove('dark','light'); } // system
  } catch (e) {}
})();
`;

export default function Document() {
  return (
    <Html lang="es" suppressHydrationWarning>
      <Head>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4497215621533514"
     crossorigin="anonymous"></script>
        <meta name="color-scheme" content="dark light" />
        <meta name="google-adsense-account" content="ca-pub-4497215621533514" />
        <link rel="icon" href="/logo.ico" />
        <meta name="description" content="App cierres ods" />
      </Head>
      <body className="antialiased">
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
        <Main />
             
        <NextScript />
      </body>
    </Html>
  );
}
