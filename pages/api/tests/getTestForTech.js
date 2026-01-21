import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import lowLevelQuestions from "../../../lib/questions/lowLevel";
import mediumQuestions from "../../../lib/questions/mediumLevel";
import highLevelQuestions from "../../../lib/questions/highLevel";
import diagnosticQuestions from "../../../lib/questions/diagnostic";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido" });
    }

    const { uid, product } = req.body;

    const ref = doc(db, "users", uid);
    const userSnap = await getDoc(ref);

    if (!userSnap.exists()) {
        return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const user = userSnap.data();
    const skill = user.skills?.[product];

    // Si no existe skill → examen diagnóstico
    if (!skill || skill.level === 0 && skill.testsAprobados === 0) {
        return res.status(200).json({
            type: "diagnostic",
            level: 0,
            questions: diagnosticQuestions[product]
        });
    }

    // Selección según nivel
    if (skill.level <= 1) {
        return res.status(200).json({
            type: "basic",
            level: skill.level,
            questions: lowLevelQuestions[product]
        });
    }

    if (skill.level <= 2) {
        return res.status(200).json({
            type: "medium",
            level: skill.level,
            questions: mediumQuestions[product]
        });
    }

    return res.status(200).json({
        type: "advanced",
        level: skill.level,
        questions: highLevelQuestions[product]
    });
}
