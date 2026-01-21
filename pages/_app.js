// pages/_app.js

import { UserProvider } from '@/context/UserContext';
// pages/_app.js
import '../styles/globals.css';
import Layout from '../components/Layout';
import Navbar from '@/components/Navbar';
import '../styles/chaoSamg.module.css';

export default function MyApp({ Component, pageProps }) {
  return (
    <UserProvider>
      <Navbar />
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </UserProvider>
  );
} 



