// pages/api/auth/registerPublicUser.js
// Ruta: POST /api/auth/registerPublicUser
// Cuidado: toda la lógica async debe ejecutarse dentro del handler (no top-level await)

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    // Importar admin aquí para que Next no lo intente empaquetar en cliente
    const admin = require('../../../lib/firebaseAdmin');

    // Validación básica del body
    const { uid, email, name } = req.body || {};
    if (!uid || !email || !name) {
      return res.status(400).json({ message: 'Faltan campos: uid, email, name.' });
    }

    // Comprobación defensiva: que admin esté inicializado
    if (!admin || !admin.firestore) {
      console.error('Firebase Admin no inicializado correctamente.');
      return res.status(500).json({ message: 'Error interno: Firebase Admin no inicializado.' });
    }

    // Ahora sí: operaciones async dentro del handler
    const docRef = admin.firestore().collection('users').doc(uid);
    await docRef.set({
      email,
      role: 'Público',
      ascId: null,
      userName: name,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(201).json({ message: 'Usuario público registrado correctamente.', uid });
  } catch (err) {
    console.error('Error en registerPublicUser:', err);
    // En desarrollo mostrar más detalle, en producción solo mensaje genérico
    return res.status(500).json({
      message: 'Error interno al registrar usuario público.',
      detail: process.env.NODE_ENV !== 'production' ? err.message : undefined,
    });
  }
}
