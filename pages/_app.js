// pages/_app.js

import { UserProvider } from '@/context/UserContext';
// pages/_app.js
import '../styles/globals.css';
import { ThemeProvider } from '../components/ThemeProvider';
import Layout from '../components/Layout';
import Navbar from '@/components/Navbar';

export default function MyApp({ Component, pageProps }) {
  return (
    <UserProvider>
    <ThemeProvider>
      <Navbar />
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ThemeProvider>
    </UserProvider>
  );
}
