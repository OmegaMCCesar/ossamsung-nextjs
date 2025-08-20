import React, { useMemo, useState } from "react";

/**
 * Árbol de decisión interactivo en React JS (listo para pegar en cualquier app)
 * -----------------------------------------------------------------------------
 * ✔ Flujo pregunta → opciones → resultado
 * ✔ Soporta imágenes en nodos y opciones (opcional)
 * ✔ Progreso, historial (migas), volver y reiniciar
 * ✔ Callback onResult para capturar el resultado final
 * ✔ JSON de flujo generado desde tus 4 diagramas (v1, editable)
 *
 * Cómo usar:
 * 1) Copia este archivo en tu proyecto (p.ej. src/DecisionTreeFridge.jsx)
 * 2) Importa y renderiza <DecisionTreeDemo /> o usa <DecisionTree tree={fridgeTree} />
 * 3) Reemplaza textos/ids según necesites. Puedo refinar los nodos si cambian.
 */

// Tipos (opcionales si usas TS; aquí están como JSDoc para referencia)
/** @typedef {"question"|"result"} NodeType */
/** @typedef {{ label: string; nextId: string; description?: string; image?: string }} Option */
/** @typedef {{ id: string; type: NodeType; title?: string; prompt?: string; image?: string; options?: Option[]; resultText?: string; data?: any }} TreeNode */
/** @typedef {Record<string, TreeNode>} Tree */

// ==========================
// UI PRINCIPAL DEL WIDGET
// ==========================
export default function DecisionTreeDemo() {
  const tree = useMemo(() => fridgeTree, []);
  return (
    <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <DecisionTree
          tree={tree}
          startId="start"
          onResult={(payload) => {
            // Aquí puedes enviar el resultado a tu backend/analytics
            console.log("Resultado final:", payload);
          }}
        />
      </div>
    </div>
  );
}

