// lib/firebase.js

import { initializeApp, getApps, getApp } from 'firebase/app'; // Importa getApps y getApp
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // <-- DESCOMENTA esta línea para Firestore

// Tu configuración (asegúrate que las variables de entorno estén correctas)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Si la usas
};

// --- SOLUCIÓN AL ERROR app/duplicate-app ---
let app;

if (getApps().length === 0) {
  // Si no hay ninguna app de Firebase inicializada, inicializa una nueva.
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized!"); // Puedes añadir un log para confirmar
} else {
  // Si ya existe una app, obtén la instancia existente.
  app = getApp();
  console.log("Firebase already initialized, getting existing app."); // Log opcional
}
// --- FIN DE LA SOLUCIÓN ---


// Ahora obtén los servicios usando la instancia 'app' asegurada
const auth = getAuth(app);
const db = getFirestore(app); // <-- DESCOMENTA esta línea para inicializar db

// Exporta los servicios que necesites en tu aplicación
// Incluye 'db' en la exportación
export { auth, db }; // <-- DESCOMENTA 'db' aquí