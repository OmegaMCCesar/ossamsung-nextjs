// pages/api/ranking.js
import admin from "firebase-admin";
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
  });
}
const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    // get top 100 by globalScore
    const snap = await db.collection("ranking").orderBy("globalScore", "desc").limit(100).get();
    const list = [];
    snap.forEach(d => {
      const data = d.data();
      list.push({ uid: d.id, alias: data.alias, asc: data.asc, avatar: data.avatar, globalScore: data.globalScore, recentMedals: data.recentMedals || [] });
    });
    return res.status(200).json({ ranking: list });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
