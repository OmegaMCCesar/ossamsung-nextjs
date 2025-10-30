// pages/api/auth/registerPublicUser.js (Ejemplo de lógica de backend)

// ... verificar autenticación del request ...

const newUserUid = req.body.uid; 
await admin.firestore().collection('users').doc(newUserUid).set({
    email: req.body.email,
    role: "Público", // Asignación de rol por defecto
    ascId: null,
    userName: req.body.name,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
});
// Respuesta de éxito