import React, { useState } from 'react';
import styles from '../styles/ErrorsAndDiagnosis.module.css';
import Link from 'next/link';

// Base de datos de códigos de error Samsung: lavadora, refrigerador, horno.
// Fuente: manuales técnicos y soporte oficial de Samsung.

const ERROR_DB = {
  lavadora: {
    '5E': {
      title: 'Error de drenaje',
      meaning: 'La lavadora no drena el agua correctamente.',
      causes: [
        'Bomba de drenaje obstruida o dañada',
        'Filtro de desagüe sucio',
        'Manguera doblada o bloqueada',
        'Sensor de nivel de agua defectuoso'
      ],
      diagnosticSteps: [
        'Verificar si hay agua residual dentro del tambor',
        'Revisar y limpiar el filtro de drenaje',
        'Comprobar manguera de salida por obstrucciones',
        'Escuchar si la bomba de drenaje trabaja al inicio del ciclo de vaciado'
      ],
      correctiveActions: [
        'Limpiar filtro y mangueras',
        'Sustituir bomba si no gira o no tiene continuidad',
        'Verificar conexiones del sensor de nivel de agua'
      ]
    },
    'dE': {
      title: 'Error de puerta',
      meaning: 'La puerta no se cierra o no se detecta cerrada.',
      causes: [
        'Seguro de puerta dañado',
        'Sensor de cierre defectuoso',
        'Bloqueo mecánico o goma desalineada'
      ],
      diagnosticSteps: [
        'Inspeccionar cierre y goma de la puerta',
        'Probar seguro de puerta (continuidad en modo cerrado)',
        'Revisar conexión entre seguro y placa principal'
      ],
      correctiveActions: [
        'Reemplazar seguro si no activa señal de cierre',
        'Ajustar alineación de la puerta',
        'Revisar placa de control si no recibe señal del seguro'
      ]
    },
    'tE': {
      title: 'Error del sensor de temperatura',
      meaning: 'Lectura de temperatura anómala o sin señal del termistor.',
      causes: [
        'Sensor de temperatura dañado',
        'Cable o conector del sensor roto o suelto',
        'Placa de control defectuosa'
      ],
      diagnosticSteps: [
        'Medir resistencia del sensor (debe variar según temperatura)',
        'Verificar continuidad del cableado',
        'Probar con sensor nuevo si no hay lectura'
      ],
      correctiveActions: [
        'Reemplazar termistor',
        'Reparar conexiones dañadas',
        'Sustituir placa principal si no recibe señal'
      ]
    }
  },

  refrigerador: {
    '5E': {
      title: 'Error del sensor de descongelamiento',
      meaning: 'El sensor del sistema de descongelamiento del refrigerador da lectura incorrecta o abierta.',
      causes: [
        'Sensor de descongelamiento defectuoso',
        'Cableado roto o suelto',
        'Placa principal con lectura errónea'
      ],
      diagnosticSteps: [
        'Medir resistencia del sensor (debe estar entre 5–20 kΩ a temperatura ambiente)',
        'Inspeccionar cableado y conectores',
        'Revisar visualmente acumulación de hielo excesiva en el evaporador'
      ],
      correctiveActions: [
        'Reemplazar sensor de descongelamiento',
        'Reparar o sustituir conectores',
        'Descongelar manualmente y reiniciar equipo'
      ]
    },
    '84C': {
  title: 'Error de compresor (inverter o arranque fallido)',
  meaning: 'El sistema detecta que el compresor no inicia correctamente o presenta una falla en el circuito de control.',
  causes: [
    'Falla en el módulo inverter del compresor',
    'Compresor bloqueado mecánicamente',
    'Voltaje de entrada inestable o bajo',
    'Placa principal (PCB) dañada',
    'Falla en el sensor de temperatura que impide el arranque'
  ],
  diagnosticSteps: [
    'Desconectar el refrigerador por 5–10 minutos para reiniciar el sistema',
    'Escuchar si el compresor intenta arrancar o hace clic repetitivo',
    'Verificar voltaje de entrada (110–127V) y la conexión a tierra',
    'Inspeccionar el módulo inverter y el compresor por signos de sobrecalentamiento o daño',
    'Medir continuidad entre los terminales del compresor (valores equilibrados entre bobinas)',
    'Revisar la placa principal y conexiones hacia el inverter'
  ],
  correctiveActions: [
    'Reiniciar el equipo y verificar si el error desaparece',
    'Reemplazar el módulo inverter si no hay respuesta del compresor',
    'Sustituir el compresor si está bloqueado o sin continuidad',
    'Revisar o cambiar la PCB principal si no envía señal de arranque',
    'Usar regulador de voltaje si la alimentación es inestable'
  ]
}
,
    '33E': {
      title: 'Error del calentador de tubería de hielo',
      meaning: 'Falla en el calentador del ducto del ice maker.',
      causes: [
        'Elemento calefactor abierto o sin continuidad',
        'Conector del calentador desconectado',
        'Fallo en el relé o salida de la placa principal'
      ],
      diagnosticSteps: [
        'Medir continuidad del calentador (Ω)',
        'Verificar alimentación cuando se activa ciclo de hielo',
        'Probar otro calentador para descartar componente'
      ],
      correctiveActions: [
        'Sustituir calentador',
        'Reparar cableado o conexión',
        'Revisar salida de control de placa'
      ]
    },
    '14E': {
      title: 'Error del sensor del fabricador de hielo',
      meaning: 'Lectura fuera de rango o sin señal del sensor del ice maker.',
      causes: [
        'Sensor dañado o mal conectado',
        'Ice maker con escarcha o bloqueado',
        'Placa principal defectuosa'
      ],
      diagnosticSteps: [
        'Revisar bloque de hielo en el compartimento del ice maker',
        'Medir resistencia del sensor',
        'Verificar conexión entre módulo de hielo y main board'
      ],
      correctiveActions: [
        'Descongelar y limpiar',
        'Reemplazar sensor',
        'Revisar main board si persiste error'
      ]
    }
  },

  horno: {
    'C-20': {
      title: 'Error de sensor de temperatura del horno',
      meaning: 'El sensor de temperatura del horno está fuera de rango.',
      causes: [
        'Sensor roto o fuera de especificación',
        'Cableado con mala conexión',
        'Fallo de placa de control'
      ],
      diagnosticSteps: [
        'Medir resistencia del sensor (aprox. 1080 Ω a 25°C)',
        'Verificar conectores del sensor en placa',
        'Inspeccionar visualmente daño en el arnés'
      ],
      correctiveActions: [
        'Reemplazar sensor',
        'Reparar conexiones',
        'Cambiar placa si no hay lectura'
      ]
    },
    'C-F1': {
      title: 'Error EEPROM',
      meaning: 'Error de lectura o escritura en la memoria EEPROM.',
      causes: [
        'Firmware corrupto',
        'Fallo interno en la placa principal'
      ],
      diagnosticSteps: [
        'Apagar horno por 2 minutos y reiniciar',
        'Si persiste, revisar alimentación y placa',
        'Verificar si existe actualización de firmware'
      ],
      correctiveActions: [
        'Actualizar firmware si disponible',
        'Reemplazar main board'
      ]
    },
    'dE': {
      title: 'Error de puerta',
      meaning: 'Puerta no cerrada o sensor de cierre fallando.',
      causes: [
        'Microinterruptor dañado',
        'Bloqueo mecánico',
        'Cableado desconectado'
      ],
      diagnosticSteps: [
        'Verificar microinterruptor con multímetro',
        'Revisar bisagras y ajuste de puerta',
        'Comprobar cableado hacia la placa'
      ],
      correctiveActions: [
        'Reemplazar microinterruptor',
        'Ajustar puerta',
        'Reparar cableado'
      ]
    }
  }
};