export function DecisionTree({ tree, startId = "start", onResult }) {
  const [currentId, setCurrentId] = useState(startId);
  const [path, setPath] = useState([{ nodeId: startId, optionLabel: undefined }]);

  const current = tree[currentId];

  const stepsTotal = useMemo(() => countMaxDepth(tree, startId), [tree, startId]);
  const stepsDone = Math.max(0, path.length - 1);
  const progress = stepsTotal > 0 ? Math.min(100, Math.round((stepsDone / stepsTotal) * 100)) : 0;

  function selectOption(opt) {
    const next = tree[opt.nextId];
    const newPath = [...path, { nodeId: opt.nextId, optionLabel: opt.label }];
    setPath(newPath);
    setCurrentId(opt.nextId);
    if (next?.type === "result") {
      onResult?.({ finalNode: next, path: newPath });
    }
  }

  function goBack() {
    if (path.length <= 1) return;
    const newPath = path.slice(0, -1);
    setPath(newPath);
    setCurrentId(newPath[newPath.length - 1].nodeId);
  }

  function reset() {
    setPath([{ nodeId: startId }]);
    setCurrentId(startId);
  }

  if (!current) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="text-red-600 font-semibold">Nodo no encontrado: {currentId}</div>
        <button className="mt-4 px-4 py-2 rounded-xl bg-gray-900 text-white" onClick={reset}>
          Reiniciar
        </button>
      </div>
    );
  }

  const isResult = current.type === "result";

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-gray-600">Progreso</div>
        <div className="text-sm text-gray-500">{stepsDone}/{stepsTotal} pasos</div>
      </div>
      <div className="mt-2 w-full bg-gray-100 h-2 rounded-full overflow-hidden">
        <div className="h-full bg-gray-900" style={{ width: `${progress}%` }} />
      </div>

      {/* Migas */}
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
        {path.map((p, i) => (
          <span key={i} className="inline-flex items-center gap-2">
            <span className="px-2 py-1 rounded-full bg-gray-100">
              {tree[p.nodeId]?.title || tree[p.nodeId]?.prompt || p.nodeId}
            </span>
            {i < path.length - 1 && <span>→</span>}
          </span>
        ))}
      </div>

      {/* Contenido del nodo */}
      <div className="mt-6">
        {current.image && (
          <img src={current.image} alt="node" className="w-full rounded-xl mb-4" />
        )}
        <h2 className="text-xl font-semibold text-gray-900">
          {current.title || (isResult ? "Resultado" : "Pregunta")}
        </h2>
        {current.prompt && (
          <p className="mt-2 text-gray-700 whitespace-pre-line">{current.prompt}</p>
        )}
        {isResult && current.resultText && (
          <div className="mt-4 p-4 rounded-xl bg-green-50 text-green-800 border border-green-200">
            {current.resultText}
          </div>
        )}

        {!isResult && (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            {current.options?.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => selectOption(opt)}
                className="text-left px-4 py-3 rounded-xl border border-gray-300 hover:border-gray-900 transition bg-white"
              >
                {opt.image && (
                  <img src={opt.image} alt="opt" className="w-full rounded-lg mb-2" />
                )}
                <div className="font-medium text-gray-900">{opt.label}</div>
                {opt.description && (
                  <div className="text-sm text-gray-600 mt-1">{opt.description}</div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex gap-2">
          <button onClick={goBack} disabled={path.length <= 1} className="px-4 py-2 rounded-xl border disabled:opacity-50">
            Volver
          </button>
          <button onClick={reset} className="px-4 py-2 rounded-xl border">
            Reiniciar
          </button>
        </div>
        {isResult && (
          <div className="text-sm text-gray-600">Selecciona "Volver" para explorar otra ruta.</div>
        )}
      </div>
    </div>
  );
}

// ==========================
// Utilidades
// ==========================
function countMaxDepth(tree, startId, visited = new Set()) {
  if (!tree[startId] || visited.has(startId)) return 0;
  visited.add(startId);
  const node = tree[startId];
  if (node.type === "result" || !node.options?.length) return 1;
  return 1 + Math.max(...node.options.map((o) => countMaxDepth(tree, o.nextId, visited)));
}

// ==========================
// FLUJO: REFRIGERADOR (de tus 4 imágenes) – V1
// Puedes editar textos/ids con libertad. Si algo debe saltar a otra "página",
// aquí lo resolvemos enlazando al subárbol correspondiente (cool_*).
// ==========================
export const fridgeTree = /** @type {Tree} */ ({
  // Página 1: selector inicial
  start: {
    id: "start",
    type: "question",
    title: "¿Qué problema presenta?",
    prompt: "¿Es un problema con la fábrica de hielo, el despachador de agua u otro?",
    options: [
      { label: "Fábrica de hielo o despachador", nextId: "agua_hielo_root" },
      { label: "Dudas / aclaraciones frecuentes", nextId: "faq_root" },
      { label: "Otro problema", nextId: "cool_start" }, // enlaza al árbol de enfriamiento débil/nulo
    ],
  },

  // --- Rama: Fábrica de hielo / Despachador ---
  agua_hielo_root: {
    id: "agua_hielo_root",
    type: "question",
    title: "Tipo de equipo",
    prompt: "Selecciona la configuración del equipo.",
    options: [
      { label: "Tiene despachador pero no fábrica de hielo automática", nextId: "disp_sin_icemaker_despacha" },
      { label: "Tiene ambos (despachador + fábrica de hielo)", nextId: "ambos_despacha_agua" },
    ],
  },

  // Solo despachador (sin icemaker)
  disp_sin_icemaker_despacha: {
    id: "disp_sin_icemaker_despacha",
    type: "question",
    prompt: "¿Despacha agua?",
    options: [
      { label: "Sí", nextId: "disp_sin_icemaker_derrame" },
      { label: "No", nextId: "rev_toma_presion" },
    ],
  },
  disp_sin_icemaker_derrame: {
    id: "disp_sin_icemaker_derrame",
    type: "question",
    prompt: "¿Derrama agua?",
    options: [
      { label: "Sí", nextId: "valvula_o_manguera" },
      { label: "No", nextId: "ok_operacion" },
    ],
  },

  // Ambos (agua + hielo)
  ambos_despacha_agua: {
    id: "ambos_despacha_agua",
    type: "question",
    prompt: "¿Despacha agua?",
    options: [
      { label: "Sí", nextId: "ambos_despacha_hielo" },
      { label: "No", nextId: "rev_toma_presion" },
    ],
  },
  ambos_despacha_hielo: {
    id: "ambos_despacha_hielo",
    type: "question",
    prompt: "¿Despacha hielo?",
    options: [
      { label: "Sí", nextId: "ambos_derrame" },
      { label: "No", nextId: "rev_presion_sensores_icemaker" },
    ],
  },
  ambos_derrame: {
    id: "ambos_derrame",
    type: "question",
    prompt: "¿Derrama agua?",
    options: [
      { label: "Sí", nextId: "valvula_o_manguera" },
      { label: "No", nextId: "ok_operacion" },
    ],
  },

  // Resultados/revisiones comunes para rama agua/hielo
  rev_toma_presion: {
    id: "rev_toma_presion",
    type: "result",
    title: "No despacha agua",
    resultText:
      "Verificar toma de agua y presión. Posible válvula de llenado tapada o dañada.",
  },
  valvula_o_manguera: {
    id: "valvula_o_manguera",
    type: "result",
    title: "Derrame de agua",
    resultText:
      "Posible válvula de llenado dañada o manguera fuera de posición.",
  },
  rev_presion_sensores_icemaker: {
    id: "rev_presion_sensores_icemaker",
    type: "result",
    title: "No despacha hielo",
    resultText:
      "Verificar presión de agua, sensores e ice maker. Posible daño en ice maker o sensores.",
  },
  ok_operacion: {
    id: "ok_operacion",
    type: "result",
    title: "Operación sin anomalías detectables",
    resultText: "Sin derrames ni bloqueos aparentes. Continuar monitoreo.",
  },

  // Dudas frecuentes (incluye ruido icemaker y filtro)
  faq_root: {
    id: "faq_root",
    type: "question",
    title: "Dudas frecuentes",
    options: [
      { label: "¿Ruido en ice maker?", nextId: "faq_ruido_icemaker" },
      { label: "¿Indicador de cambio de filtro encendido?", nextId: "faq_filtro" },
      { label: "Volver al inicio", nextId: "start" },
    ],
  },
  faq_ruido_icemaker: {
    id: "faq_ruido_icemaker",
    type: "question",
    prompt: "¿El ruido proviene del ice maker?",
    options: [
      { label: "Sí", nextId: "faq_ruido_icemaker_result" },
      { label: "No", nextId: "cool_ruido_root" }, // saltamos a árbol de ruidos (pág 3)
    ],
  },
  faq_ruido_icemaker_result: {
    id: "faq_ruido_icemaker_result",
    type: "result",
    title: "Ruido de ice maker",
    resultText:
      "Puede ser normal por ciclos de llenado/deshielo. Verificar nivelación y que no haya hielo atorado.",
  },
  faq_filtro: {
    id: "faq_filtro",
    type: "result",
    title: "Cambio de filtro",
    resultText: "Cambiar el filtro de agua y realizar reset del marcador.",
  },

  // ==========================
  // SUBÁRBOL: Enfriamiento débil o nulo (pág 1 y 4 enlazadas)
  // ==========================
  cool_start: {
    id: "cool_start",
    type: "question",
    title: "Enfriamiento débil o nulo",
    prompt: "¿El refrigerador está conectado al tomacorriente?",
    options: [
      { label: "Sí", nextId: "cool_luz_o_frio" },
      { label: "No", nextId: "cool_verificar_alimentacion" },
    ],
  },
  cool_verificar_alimentacion: {
    id: "cool_verificar_alimentacion",
    type: "question",
    prompt:
      "¿Encendió el equipo tras conectar? Si no, verificar cable de alimentación y que el voltaje en el tomacorriente sea ≥110 V y llegue al cable.",
    options: [
      { label: "Sí, encendió", nextId: "cool_espera_10_15" },
      { label: "No", nextId: "cool_cambiar_cable" },
    ],
  },
  cool_cambiar_cable: {
    id: "cool_cambiar_cable",
    type: "result",
    title: "Alimentación incorrecta",
    resultText: "Cambiar cable de alimentación y corregir suministro eléctrico.",
  },
  cool_espera_10_15: {
    id: "cool_espera_10_15",
    type: "result",
    title: "Verificación inicial",
    resultText:
      "Conectar y esperar de 10 a 15 min para verificar operación del equipo.",
  },
  cool_luz_o_frio: {
    id: "cool_luz_o_frio",
    type: "question",
    prompt: "¿Se aprecia luz interior o algo de frío en el equipo?",
    options: [
      { label: "Sí", nextId: "cool_escarcha" },
      { label: "No", nextId: "cool_rev_cable_main" },
    ],
  },
  cool_rev_cable_main: {
    id: "cool_rev_cable_main",
    type: "result",
    title: "Sin luces ni frío",
    resultText:
      "Revisar tarjeta main/arnés y alimentación al motor. Posible daño en main.",
  },
  cool_escarcha: {
    id: "cool_escarcha",
    type: "question",
    prompt: "¿Se nota escarcha en congelador o conservador?",
    options: [
      { label: "Sí", nextId: "cool_puertas" },
      { label: "No", nextId: "cool_hay_frio" },
    ],
  },
  cool_puertas: {
    id: "cool_puertas",
    type: "question",
    prompt: "¿Alguna puerta mal cerrada o no sella bien?",
    options: [
      { label: "No, se ve luz o no cierra bien", nextId: "cool_empaque_o_bisagra" },
      { label: "Sí, cierran correctamente", nextId: "cool_obstruccion_ductos" },
    ],
  },
  cool_empaque_o_bisagra: {
    id: "cool_empaque_o_bisagra",
    type: "result",
    title: "Cierre de puerta defectuoso",
    resultText:
      "Posible daño en empaque (gasket) o ajuste/cambio de bisagra. Verificar desalineación.",
  },
  cool_obstruccion_ductos: {
    id: "cool_obstruccion_ductos",
    type: "result",
    title: "Obstrucción de ductos",
    resultText:
      "Posible obstrucción por mal uso/alimentos. Realizar deshielo y verificar parámetros.",
  },
  cool_hay_frio: {
    id: "cool_hay_frio",
    type: "question",
    prompt: "¿Se aprecia algo de frío en congelador o conservador?",
    options: [
      { label: "Sí, hay frío", nextId: "cool_dejo_enfriar" },
      { label: "No", nextId: "cool_cable_voltaje" },
    ],
  },
  cool_cable_voltaje: {
    id: "cool_cable_voltaje",
    type: "result",
    title: "Sin frío apreciable",
    resultText:
      "Verificar cable de alimentación y voltaje correcto. Si todo ok, revisar tarjeta/main.",
  },
  cool_dejo_enfriar: {
    id: "cool_dejo_enfriar",
    type: "question",
    prompt: "¿Dejó de enfriar de un día a otro o poco a poco?",
    options: [
      { label: "No, poco a poco", nextId: "cool_fuga_interna" },
      { label: "Sí, de golpe", nextId: "cool_compresor_danio" },
    ],
  },
  cool_fuga_interna: {
    id: "cool_fuga_interna",
    type: "result",
    title: "Pérdida gradual de frío",
    resultText:
      "Posible fuga interna, motor fan compresor dañado o falta de servicio en cuarto de máquinas.",
  },
  cool_compresor_danio: {
    id: "cool_compresor_danio",
    type: "result",
    title: "Pérdida súbita de frío",
    resultText:
      "Posible compresor dañado, daño en main o fuga. Requiere diagnóstico avanzado.",
  },

  // ==========================
  // SUBÁRBOL: Ruidos (pág 2/3)
  // ==========================
  cool_ruido_root: {
    id: "cool_ruido_root",
    type: "question",
    title: "Ruidos",
    prompt: "¿El ruido es constante o intermitente?",
    options: [
      { label: "Constante", nextId: "ruido_constante" },
      { label: "Intermitente", nextId: "ruido_intermitente" },
    ],
  },
  ruido_constante: {
    id: "ruido_constante",
    type: "result",
    title: "Ruido constante",
    resultText:
      "Posible ruido normal (paso de gas) o percepción del cliente. También puede ser compresor o motor fan evaporador/condensador.",
  },
  ruido_intermitente: {
    id: "ruido_intermitente",
    type: "result",
    title: "Ruido intermitente",
    resultText:
      "Posible deshielo, ice maker atorado, motor fan dañado/rozando con hielo o compresor.",
  },

  // ==========================
  // SUBÁRBOL: ¿Dónde hay frío? (pág 3)
  // ==========================
  cool_zona_frio: {
    id: "cool_zona_frio",
    type: "question",
    prompt: "¿El frío es normal o anómalo y en qué zona?",
    options: [
      { label: "Frío normal", nextId: "cool_goteo_o_ruido" },
      { label: "Frío anómalo", nextId: "cool_en_que_zona" },
    ],
  },
  cool_goteo_o_ruido: {
    id: "cool_goteo_o_ruido",
    type: "question",
    prompt: "¿Se nota goteo o ruido?",
    options: [
      { label: "Sí, goteo", nextId: "cool_goteo_sensores" },
      { label: "Ruido", nextId: "cool_ruido_root" },
    ],
  },
  cool_goteo_sensores: {
    id: "cool_goteo_sensores",
    type: "result",
    title: "Goteo",
    resultText:
      "Posible obstrucción de ductos o parámetros erróneos. Si no hay obstrucción: revisar sensores/bimetal/resistencia de deshielo.",
  },
  cool_en_que_zona: {
    id: "cool_en_que_zona",
    type: "question",
    prompt: "¿Dónde es anómalo el frío?",
    options: [
      { label: "En congelador o conservador", nextId: "cool_hay_frio_congelador" },
      { label: "En ambos", nextId: "cool_posible_compresor_perdida" },
    ],
  },
  cool_hay_frio_congelador: {
    id: "cool_hay_frio_congelador",
    type: "question",
    prompt: "¿Hay frío en el conservador aunque sea tenue?",
    options: [
      { label: "Sí", nextId: "cool_hay_frio_freezer" },
      { label: "No", nextId: "cool_posible_compresor_perdida" },
    ],
  },
  cool_hay_frio_freezer: {
    id: "cool_hay_frio_freezer",
    type: "question",
    prompt: "¿Hay frío en el congelador?",
    options: [
      { label: "Sí", nextId: "cool_posible_sensores_fan" },
      { label: "No", nextId: "cool_posible_compresor_perdida" },
    ],
  },
  cool_posible_sensores_fan: {
    id: "cool_posible_sensores_fan",
    type: "result",
    title: "Frío parcial",
    resultText:
      "Posible daño en sensores, motor fan (conservador o compresor) o pérdida de presión en compresor.",
  },
  cool_posible_compresor_perdida: {
    id: "cool_posible_compresor_perdida",
    type: "result",
    title: "Sin frío en zonas clave",
    resultText:
      "Posible fallo en compresor, main dañada o fuga de gas.",
  },
});
