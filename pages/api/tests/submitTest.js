import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseAdmin";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido" });
    }

    const { uid, product, correct, total, difficulty } = req.body;

    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return res.status(404).json({ error: "Usuario no encontrado" });

    const percentage = (correct / total) * 100;

    let gain = 50; // completar examen

    if (percentage >= 60) gain += 50;
    if (percentage === 100) gain += 75;
    if (difficulty === "advanced" && percentage >= 60) gain += 100;
    if (percentage < 60) gain = 10;

    // actualizar XP
    await fetch("/api/tech/updateXP", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, product, gainedXp: gain })
    });

    return res.status(200).json({
        score: percentage,
        gainedXp: gain
    });
}
