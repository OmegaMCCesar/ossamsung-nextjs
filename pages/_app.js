// pages/_app.js

import { UserProvider } from '@/context/UserContext';
// pages/_app.js
import '../styles/globals.css';
import Layout from '../components/Layout';
import Navbar from '@/components/Navbar';
import '../styles/chaoSamg.module.css';

/* export default function MyApp({ Component, pageProps }) {
  return (
    <UserProvider>
      <Navbar />
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </UserProvider>
  );
} */

export default function MyApp({ Component, pageProps }) {
  return (
 <div className="errorcontainer">
  <h1 className="errorcontainerh1">Error 404</h1>
  <p className="errorcontainerp">Esta página no existe o dejó de recibir servicio.</p>
</div>



  );
}

