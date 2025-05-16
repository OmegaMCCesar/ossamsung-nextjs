// pages/_app.js

import { UserProvider } from '@/context/UserContext'; // 1. Importa tu UserProvider
import '../styles/globals.css'; // 2. Importa tus estilos globales (ajusta la ruta si es necesario)

// 3. Define el componente principal que recibe Component y pageProps
function MyApp({ Component, pageProps }) {
  // 4. Envuelve TODO con el UserProvider
  return (
    <UserProvider>
      {/* 5. Renderiza el componente de la página actual que Next.js te pasa */}
      <Component {...pageProps} />
    </UserProvider>
  );
}

// 6. Exporta el componente principal
export default MyApp;