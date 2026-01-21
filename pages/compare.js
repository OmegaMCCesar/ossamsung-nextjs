// pages/compare.js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function ComparePage() {
  const router = useRouter();
  const { uid } = router.query;
  const [me, setMe] = useState(null);
  const [other, setOther] = useState(null);

  useEffect(()=> {
    async function load() {
      // get current user uid from client auth (firebase) - adjust accordingly
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
      if(!currentUser) { router.push('/login'); return; }
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ aUid: currentUser.uid, bUid: uid })
      });
      const j = await res.json();
      setMe(j.a); setOther(j.b);
    }
    if(uid) load();
  }, [uid]);

  if(!me || !other) return <div>Cargando comparación...</div>;

  return (
    <div style={{maxWidth:900, margin:"20px auto"}}>
      <h2>Comparación: {me.alias} vs {other.alias}</h2>
      <div style={{display:"flex",gap:20}}>
        <div style={{flex:1, padding:12, border:"1px solid #ddd"}}>
          <img src={me.avatar || "/default-avatar.png"} style={{width:80}} />
          <h3>{me.alias}</h3>
          <p>ASC: {me.asc}</p>
          <p>Global score: {me.globalScore} (Percentil: {me.percentile}%)</p>
          <h4>Niveles por producto</h4>
          <ul>{Object.entries(me.products).map(([k,v]) => <li key={k}>{k}: {v}</li>)}</ul>
        </div>

        <div style={{flex:1, padding:12, border:"1px solid #ddd"}}>
          <img src={other.avatar || "/default-avatar.png"} style={{width:80}} />
          <h3>{other.alias}</h3>
          <p>ASC: {other.asc}</p>
          <p>Global score: {other.globalScore} (Percentil: {other.percentile}%)</p>
          <h4>Niveles por producto</h4>
          <ul>{Object.entries(other.products).map(([k,v]) => <li key={k}>{k}: {v}</li>)}</ul>
        </div>
      </div>
    </div>
  );
}
