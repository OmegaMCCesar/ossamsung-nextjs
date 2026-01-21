// pages/ranking.js
import { useEffect, useState } from "react";
import styles from "../styles/Ranking.module.css";

export default function RankingPage() {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=> {
    async function load() {
      const res = await fetch("/api/ranking");
      const j = await res.json();
      setRanking(j.ranking || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className={styles.container}>
      <h1>Top Técnicos</h1>
      {loading ? <p>Cargando...</p> :
        <div className={styles.grid}>
          {ranking.map((t, i) => (
            <div key={t.uid} className={styles.card}>
              <div className={styles.rank}>#{i+1}</div>
              <img src={t.avatar || "/default-avatar.png"} className={styles.avatar} />
              <div className={styles.info}>
                <div className={styles.alias}>{t.alias}</div>
                <div className={styles.asc}>{t.asc}</div>
                <div className={styles.score}>Nivel: {t.globalScore}</div>
                <div className={styles.medals}>
                  {(t.recentMedals||[]).slice(0,4).map(m => <span key={m}>{m}</span>)}
                </div>
                <button className={styles.compareBtn} onClick={() => {
                  // navigate to compare between current user and this uid
                  window.location.href = `/compare?uid=${t.uid}`;
                }}>Comparar</button>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}
