import admin from "@/lib/firebaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { email, password, techData } = req.body;

    if (!email || !password || !techData) {
      return res.status(400).json({ error: "Faltan datos obligatorios." });
    }

    // Crear usuario en Auth sin cerrar tu sesión
    const userRecord = await admin.auth().createUser({
      email,
      password,
    });

    const uid = userRecord.uid;

    // Guardar datos de técnico
    await admin.firestore().collection("technicians").doc(uid).set(techData);

    // Guardar datos básicos para el login en "users"
    await admin.firestore().collection("users").doc(uid).set(techData, { merge: true });

    return res.status(200).json({ status: "ok", uid });
  } catch (err) {
    console.error("Error creando técnico:", err);
    return res.status(400).json({ error: err.message });
  }
}
