import styles from '../styles/Validador.module.css'

// Mapeos de Códigos
const YEARS = {H:2016 ,J:2017, K:2018, M:2019, N:2020, R:2021, T:2022, W:2023, X:2024, Y:2025}
const MONTS = {"1": "Enero", "2":"Febrero", "3":"Marzo", "4":"Abril", "5":"Mayo", "6":"Junio", "7":"Julio", "8":"Agosto", "9":"Septiembre", "A":"Octubre", "B": "Noviembre", "C":"Diciembre"}
const MONTH_NUMBERS = {"1": 1, "2":2, "3":3, "4":4, "5":5, "6":6, "7":7, "8":8, "9":9, "A":10, "B":11, "C":12}

/**
 * Añade exactamente 12 meses a la fecha (para 1 año de garantía).
 * Mantiene el día del mes.
 */
function addMonths(date, months) {
  const d = new Date(date.getTime());
  const targetMonth = d.getMonth() + months;
  d.setMonth(targetMonth);
  // Esta línea es crucial para evitar el desbordamiento de mes
  if (d.getMonth() !== ((targetMonth % 12) + 12) % 12) d.setDate(0);
  return d;
}

/**
 * Formatea una fecha completa (DD de Mes de YYYY) al estilo español (México).
 */
function formatDateES(d) {
    try {
        return new Intl.DateTimeFormat("es-MX", {
            day: "2-digit", month: "long", year: "numeric",
            timeZone: "America/Mexico_City",
        }).format(d);
    } catch { return d.toLocaleDateString(); }
}

/**
 * Formatea solo el Mes y Año (Mes de YYYY) al estilo español (México).
 */
function formatMonthYearES(d) {
    try {
        return new Intl.DateTimeFormat("es-MX", { 
            month: "long", year: "numeric", 
            timeZone: "America/Mexico_City" 
        }).format(d);
    } catch { 
        return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }); 
    }
}

// ----------------------------------------------------------------
// --- Lógica de Decodificación y Validación de Fechas (AUXILIAR) ---
// ----------------------------------------------------------------

const validarGarantia = (NS) => {
    
    if (!NS || NS.length !== 15) {
        return { error: "Longitud incorrecta." };
    }

    const yearCode = NS.charAt(7).toUpperCase(); // Posición 8
    const monthCode = NS.charAt(8).toUpperCase(); // Posición 9

    const year = YEARS[yearCode];
    const monthName = MONTS[monthCode];
    // Se resta 1 porque Date.UTC usa meses base 0 (Enero es 0)
    const monthIndex = MONTH_NUMBERS[monthCode] ; 
    
    if (!year || !monthName) {
        return { error: "Código de año o mes inválido." };
    }
    
    // 1. FECHA DE FABRICACIÓN: DÍA 1 del mes decodificado
    // Usamos el índice del mes (monthIndex) y el día 1
    const fabricationDate = new Date(Date.UTC(year, monthIndex - 1, 2)); 

    // 2. FECHA DE FIN DE GARANTÍA
    // Sumamos 12 meses a la fecha de fabricación. Esto nos da el DÍA 1 del mes de expiración.
    const oneYearLater = addMonths(fabricationDate, 12); 
    
    // Y luego establecemos el día 2 de ese mes como el último día cubierto.
    const expirationDate = new Date(oneYearLater.getTime());
    expirationDate.setUTCDate(3); // Establece el día 2 (24 horas después del inicio del mes)
    
    // 3. COMPARACIÓN CON LA FECHA ACTUAL
    const now = new Date();
    // La garantía es válida si la fecha actual es ANTERIOR a la fecha de expiración
    const isUnderWarranty = now < expirationDate;

    return { 
        year, 
        monthName,
        fabricationDate,
        expirationDate,
        isUnderWarranty,
        now: now
    };
}


// ----------------------------------------------------------------
// --- Componente Principal ---
// ----------------------------------------------------------------

const validador = (props) => {

    const NS = props.numeroSerie;
    const classNameOcultoOVisible = props.className;
    
    const resultado = validarGarantia(NS);

    let mensajeEstado = "";
    let mensajeFabricacion = "";
    let mensajeGarantia = "";
    let esValido = false;

    if (resultado.error) {
        mensajeEstado = `Serial Inválido: ${resultado.error}`;
    } else {
        esValido = true;
        
        // Información de fabricación (incluye el día 1)
        const inicioGarantiaCompleto = formatDateES(resultado.fabricationDate);
        const finGarantiaCompleto = formatDateES(resultado.expirationDate);

        mensajeFabricacion = `Fabricación/Inicio Garantía: ${inicioGarantiaCompleto}`;
        
        // Información de garantía
        if (resultado.isUnderWarranty) {
            mensajeEstado = "¡EN GARANTÍA! ✅";
            mensajeGarantia = `Cubierto hasta: ${finGarantiaCompleto}.`;
        } else {
            mensajeEstado = "GARANTÍA VENCIDA ❌, SI EL EQUIPO CUENTA CON GARANTIA DE 10 AÑOS ESTA SOLO SERA VALIDA EN MOTOR Y/O COMPRESOR";
            mensajeGarantia = `Venció: ${finGarantiaCompleto}.`;
        }
    }

    // Clases CSS
    const containerClass = classNameOcultoOVisible === 'oculto' ? styles.container : styles.containerOff;
    const estadoClass = esValido ? 
        (resultado.isUnderWarranty ? styles.garantiaValida : styles.garantiaVencida) : 
        styles.invalido;

    return(
        <div className={containerClass} >
            <h3 className={estadoClass}>
                {mensajeEstado}
            </h3>

            {esValido && (
                <div>
                    <p>{mensajeFabricacion}</p>
                    <p className={styles.muted}>
                        {mensajeGarantia}
                        <br/>
                        Fecha de consulta: {formatDateES(resultado.now)}
                    </p>
                </div>
            )}
            {!esValido && <p className={styles.muted}>{resultado.error}</p>}
        </div>
    )
}

export default validador;