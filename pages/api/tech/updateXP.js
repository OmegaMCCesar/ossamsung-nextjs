import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseAdmin";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido" });
    }

    const { uid, productType, gainedXp } = req.body;

    if (!uid || !productType || !gainedXp) {
        return res.status(400).json({ error: "Datos incompletos" });
    }

    try {
        const ref = doc(db, "users", uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        const data = snap.data();

        const skill = data.skills?.[productType] || { level: 0, xp: 0 };

        let newXp = skill.xp + gainedXp;
        let newLevel = skill.level;

        // XP necesaria para siguiente nivel
        const xpNeeded = (newLevel + 1) * 100;

        // Ver si sube nivel
        if (newXp >= xpNeeded) {
            newXp -= xpNeeded;
            newLevel += 1;
        }

        const updatedSkills = {
            ...data.skills,
            [productType]: {
                ...skill,
                xp: newXp,
                level: newLevel
            }
        };

        await updateDoc(ref, { skills: updatedSkills });

        return res.status(200).json({
            message: "XP actualizado",
            level: newLevel,
            xp: newXp
        });

    } catch (error) {
        console.error("Error", error);
        return res.status(500).json({ error: "Error interno" });
    }
}