const ErrorsAndDiagnosis = () => {
  const [appliance, setAppliance] = useState('lavadora');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [notFoundMessage, setNotFoundMessage] = useState('');

  function handleSearch(e) {
    e.preventDefault();
    setNotFoundMessage('');
    const db = ERROR_DB[appliance] || {};
    const code = query.trim().toUpperCase();
    const found = db[code];

    if (found) {
      setResult({ code, ...found });
    } else {
      setResult(null);
      setNotFoundMessage(`Código "${code}" no encontrado en la base de datos de ${appliance}.`);
    }
  }

  return (
    <div className={styles.principalContainer}>
        <Link href="/"className={styles.backButton}>← Volver</Link>
      <h2>Diagnóstico Samsung — {appliance.charAt(0).toUpperCase() + appliance.slice(1)}</h2>

      <form onSubmit={handleSearch} className={styles.form}>
        <label>
          Tipo de equipo:
          <select value={appliance} onChange={(e) => setAppliance(e.target.value)} className={styles.select}>
            <option value="lavadora">Lavadora</option>
            <option value="refrigerador">Refrigerador</option>
            <option value="horno">Horno</option>
          </select>
        </label>

        <input
          className={styles.input}
          type="text"
          placeholder="Introduce código de error (ej. 5E, dE, C-20)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className={styles.button} type="submit">Buscar</button>
      </form>

      {notFoundMessage && <p className={styles.notFound}>{notFoundMessage}</p>}

      {result && (
        <section className={styles.resultCard}>
          <h3>{result.code} — {result.title}</h3>
          <p><strong>Significado:</strong> {result.meaning}</p>

          <h4>Causas posibles</h4>
          <ul>
            {result.causes.map((c, i) => <li key={i}>{c}</li>)}
          </ul>

          <h4>Pasos de diagnóstico</h4>
          <ol>
            {result.diagnosticSteps.map((d, i) => <li key={i}>{d}</li>)}
          </ol>

          <h4>Acciones correctivas</h4>
          <ol>
            {result.correctiveActions.map((a, i) => <li key={i}>{a}</li>)}
          </ol>

          <footer>
            <small>Referencia: Manuales de servicio Samsung y soporte técnico oficial.</small>
          </footer>
        </section>
      )}
    </div>
  );
};

export default ErrorsAndDiagnosis;
