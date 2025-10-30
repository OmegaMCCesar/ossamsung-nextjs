// pages/admin/createUserPage.js (Nueva página)
import CreateUserForm from '../../components/admin/users/CreateUserForm'; // Componente que contendrá el formulario

// Opcional: Proteger esta página también con useAuth() si no lo haces en el componente padre
// ...

export default function CreateUserPage() {
    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h2>Gestión de Usuarios</h2>
            <p>Crear nueva cuenta de Técnico o Supervisor.</p>
            <CreateUserForm /> 
        </div>
    );
}