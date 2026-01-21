// pages/api/admin/save-results.js
import admin from "firebase-admin";
import { computeGlobalScore, assignGlobalMedal, PRODUCT_MEDALS } from "../../../lib/gamification";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
  });
}
const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { uid, bp, product, scores /* array [{questionId,score,feedback,answer}], average */ , average } = req.body || {};
  if (!uid || !product || !Array.isArray(scores)) return res.status(400).json({ error: "Missing fields" });

  try {
    // save exam history
    const historyRef = db.collection("technicians").doc(uid).collection("products").doc(product).collection("history");
    await historyRef.add({
      bp, product, scores, average, createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // recompute product aggregated stats: average over last N exams (simple approach: compute new average)
    const prodDocRef = db.collection("technicians").doc(uid).collection("products").doc(product);
    const prodDoc = await prodDocRef.get();
    let productData = prodDoc.exists ? prodDoc.data() : {};
    const prevAvg = productData.averageScore || 0;
    const prevCount = productData.testsCount || 0;
    const newCount = prevCount + 1;
    const newAvg = (prevAvg * prevCount + average) / newCount;

    // compute computedLevel from newAvg (map 0-5 -> 1-5 scale)
    const computedLevel = Math.max(1, Math.min(5, Math.round((newAvg / 5) * 5)));

    await prodDocRef.set({
      averageScore: newAvg,
      testsCount: newCount,
      computedLevel,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // recompute global score for technician
    const productsSnap = await db.collection("technicians").doc(uid).collection("products").get();
    const productLevels = {};
    productsSnap.forEach(d => {
      productLevels[d.id] = { computedLevel: d.data().computedLevel || 1, weight: 1 };
    });
    const globalScore = computeGlobalScore(productLevels);

    const profileRef = db.collection("technicians").doc(uid).collection("profile").doc("meta");
    await db.collection("technicians").doc(uid).set({
      profile: admin.firestore.FieldValue.delete() // noop; we'll set meta below
    }, { merge: true }).catch(()=>{});

    // update summary location for ranking
    await db.collection("ranking").doc(uid).set({
      alias: (await db.collection("technicians").doc(uid).get()).data()?.profile?.alias || "Sin alias",
      asc: (await db.collection("technicians").doc(uid).get()).data()?.profile?.asc || null,
      avatar: (await db.collection("technicians").doc(uid).get()).data()?.profile?.avatar || null,
      globalScore,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    // assign global medal
    const globalMedal = assignGlobalMedal(globalScore);
    // compute product medals for this product
    const productMedals = (PRODUCT_MEDALS[product.toLowerCase()] || []).filter(m => computedLevel >= m.minLevel).map(m => m.id);

    // store medals
    const medalsRef = db.collection("technicians").doc(uid).collection("medals");
    const medalDoc = { product, productMedals, globalMedal, awardedAt: admin.firestore.FieldValue.serverTimestamp() };
    await medalsRef.add(medalDoc);

    return res.status(200).json({ ok: true, computedLevel, globalScore, awarded: medalDoc });
  } catch (err) {
    console.error("save-results error:", err);
    return res.status(500).json({ error: err.message });
  }
}
