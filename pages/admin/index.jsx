import { useAuth } from '@/context/UserContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';

// Componentes
import AgregarRequisito from '@/components/admin/usersAutorization/AgregarRequisito';
import AgregarModelo from '@/components/admin/usersAutorization/AgregarModelo';
import AddPartsForm from '@/components/admin/AddPartsForm';
import ServiceBulletinForm from '@/components/admin/ServiceBulletinForm';
import AcademyManager from '@/components/admin/AcademyManager'; 

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading || !user) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <p className="text-lg font-medium animate-pulse text-gray-600">Cargando panel...</p>
    </div>
  );

  const isAdmin = user.role === "Admin";

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased text-slate-900">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        
        {/* HEADER */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
              {isAdmin ? "Panel de Control Master" : "Panel de Usuario"}
            </h1>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              <p className="text-slate-500 font-medium text-sm">Sesión activa: {user.userName || user.email}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/" className="px-5 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-2xl hover:bg-slate-50 hover:border-slate-400 transition-all active:scale-95">
              Inicio
            </Link>
            <button onClick={handleLogout} className="px-5 py-2.5 text-sm font-bold text-white bg-rose-600 rounded-2xl hover:bg-rose-700 shadow-md shadow-rose-200 transition-all active:scale-95">
              Cerrar sesión
            </button>
          </div>
        </header>

        {isAdmin ? (
          <div className="space-y-8">
            
            {/* GRID DE ACCESOS RÁPIDOS */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { title: "Gestión de Técnicos", desc: "Autorizar y revisar staff", href: "/admin/tecnicos", color: "hover:border-indigo-500" },
                { title: "Gestión de Equipos", desc: "Modelos y categorías", href: "/addEquipsEdit", color: "hover:border-blue-500" },
                { title: "Panel Diagnóstico", desc: "Monitor de IA Axiom", href: "/dashboard", color: "hover:border-emerald-500" },
                { title: "ASC Info", desc: "Centros autorizados", href: "/addAscInfo", color: "hover:border-amber-500" }
              ].map((card, i) => (
                <Link key={i} href={card.href} className={`block p-6 bg-white rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 group ${card.color}`}>
                  <h3 className="font-black text-slate-800 group-hover:text-indigo-600 transition-colors mb-1">{card.title}</h3>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{card.desc}</p>
                </Link>
              ))}
            </section>

            {/* ACADEMY MANAGER (Sección Destacada) */}
            <section className="bg-white rounded-4xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
               <div className="p-1">
                 <AcademyManager />
               </div>
            </section>

            {/* FORMULARIOS TÉCNICOS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-4xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-10 w-1 bg-indigo-600 rounded-full"></div>
                  <h3 className="text-xl font-black text-slate-800">Inventario y Boletines</h3>
                </div>
                <div className="space-y-8">
                  <AddPartsForm />
                  <div className="h-px bg-slate-100"></div>
                  <ServiceBulletinForm />
                </div>
              </div>

              <div className="bg-white p-8 rounded-4xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-10 w-1 bg-emerald-600 rounded-full"></div>
                  <h3 className="text-xl font-black text-slate-800">Requisitos y Modelos</h3>
                </div>
                <div className="space-y-8">
                  <AgregarRequisito />
                  <div className="h-px bg-slate-100"></div>
                  <AgregarModelo />
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="bg-white p-12 rounded-4xl shadow-2xl shadow-slate-200 border border-slate-200 text-center max-w-2xl mx-auto">
            <div className="mb-6 inline-flex p-4 bg-rose-50 text-rose-600 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m10-4l-1.07-3.21a2 2 0 00-1.89-1.37H4.96a2 2 0 00-1.89 1.37L2 11h12m0 0h8m-8 0v6a2 2 0 002 2h2a2 2 0 002-2v-6z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Acceso Restringido</h2>
            <p className="text-slate-500 mb-8 font-medium text-lg">No tienes permisos para visualizar el Panel Master.</p>
            <Link href="/perfil" className="inline-block bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-300">
              Ir a Mi Perfil
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}