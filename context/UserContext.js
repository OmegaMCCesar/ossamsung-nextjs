import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; 
import { auth, db } from '../lib/firebase'; // Asegúrate de que 'db' se exporte desde firebase.js

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Usuario autenticado por Firebase: buscar datos en Firestore
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Adjuntar datos de Firestore (rol y nombre) al objeto de Firebase
            const userWithRole = {
              uid: firebaseUser.uid, 
              email: firebaseUser.email,
              // Propiedades adicionales de Firestore:
              role: userData.role || 'Público', 
              userName: userData.userName || 'Usuario',
              ascId: userData.ascId || null,
            };
            setUser(userWithRole);
          } else {
            // Usuario en Auth pero no en la colección 'users' (ej. usuario nuevo o público con login)
            setUser({ 
                uid: firebaseUser.uid, 
                email: firebaseUser.email, 
                role: 'Público', // Asignar rol por defecto para acceso limitado
                userName: 'Cliente'
            });
          }
        } catch (error) {
          console.error("Error al obtener el rol del usuario desde Firestore:", error);
          // Fallback en caso de error de DB
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email, role: 'Público' }); 
        }
      } else {
        // Usuario desconectado
        setUser(null); 
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const logout = () => signOut(auth);

  return (
    <UserContext.Provider value={{ user, loading, logout }}> 
      {children}
    </UserContext.Provider>
  );
};

export const useAuth = () => useContext(UserContext);