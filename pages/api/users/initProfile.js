import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido" });
    }

    const { uid } = req.body;

    if (!uid) {
        return res.status(400).json({ error: "Falta UID" });
    }

    try {
        const ref = doc(db, "users", uid);
        const snapshot = await getDoc(ref);

        if (!snapshot.exists()) {
            return res.status(404).json({ error: "Usuario no existe" });
        }

        const data = snapshot.data();

        // si ya tiene perfil, no modificar
        if (data.level && data.skills) {
            return res.status(200).json({ message: "Perfil ya inicializado" });
        }

        // datos mínimos
        const profile = {
            level: data.level || 1,
            xp: data.xp || 0,
            expertiseScore: data.expertiseScore || 0,
            avatar: data.avatar || null,
            medals: data.medals || [],
            skills: data.skills || {
                refrigerador: { level: 0, xp: 0, testsAprobados: 0 },
                lavadora: { level: 0, xp: 0, testsAprobados: 0 },
                estufa: { level: 0, xp: 0, testsAprobados: 0 },
                lavasecadora: { level: 0, xp: 0, testsAprobados: 0 },
            },
        };

        await updateDoc(ref, profile);

        return res.status(200).json({ message: "Perfil inicializado", profile });

    } catch (error) {
        console.error("Error inicializando perfil:", error);
        return res.status(500).json({ error: "Error interno" });
    }
}
