import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { FiUser, FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '@/context/UserContext';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  const toggleMenu = () => setIsMenuOpen(v => !v);
  const closeMenu = () => setIsMenuOpen(false);

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    const handleRoute = () => setIsMenuOpen(false);
    router.events.on('routeChangeStart', handleRoute);
    return () => router.events.off('routeChangeStart', handleRoute);
  }, [router.events]);

  // Manejo de scroll y escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setIsMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    if (isMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const isUserTrue = user?.role || false;

  return (
    <nav className="sticky top-0 z-100 w-full bg-[#0F172A]/80 backdrop-blur-md border-b border-white/5 transition-all">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-16 md:h-20">
        
        {/* LOGO / NOMBRE (Opcional añadir imagen aquí) */}
        <Link href="/" className="text-white font-black italic tracking-tighter text-lg md:text-xl uppercase" onClick={closeMenu}>
          ODS-SAMG <span className="text-blue-500 font-normal not-italic text-xs ml-1">v4.0</span>
        </Link>

        {/* Hamburguesa (móvil) */}
        <button
          className="md:hidden text-white p-2 focus:outline-none"
          onClick={toggleMenu}
          aria-label="Menú"
        >
          {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>

        {/* Enlaces Desktop */}
        <div className="hidden md:flex items-center gap-1">
          <NavLink href="/diagnosticoPage">Diagnóstico IA</NavLink>
          {isUserTrue && <NavLink href="/academy">Academia</NavLink>}
          <NavLink href="/acerca">Acerca</NavLink>
          <NavLink href="/contacto">Contacto</NavLink>
          
          <div className="h-4 w-px bg-white/10 mx-2"></div>
          
          <Link
            href="/admin"
            className="p-2.5 rounded-full bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-lg shadow-blue-900/20 border border-blue-500/20"
            aria-label="Admin"
          >
            <FiUser size={18} />
          </Link>
        </div>

        {/* Menú Móvil (Overlay) */}
        <div 
          className={`fixed inset-0 top-16 bg-[#0F172A] z-90 transition-all duration-300 md:hidden flex flex-col p-6 space-y-4 ${
            isMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'
          }`}
        >
          <MobileNavLink href="/" onClick={closeMenu}>Inicio</MobileNavLink>
          <MobileNavLink href="/diagnosticoPage" onClick={closeMenu}>Pre Diagnóstico IA</MobileNavLink>
          {isUserTrue && <MobileNavLink href="/test_device" onClick={closeMenu}>Nivel de conocimientos</MobileNavLink>}
          <MobileNavLink href="/acerca" onClick={closeMenu}>Acerca</MobileNavLink>
          <MobileNavLink href="/contacto" onClick={closeMenu}>Contacto</MobileNavLink>
          <hr className="border-white/10" />
          <Link href="/admin" onClick={closeMenu} className="flex items-center gap-3 p-4 bg-blue-600 rounded-2xl text-white font-black uppercase text-xs tracking-widest">
            <FiUser size={18} /> Panel de Usuario
          </Link>
        </div>
      </div>
    </nav>
  );
}

// Componentes auxiliares para no repetir estilos
function NavLink({ href, children }) {
  return (
    <Link 
      href={href} 
      className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ href, children, onClick }) {
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className="p-4 text-sm font-black uppercase tracking-[0.2em] text-slate-300 border-b border-white/5 hover:bg-white/5 transition-all"
    >
      {children}
    </Link>
  );
}