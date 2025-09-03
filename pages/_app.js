// pages/_app.js

import { UserProvider } from '@/context/UserContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import '../styles/globals.css';
import Layout from '@/components/Layout';



function MyApp({ Component, pageProps }) {

  return (
    <UserProvider>
      <ThemeProvider>
        <Layout>
      {/* Renderiza el componente de la página actual */}
      <Component {...pageProps} />
      </Layout>
      </ThemeProvider>
    </UserProvider>
  );
}

export default MyApp;