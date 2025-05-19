// pages/_app.js

import { UserProvider } from '@/context/UserContext';
import '../styles/globals.css';
import { useRouter } from 'next/router';


function MyApp({ Component, pageProps }) {

  return (
    <UserProvider>
      {/* Renderiza el componente de la página actual */}
      <Component {...pageProps} />
    </UserProvider>
  );
}

export default MyApp;