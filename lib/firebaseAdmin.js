// lib/firebaseAdmin.js
const admin = require('firebase-admin');

const privateKeyEnv = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
const clientEmailEnv = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const projectIdEnv = process.env.FIREBASE_ADMIN_PROJECT_ID;

if (!privateKeyEnv || !clientEmailEnv || !projectIdEnv) {
  console.error('Faltan variables de entorno para Firebase Admin (PRIVATE_KEY, CLIENT_EMAIL, PROJECT_ID).');
  // Opcional: lanzar error para no continuar
  throw new Error('Firebase Admin SDK no configurado correctamente.');
}

// Reemplazar \\n por saltos de línea reales
const privateKey = privateKeyEnv.replace(/\\n/g, '\n');

// Evitar inicialización múltiple en hot-reload de Next.js
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      type: 'service_account',
      project_id: projectIdEnv,
      private_key: privateKey,
      client_email: clientEmailEnv,
    }),
  });
  console.log('Firebase Admin SDK inicializado correctamente.');
}

module.exports = admin;
