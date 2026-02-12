// lib/adminApis.js
import { admin }from '@/lib/firebaseAdmin';
const db = admin.firestore();

// Crear técnico
export const createTechnician = async (techData) => {
    return db.collection('technicians').add({
        ...techData,
        createdAt: admin.firestore.Timestamp.now()
    });
};

// Obtener técnicos por ASC
export const getTechniciansByAsc = async (ascCode = "") => {
    let ref = db.collection('technicians');
    if (ascCode) {
        ref = ref.where('asc', '==', ascCode);
    }

    const snapshot = await ref.get();
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

// Obtener todos los ASC
export const getAscs = async () => {
    const snapshot = await db.collection('ascInfo').get();
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

// Crear ASC
export const createAsc = async (ascData) => {
    return db.collection('ascInfo').add({
        ...ascData,
        createdAt: admin.firestore.Timestamp.now()
    });
};
