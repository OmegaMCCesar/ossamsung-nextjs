// pages/api/admin/createUser.js

export default async function handler(req, res) {
  // Envolver todo en un try/catch global para que NUNCA devuelva HTML de error
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Método no permitido' });
    }

    // Importar firebase-admin / tu singleton en tiempo de ejecución (evita bundling del cliente)
    // Nota: require aquí evita que Next intente resolver esto en el bundle cliente.
    const admin = require('../../../lib/firebaseAdmin');

    // Comprobación defensiva: asegurarnos que el SDK esté disponible e inicializado
    if (!admin || !admin.auth || !admin.firestore) {
      console.error('Firebase Admin no está inicializado correctamente. admin:', !!admin);
      return res.status(500).json({
        message: 'Error de servidor: Firebase Admin no inicializado.',
        // En dev es útil devolver más detalle
        detail: process.env.NODE_ENV !== 'production' ? 'admin.auth o admin.firestore no disponibles' : undefined
      });
    }

    // Extraer body
    const { email, password, role, userName, ascId, requestingUserUid } = req.body;

    // --- 2. Validación de Datos ---
    if (!email || !password || !role || !userName) {
      return res.status(400).json({ message: 'Faltan campos obligatorios (email, password, role, userName).' });
    }

    // Validar roles permitidos (normalizar a la forma que uses en Firestore)
    const validRoles = ['ADMIN', 'Tecnico', 'Administrativo', 'Supervisor', 'TechSupp'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'El rol asignado no es válido.' });
    }

    // --- 3. Verificación de Autorización ---
    if (!requestingUserUid) {
      return res.status(401).json({ message: 'UID del administrador solicitante no proporcionado.' });
    }

    try {
      const adminDocRef = admin.firestore().collection('users').doc(requestingUserUid);
      const adminDocSnapshot = await adminDocRef.get();

      // CORRECCIÓN: exists es propiedad booleana, no función
      if (!adminDocSnapshot.exists) {
        return res.status(403).json({ message: 'Usuario solicitante no encontrado o no autorizado.' });
      }

      const requesterRole = adminDocSnapshot.data().role;

      // Ajusta estos roles según lo que guardes en tu base de datos (coincidir mayúsculas/minúsculas)
      const adminRoles = ['ADMIN', 'Supervisor']; // roles permitidos para crear usuarios
      if (!adminRoles.includes(requesterRole)) {
        return res.status(403).json({
          message: 'Permiso denegado. Solo roles con privilegios pueden crear usuarios.'
        });
      }
    } catch (err) {
      console.error('Error verificando permisos (Firestore):', err);
      return res.status(500).json({
        message: 'Error interno al verificar permisos.',
        detail: process.env.NODE_ENV !== 'production' ? err.message : undefined
      });
    }

    // --- 4. Creación del Usuario en Firebase Auth ---
    try {
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: userName,
        emailVerified: true,
      });

      const uid = userRecord.uid;

      // --- 5. Asignación de Rol y Metadata en Firestore ---
      await admin.firestore().collection('users').doc(uid).set({
        email,
        role,
        userName,
        ascId: ascId || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.status(201).json({
        message: `Usuario ${userName} (${role}) creado con éxito.`,
        uid,
        role
      });
    } catch (error) {
      console.error('Error al crear usuario:', error);

      // Mapear algunos errores conocidos a mensajes de cliente
      let clientMessage = 'Fallo al crear usuario.';
      if (error.code === 'auth/email-already-exists') {
        clientMessage = 'El correo electrónico ya está registrado.';
        return res.status(409).json({ message: clientMessage });
      }
      if (error.code === 'auth/weak-password') {
        clientMessage = 'La contraseña debe tener al menos 6 caracteres.';
        return res.status(400).json({ message: clientMessage });
      }

      // Otros errores inesperados
      return res.status(500).json({
        message: 'Error interno al crear usuario.',
        detail: process.env.NODE_ENV !== 'production' ? error.message : undefined
      });
    }
  } catch (unhandledErr) {
    // Catch global por si algo inesperado escapó
    console.error('Unhandled error en /api/admin/createUser:', unhandledErr);
    return res.status(500).json({
      message: 'Error interno del servidor.',
      detail: process.env.NODE_ENV !== 'production' ? unhandledErr.message : undefined
    });
  }
}
