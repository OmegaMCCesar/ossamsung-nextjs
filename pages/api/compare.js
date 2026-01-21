// pages/api/compare.js
import admin from "firebase-admin";
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
  });
}
const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { aUid, bUid } = req.body || {};
  if (!aUid || !bUid) return res.status(400).json({ error: "aUid y bUid requeridos" });

  try {
    const aRef = db.collection("technicians").doc(aUid);
    const bRef = db.collection("technicians").doc(bUid);
    const [aSnap, bSnap] = await Promise.all([aRef.get(), bRef.get()]);
    if (!aSnap.exists || !bSnap.exists) return res.status(404).json({ error: "Técnico no encontrado" });

    const aData = aSnap.data();
    const bData = bSnap.data();

    // build per-product levels
    const aProductsSnap = await aRef.collection("products").get();
    const bProductsSnap = await bRef.collection("products").get();
    const aProducts = {}, bProducts = {};
    aProductsSnap.forEach(d => aProducts[d.id] = d.data().computedLevel || 1);
    bProductsSnap.forEach(d => bProducts[d.id] = d.data().computedLevel || 1);

    // ranking positions: compute relative percentile in ranking collection
    // get count of techs below each's globalScore
    const rankingCol = db.collection("ranking");
    const aScore = (await rankingCol.doc(aUid).get()).data()?.globalScore || 0;
    const bScore = (await rankingCol.doc(bUid).get()).data()?.globalScore || 0;
    const totalSnap = await rankingCol.get();
    const total = totalSnap.size;
    const belowA = (await rankingCol.where("globalScore", "<=", aScore).get()).size;
    const belowB = (await rankingCol.where("globalScore", "<=", bScore).get()).size;

    return res.status(200).json({
      a: { uid: aUid, alias: aData.profile?.alias || aData.profile?.name, asc: aData.profile?.asc, avatar: aData.profile?.avatar, products: aProducts, globalScore: aScore, percentile: Math.round((belowA/total)*100) },
      b: { uid: bUid, alias: bData.profile?.alias || bData.profile?.name, asc: bData.profile?.asc, avatar: bData.profile?.avatar, products: bProducts, globalScore: bScore, percentile: Math.round((belowB/total)*100) }
    });
  } catch (err) {
    console.error("compare error:", err);
    return res.status(500).json({ error: err.message });
  }
}
