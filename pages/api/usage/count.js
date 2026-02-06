import { db } from "@/lib/firebaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido." });
  }

  const { browserDeviceId } = req.body;

  if (!browserDeviceId) {
    return res.status(400).json({ error: "Device ID es obligatorio." });
  }

  try {
    const snapshot = await db
      .collection("aiUsage")
      .where("browserDeviceId", "==", browserDeviceId)
      .get();

    const currentCount = snapshot.size;
    const MAX_QUERIES = 50;

    return res.status(200).json({
      currentCount,
      remaining: Math.max(0, MAX_QUERIES - currentCount),
      limit: MAX_QUERIES,
    });
  } catch (error) {
    console.error("Error al obtener el conteo:", error);
    return res.status(500).json({
      error: "No se pudo obtener el conteo de uso.",
      currentCount: 0,
      remaining: 0,
      limit: 50,
    });
  }
}
