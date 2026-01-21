// pages/api/profile/set-avatar.js
import admin from "firebase-admin";
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))});
const db = admin.firestore();

export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).end();
  const { uid, avatar } = req.body;
  if(!uid || !avatar) return res.status(400).json({ error: "Missing uid or avatar" });
  await db.collection("technicians").doc(uid).set({ "profile.avatar": avatar }, { merge: true });
  await db.collection("ranking").doc(uid).set({ avatar }, { merge: true });
  return res.status(200).json({ ok:true });
}
