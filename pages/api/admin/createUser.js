// pages/api/admin/createUser.js

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Método no permitido' });
    }

    // Importación correcta
    const { auth, db, FieldValue } = require('@/lib/firebaseAdmin');

    if (!auth || !db) {
      console.error('Firebase Admin no disponible');
      return res.status(500).json({
        message: 'Error de servidor: Firebase Admin no inicializado.'
      });
    }

    const { email, password, role, userName, ascId, requestingUserUid } = req.body;

    if (!email || !password || !role || !userName) {
      return res.status(400).json({
        message: 'Faltan campos obligatorios (email, password, role, userName).'
      });
    }

    const validRoles = ['Admin', 'Tecnico', 'Administrativo', 'Supervisor', 'TechSupp'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Rol no válido.' });
    }

    if (!requestingUserUid) {
      return res.status(401).json({
        message: 'UID del solicitante no proporcionado.'
      });
    }

    // 🔎 Verificar permisos
    const requesterDoc = await db.collection('users').doc(requestingUserUid).get();

    if (!requesterDoc.exists) {
      return res.status(403).json({
        message: 'Usuario solicitante no encontrado.'
      });
    }

    const requesterRole = requesterDoc.data().role;

    const adminRoles = ['Admin', 'Supervisor'];
    if (!adminRoles.includes(requesterRole)) {
      return res.status(403).json({
        message: 'Permiso denegado.'
      });
    }

    // 🔥 Crear usuario en Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: userName,
      emailVerified: true,
    });

    const uid = userRecord.uid;

    // 🗄 Guardar en Firestore
    await db.collection('users').doc(uid).set({
      email,
      role,
      userName,
      ascId: ascId || null,
      createdAt: FieldValue.serverTimestamp(),
    });

    return res.status(201).json({
      message: 'Usuario creado correctamente.',
      uid,
      role
    });

  } catch (error) {
    console.error('Error general:', error);

    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({
        message: 'El correo ya está registrado.'
      });
    }

    if (error.code === 'auth/weak-password') {
      return res.status(400).json({
        message: 'La contraseña debe tener al menos 6 caracteres.'
      });
    }

    return res.status(500).json({
      message: 'Error interno del servidor.',
      detail: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
}
