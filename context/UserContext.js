// context/UserContext.jsx

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const data = userDoc.data();

            const userWithData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,

              // Datos base
              role: data.role || "Público",
              userName: data.userName || "Usuario",

              // Datos propios del técnico
              alias: data.alias || null,
              asc: data.asc || null,
              bp: data.bp || null,
              avatar: data.avatar || "default1",

              level: data.level || 1,
              medals: data.medals || [],
              examHistory: data.examHistory || [],
            };

            // Inicializar perfil si es técnico
            if (userWithData.role === "Tecnico") {
              await fetch("/api/users/initProfile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uid: firebaseUser.uid }),
              });
            }

            setUser(userWithData);
          } else {
            // No existe documento en users → Usuario público
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: "Público",
              userName: "Cliente",
            });
          }

        } catch (error) {
          console.error("Error leyendo Firestore:", error);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: "Público",
          });
        }
      } else {
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
