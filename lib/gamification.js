// lib/gamification.js
export const GLOBAL_MEDALS = [
  { id: "apprentice", name: "Aprendiz Samsung", icon: "🟦", condition: score => score < 2.5 },
  { id: "competent", name: "Técnico Competente", icon: "🟩", condition: score => score >= 2.5 && score < 3.6 },
  { id: "advanced", name: "Técnico Avanzado", icon: "🟧", condition: score => score >= 3.6 && score < 4.5 },
  { id: "specialist", name: "Especialista Certificado", icon: "🟥", condition: score => score >= 4.5 && score < 4.9 },
  { id: "master", name: "Maestro Samsung", icon: "🟨", condition: score => score >= 4.9 }
];

export const PRODUCT_MEDALS = {
  refrigerator: [
    { id: "cooling_expert", name: "Experto en Preservación", icon: "❄️", minLevel: 3 },
    { id: "cycle_master", name: "Dominio en Ciclo de Frío", icon: "🧊", minLevel: 4 },
    { id: "fridge_maestro", name: "Maestro en Refrigeración", icon: "🥶", minLevel: 5 }
  ],
  washing_machine: [
    { id: "wash_expert", name: "Experto en Ciclo de Lavado", icon: "🌀", minLevel: 3 },
    { id: "motor_master", name: "Dominio en Motor Inverter", icon: "🧺", minLevel: 4 },
    { id: "wash_maestro", name: "Maestro en Lavado Samsung", icon: "🌊", minLevel: 5 }
  ],
  // add rest similarly...
};

export function computeGlobalScore(productLevels) {
  // productLevels: { refrigerator: { computedLevel: 3, weight: 1 }, washing_machine: {...} }
  // We compute weighted average; default equal weights.
  const keys = Object.keys(productLevels || {});
  if (!keys.length) return 0;
  let sum = 0, wsum = 0;
  keys.forEach(k => {
    const lvl = Number(productLevels[k]?.computedLevel || 0);
    const weight = Number(productLevels[k]?.weight || 1);
    sum += lvl * weight;
    wsum += weight;
  });
  const avgLevel = sum / wsum; // 1..5
  // map to 1..5 scale directly
  return Number((avgLevel).toFixed(2));
}

export function assignGlobalMedal(score) {
  return GLOBAL_MEDALS.find(m => m.condition(score))?.id || null;
}
