// Importa las funciones HTTP de v2 y setGlobalOptions
const { onCall, setGlobalOptions } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger"); // Para logs
const functions = require('firebase-functions'); // Necesario para functions.config()

// Importa y configura Firebase Admin SDK
const admin = require('firebase-admin');
admin.initializeApp();

// Importa la librería de Twilio
const twilio = require('twilio');

// --- Configuración Global de la Región ---
setGlobalOptions({ region: 'us-east1' }); // O tu región preferida, ej. 'us-central1'

// --- Configuración de Twilio para SMS ---
// Asegúrate de que estas variables estén configuradas en Firebase Functions:
// firebase functions:config:set twilio.sid="ACxxxxxxxxxx" twilio.auth_token="your_auth_token" twilio.phone_number="+1234567890" admin.phone_number="+521234567890"
const accountSid = process.env.TWILIO_SID || functions.config().twilio.sid;
const authToken = process.env.TWILIO_AUTH_TOKEN || functions.config().twilio.auth_token;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || functions.config().twilio.phone_number;
const adminPhoneNumber = process.env.ADMIN_PHONE_NUMBER || functions.config().admin.phone_number; // Número del administrador para SMS

const twilioClient = new twilio(accountSid, authToken); // Usamos twilioClient

// --- Función para enviar Notificaciones por SMS ---
exports.sendSmsNotification = onCall(async (request) => {
    // Valida que la llamada venga de un usuario autenticado (opcional, pero recomendado)
    if (!request.auth) {
        logger.warn("sendSmsNotification: Llamada no autenticada.");
        throw new functions.https.HttpsError('unauthenticated', 'Solo usuarios autenticados pueden llamar a esta función.');
    }

    const { serviceOrder, userEmail, ascCode } = request.data; // Los datos enviados desde el frontend

    if (!adminPhoneNumber) {
        logger.error("sendSmsNotification: Número de teléfono del administrador no configurado.");
        throw new functions.https.HttpsError('internal', 'Número de administrador no configurado.');
    }

    const messageBody = `ALERTA: Orden de Servicio ${serviceOrder} (ASC: ${ascCode}, Usuario: ${userEmail}) ha sido ingresada.`;

    try {
        await twilioClient.messages.create({
            body: messageBody,
            from: twilioPhoneNumber, // Tu número de Twilio
            to: adminPhoneNumber,    // Número del administrador
        });
        logger.info(`SMS enviado para orden ${serviceOrder} al ${adminPhoneNumber}`);
        return { success: true, message: 'SMS enviado' };
    } catch (error) {
        logger.error(`Error enviando SMS para orden ${serviceOrder}:`, error);
        throw new functions.https.HttpsError('internal', 'Error al enviar SMS', error.message);
    }
});

// Nota: Las funciones de WhatsApp y correo (Nodemailer) han sido eliminadas
// ya que EmailJS se encarga de los correos desde el frontend.