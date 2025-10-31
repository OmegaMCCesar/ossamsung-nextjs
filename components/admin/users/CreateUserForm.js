import React, { useState } from 'react';
import { useAuth } from '../../../context/UserContext'; // Ajusta la ruta a tu UserContext

const CreateUserForm = () => {
    // Obtenemos el usuario logueado para enviar su UID y validar permisos en el backend
    const { user, loading } = useAuth(); 

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        userName: '',
        role: 'Tecnico', // Valor por defecto
        ascId: '',
        isSubmitting: false,
        message: null,
        isError: false,
    });

    const validRoles = [
        { value: 'TechSupp', label: 'Técnico de Soporte Ingeneria' },
        { value: 'Supervisor', label: 'Supervisor' },
        { value: 'Admin', label: 'Administrador' },
        { value: 'Tecnico', label: 'Técnico' },
        { value: 'Administrativo', label: 'Administrativo' },
    ];

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
            message: null,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (loading || !user) {
            setFormData(prev => ({ ...prev, message: 'Error: Usuario administrador no autenticado.', isError: true }));
            return;
        }

        setFormData(prev => ({ ...prev, isSubmitting: true, message: null }));

        // 1. Preparamos el payload incluyendo el UID del administrador actual
        const payload = {
            email: formData.email,
            password: formData.password,
            userName: formData.userName,
            role: formData.role,
            ascId: formData.ascId || null,
            requestingUserUid: user.uid, // <--- CLAVE DE LA AUTORIZACIÓN
        };

        try {
            const response = await fetch('/api/admin/createUser', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                // Éxito: Limpiar formulario y mostrar mensaje
                setFormData({
                    email: '',
                    password: '',
                    userName: '',
                    role: 'TechSupp',
                    ascId: '',
                    isSubmitting: false,
                    message: `✅ ${data.message}`,
                    isError: false,
                });
            } else {
                // Fallo: Mostrar mensaje de error de la API
                setFormData(prev => ({
                    ...prev,
                    isSubmitting: false,
                    message: `❌ ${data.message || 'Error desconocido al crear el usuario.'}`,
                    isError: true,
                }));
            }
        } catch (error) {
            console.error('Error de red:', error);
            setFormData(prev => ({
                ...prev,
                isSubmitting: false,
                message: '❌ Error de conexión al servidor.',
                isError: true,
            }));
        }
    };

    // Si el usuario no está cargado o no tiene rol de admin, no debería poder ver el formulario
    // (Aunque la redirección en la página principal debe manejar esto)
    if (loading) return <p>Cargando información del administrador...</p>;
    if (user.role !== 'Admin' && user.role !== 'Supervisor') {
        return <p>Acceso denegado. Se requiere un rol de Administrador o Supervisor.</p>;
    }


    return (
        <form onSubmit={handleSubmit} style={formStyle}>
            <h3>Crear Cuenta de Acceso Controlado</h3>

            {/* Mensaje de estado (éxito o error) */}
            {formData.message && (
                <p style={{ ...messageStyle, backgroundColor: formData.isError ? '#fee2e2' : '#d1fae5', color: formData.isError ? '#991b1b' : '#065f46' }}>
                    {formData.message}
                </p>
            )}

            {/* Email */}
            <div style={inputGroupStyle}>
                <label style={labelStyle}>Correo Electrónico:</label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                />
            </div>
            
            {/* Contraseña */}
            <div style={inputGroupStyle}>
                <label style={labelStyle}>Contraseña Temporal (Min 6 chars):</label>
                <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                />
            </div>

            {/* Nombre de Usuario */}
            <div style={inputGroupStyle}>
                <label style={labelStyle}>Nombre (Usuario):</label>
                <input
                    type="text"
                    name="userName"
                    value={formData.userName}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                />
            </div>

            {/* Rol */}
            <div style={inputGroupStyle}>
                <label style={labelStyle}>Asignar Rol:</label>
                <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                >
                    {validRoles.map(role => (
                        <option key={role.value} value={role.value}>
                            {role.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* ASC ID */}
            <div style={inputGroupStyle}>
                <label style={labelStyle}>ID de Centro de Servicio (ASC ID):</label>
                <input
                    type="text"
                    name="ascId"
                    value={formData.ascId}
                    onChange={handleChange}
                    placeholder="Opcional"
                    style={inputStyle}
                />
            </div>

            <button type="submit" disabled={formData.isSubmitting} style={buttonStyle}>
                {formData.isSubmitting ? 'Creando Usuario...' : 'Crear Usuario'}
            </button>
        </form>
    );
};

// --- Estilos Básicos (Para que se vea decente) ---
const formStyle = {
    padding: '30px',
    border: '1px solid #CCC',
    borderRadius: '8px',
    maxWidth: '500px',
    margin: '30px auto',
    backgroundColor: '#f9f9f9'
};

const inputGroupStyle = {
    marginBottom: '15px',
};

const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#333'
};

const inputStyle = {
    width: '100%',
    padding: '10px',
    border: '1px solid #DDD',
    borderRadius: '4px',
    boxSizing: 'border-box'
};

const buttonStyle = {
    width: '100%',
    padding: '12px',
    backgroundColor: '#004A99',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    marginTop: '10px'
};

const messageStyle = {
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '20px',
    fontWeight: 'bold',
    textAlign: 'center'
};

export default CreateUserForm;