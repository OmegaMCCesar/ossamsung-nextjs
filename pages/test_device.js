import ExamScreen from "../components/ExamModule/ExamScreen";
import { useAuth } from "@/context/UserContext";
import { useRouter } from "next/router";
import { useEffect } from "react";

const TestDevice = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg font-semibold">Cargando sesión...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Prueba técnica de conocimientos</h1>
        <p className="text-sm text-gray-500">Bienvenido, {user.userName || user.email}</p>
      </header>

      <hr className="mb-8 border-t border-gray-200" />

      <ExamScreen 
        user={{
          id: user.uid || user.id || "no-id",
          name: user.userName || "Usuario",
          email: user.email || "",
          role: user.role || "Técnico",
          bp: user.bp || "",
          asc: user.asc || "",
        }} 
      />
    </div>
  );
};

export default TestDevice;