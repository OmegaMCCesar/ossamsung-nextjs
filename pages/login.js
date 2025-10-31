import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/router';
import styles from '../styles/Login.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err) {
      setError('Credenciales inválidas. Inténtelo de nuevo.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Diagnóstico IA</h1>
        <p className={styles.helper}>Inicia sesión para comenzar</p>

        <form onSubmit={handleLogin} className={styles.form}>
          <label className={styles.label}>Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            placeholder="Dirección de correo electrónico"
            required
          />
          <label className={styles.label}>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            placeholder="Contraseña"
            required
          />
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.remember}>
            <input type="checkbox" id="remember" />
            <label htmlFor="remember">Recordar mi ID</label>
          </div>
          <button type="submit" className={styles.button}>
            Siguiente
          </button>
        </form>
      </div>
    </div>
  );
}
