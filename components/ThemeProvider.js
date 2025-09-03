// components/ThemeProvider.js
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext({ theme: 'system', setTheme: () => {}, toggleTheme: () => {} });

function applyTheme(theme) {
  const root = document.documentElement; // <html>
  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else if (theme === 'light') {
    root.classList.add('light');
    root.classList.remove('dark');
  } else {
    // system
    root.classList.remove('dark', 'light');
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('system'); // 'light' | 'dark' | 'system'

  // Establecer desde localStorage o sistema en primer render
  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme') || 'system';
      setThemeState(saved);
      applyTheme(saved);
    } catch {
      // no-op
    }

    // Sincronizar si el sistema cambia (sólo cuando estamos en "system")
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const t = localStorage.getItem('theme') || 'system';
      if (t === 'system') applyTheme('system'); // quitar clases para que el @media gobierne
    };
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  const setTheme = useCallback((next) => {
    setThemeState(next);
    try {
      localStorage.setItem('theme', next);
    } catch {}
    applyTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : prev === 'light' ? 'system' : 'dark'));
  }, [setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
