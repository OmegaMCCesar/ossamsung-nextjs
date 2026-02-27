import React from 'react';

// Mapeos de Códigos (Se mantienen igual para no romper la lógica)
const YEARS = { H: 2016, J: 2017, K: 2018, M: 2019, N: 2020, R: 2021, T: 2022, W: 2023, X: 2024, Y: 2025 };
const MONTS = { "1": "Enero", "2": "Febrero", "3": "Marzo", "4": "Abril", "5": "Mayo", "6": "Junio", "7": "Julio", "8": "Agosto", "9": "Septiembre", "A": "Octubre", "B": "Noviembre", "C": "Diciembre" };
const MONTH_NUMBERS = { "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "A": 10, "B": 11, "C": 12 };

function addMonths(date, months) {
  const d = new Date(date.getTime());
  const targetMonth = d.getMonth() + months;
  d.setMonth(targetMonth);
  if (d.getMonth() !== ((targetMonth % 12) + 12) % 12) d.setDate(0);
  return d;
}

function formatDateES(d) {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit", month: "long", year: "numeric",
      timeZone: "America/Mexico_City",
    }).format(d);
  } catch { return d.toLocaleDateString(); }
}

const validarGarantia = (NS) => {
  if (!NS || NS.length !== 15) return { error: "Longitud incorrecta (se requieren 15 dígitos)." };

  const yearCode = NS.charAt(7).toUpperCase();
  const monthCode = NS.charAt(8).toUpperCase();

  const year = YEARS[yearCode];
  const monthName = MONTS[monthCode];
  const monthIndex = MONTH_NUMBERS[monthCode];

  if (!year || !monthName) return { error: "Código de año o mes no reconocido." };

  const fabricationDate = new Date(Date.UTC(year, monthIndex - 1, 2));
  const oneYearLater = addMonths(fabricationDate, 12);
  const expirationDate = new Date(oneYearLater.getTime());
  expirationDate.setUTCDate(3);

  const now = new Date();
  const isUnderWarranty = now < expirationDate;

  return { year, monthName, fabricationDate, expirationDate, isUnderWarranty, now };
};

const Validador = ({ numeroSerie }) => {
  const resultado = validarGarantia(numeroSerie);
  let esValido = !resultado.error;

  // Renderizado de Alertas de Estado
  const getHeaderStyles = () => {
    if (!esValido) return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    return resultado.isUnderWarranty 
      ? "bg-green-500/10 text-green-500 border-green-500/20" 
      : "bg-rose-500/10 text-rose-500 border-rose-500/20";
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Tarjeta Principal */}
      <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10 shadow-2xl">
        
        {/* Encabezado de Estado */}
        <div className={`mb-6 p-4 rounded-2xl border text-center font-black uppercase tracking-tighter text-sm ${getHeaderStyles()}`}>
          {!esValido ? (
            <span>{resultado.error}</span>
          ) : resultado.isUnderWarranty ? (
            <span>¡Equipo en Garantía! ✅</span>
          ) : (
            <span>Garantía Vencida ❌</span>
          )}
        </div>

        {esValido ? (
          <div className="space-y-4">
            {/* Detalles Técnicos */}
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Fecha de Fabricación</p>
                <p className="text-white font-bold text-sm">{formatDateES(resultado.fabricationDate)}</p>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                  {resultado.isUnderWarranty ? "Cubre hasta" : "Expiró el"}
                </p>
                <p className={`font-black text-sm ${resultado.isUnderWarranty ? 'text-green-400' : 'text-rose-400'}`}>
                  {formatDateES(resultado.expirationDate)}
                </p>
              </div>
            </div>

            {/* Aviso de 10 años / Compresor */}
            {!resultado.isUnderWarranty && (
              <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                <p className="text-[9px] leading-tight text-blue-400 font-medium">
                  * NOTA: Garantías de 10/20 años solo aplican a MOTOR e INVERTER COMPRESSOR previa validación.
                </p>
              </div>
            )}

            {/* Footer de consulta */}
            <div className="pt-4 border-t border-white/5 flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase tracking-wider">
              <span>Consulta ODS-SAMG</span>
              <span>{formatDateES(resultado.now)}</span>
            </div>
          </div>
        ) : (
          <p className="text-center text-xs text-slate-500 italic">Ingrese un número de serie de 15 dígitos para decodificar.</p>
        )}
      </div>
      
      {/* Guía Visual de Posiciones */}
      <div className="mt-4 p-4 bg-blue-600/10 rounded-2xl border border-blue-600/20">
         <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full">!</div>
            <p className="text-[10px] text-blue-300 font-bold leading-tight">
              Asegúrate de leer la etiqueta del producto. <br/>
              Año: Posición 8 | Mes: Posición 9.
            </p>
         </div>
      </div>
    </div>
  );
};

export default Validador;