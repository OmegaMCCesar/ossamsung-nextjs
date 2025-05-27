// pages/addEquipsEdit/login.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/init'; // Ajusta la ruta
import { useAuth } from '../../hooks/useAuth'; // Para verificar si ya está logueado

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth(); // Estado de autenticación global

  // Redirigir si el usuario ya está logueado
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/addEquipsEdit'); // Redirige al dashboard principal
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Éxito: el hook useAuth actualizará el estado y el useEffect anterior redirigirá
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      // Firebase errors tienen códigos y mensajes. Puedes personalizarlos.
      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError('Correo electrónico o contraseña incorrectos.');
          break;
        case 'auth/invalid-email':
          setError('Formato de correo electrónico inválido.');
          break;
        default:
          setError('Error al iniciar sesión. Inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || user) {
    // Si ya está cargando la autenticación o ya está logueado,
    // puedes mostrar un spinner o simplemente no renderizar nada mientras redirige.
    return <p>Cargando...</p>;
  }

  return (
    <div>
      <h1>Iniciar Sesión - Panel de Administración</h1>
      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="email">Correo Electrónico:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="password">Contraseña:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;