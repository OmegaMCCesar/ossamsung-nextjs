const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Se ejecuta cada 10 días (240 horas).
 * Revisa técnicos cuyo RA vence en los próximos 5 días.
 */
exports.checkRAExpiration = onSchedule(
  {
    schedule: "every 240 hours",
    timeZone: "America/Mexico_City", // MUY recomendado
  },
  async (event) => {
    const db = admin.firestore();
    const today = new Date();

    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(today.getDate() + 5);

    try {
      const snapshot = await db
        .collection("technicians")
        .where("raExpiration", ">", admin.firestore.Timestamp.fromDate(today))
        .where(
          "raExpiration",
          "<=",
          admin.firestore.Timestamp.fromDate(fiveDaysFromNow)
        )
        .get();

      if (snapshot.empty) {
        console.log("No hay técnicos con RA por vencer pronto.");
        return;
      }

      let listaTecnicos = "";

      snapshot.forEach((doc) => {
        const data = doc.data();
        const fecha = data.raExpiration.toDate().toLocaleDateString("es-MX");
        listaTecnicos += `Técnico: ${data.userName} | ASC: ${data.asc} | Vence: ${fecha}\n`;
      });

      const mensajeFinal = `ALERTA DE VENCIMIENTO RA (5 DÍAS):\n\n${listaTecnicos}`;

      await db.collection("adminNotifications").add({
        title: "Vencimientos Próximos",
        message: mensajeFinal,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
      });

      console.log("Notificación generada exitosamente.");
    } catch (error) {
      console.error("Error ejecutando revisión de RA:", error);
    }
  }
);
