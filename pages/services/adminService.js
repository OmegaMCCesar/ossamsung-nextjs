import { db } from "../../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp
} from "firebase/firestore";

export const createTechnician = async (techData) => {
  return addDoc(collection(db, "technicians"), {
    ...techData,
    createdAt: Timestamp.now()
  });
};

export const getTechniciansByAsc = async (ascCode = "") => {
  let ref = collection(db, "technicians");

  if (ascCode) {
    ref = query(ref, where("asc", "==", ascCode));
  }

  const snap = await getDocs(ref);
  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const getAscs = async () => {
  const snap = await getDocs(collection(db, "ascInfo"));
  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const createAsc = async (ascData) => {
  return addDoc(collection(db, "ascInfo"), {
    ...ascData,
    createdAt: Timestamp.now()
  });
};
