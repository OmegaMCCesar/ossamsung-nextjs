// lib/firebaseAdmin.js

const admin = require('firebase-admin');

if (!process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
  throw new Error('FIREBASE_ADMIN_PRIVATE_KEY no definida en .env');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });

  console.log('✅ Firebase Admin inicializado correctamente');
}

const auth = admin.auth();
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

module.exports = { auth, db, FieldValue };
