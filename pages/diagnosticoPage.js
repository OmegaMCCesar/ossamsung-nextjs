// app/diagnostico/page.jsx

import AdvancedDiagnosisForm from '../components/AdvancedDiagnosisForm';

// Componente de página
export default function DiagnosticoPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 flex justify-center">
      <div className="w-full max-w-2xl">
        {/*
          Aquí se renderiza el componente. 
          Este componente gestiona el estado, el formulario y la llamada al API Route.
        */}
        <AdvancedDiagnosisForm />
      </div>
    </main>
  );
}