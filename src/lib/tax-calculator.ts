/**
 * ============================================================
 * MOTOR DE CÁLCULO – RETENCIÓN EN LA FUENTE
 * Metodología: ANUAL-FIRST · Arts. 241, 336, 383, 387 E.T.
 * Vigencia: 2025 y 2026
 * ============================================================
 */

export type AnioGravable = 2025 | 2026;

// ── CONSTANTES FISCALES ─────────────────────────────────────
interface ConstantesFiscales {
  UVT: number;
  SMMLV: number;
  AUX_TRANSPORTE: number;
  TASA_SALUD: number;
  TASA_PENSION: number;
  PORCENTAJE_RENTA_EXENTA: number;          // 25%
  TOPE_RENTA_EXENTA_UVT_ANUAL: number;     // 790 UVT
  PORCENTAJE_TECHO: number;                 // 40%
  TOPE_DEDUCCION_UVT_ANUAL: number;        // 1.340 UVT
  UMBRAL_DECLARAR_UVT: number;             // 1.400 UVT
  // Art. 387 – Deducción dependientes (DENTRO del 40%)
  TOPE_ART387_UVT_MES: number;             // 32 UVT/mes
  // Art. 336 – Deducción especial (FUERA del 40%)
  DEDUCCION_DEP_ART336_UVT_ANUAL: number;  // 72 UVT/dep/año
  MAX_DEPENDIENTES: number;                 // 4
  TOPE_VOLUNTARIOS_UVT_ANUAL: number;      // 3.800 UVT
}

export const CONSTANTES_2025: ConstantesFiscales = {
  UVT: 49_799,
  SMMLV: 1_423_500,
  AUX_TRANSPORTE: 200_000,
  TASA_SALUD: 0.04,
  TASA_PENSION: 0.04,
  PORCENTAJE_RENTA_EXENTA: 0.25,
  TOPE_RENTA_EXENTA_UVT_ANUAL: 790,
  PORCENTAJE_TECHO: 0.40,
  TOPE_DEDUCCION_UVT_ANUAL: 1_340,
  UMBRAL_DECLARAR_UVT: 1_400,
  TOPE_ART387_UVT_MES: 32,
  DEDUCCION_DEP_ART336_UVT_ANUAL: 72,
  MAX_DEPENDIENTES: 4,
  TOPE_VOLUNTARIOS_UVT_ANUAL: 3800,
} as const;

export const CONSTANTES_2026: ConstantesFiscales = {
  UVT: 52_374,
  SMMLV: 1_750_905,
  AUX_TRANSPORTE: 249_095,
  TASA_SALUD: 0.04,
  TASA_PENSION: 0.04,
  PORCENTAJE_RENTA_EXENTA: 0.25,
  TOPE_RENTA_EXENTA_UVT_ANUAL: 790,
  PORCENTAJE_TECHO: 0.40,
  TOPE_DEDUCCION_UVT_ANUAL: 1_340,
  UMBRAL_DECLARAR_UVT: 1_400,
  TOPE_ART387_UVT_MES: 32,
  DEDUCCION_DEP_ART336_UVT_ANUAL: 72,
  MAX_DEPENDIENTES: 4,
  TOPE_VOLUNTARIOS_UVT_ANUAL: 3800,
} as const;

export const CONSTANTES_POR_ANIO: Record<AnioGravable, ConstantesFiscales> = {
  2025: CONSTANTES_2025,
  2026: CONSTANTES_2026,
};

// ── UGPP Y COSTOS INDEPENDIENTES ────────────────────────────
export const PRESUNCION_COSTOS_UGPP: Record<string, number> = {
  "A. Agricultura, ganadería, caza, silvicultura y pesca": 0.6685,
  "B. Explotación de minas y canteras": 0.5639,
  "C. Industrias Manufactureras": 0.6234,
  "D. Suministro de electricidad, gas, vapor y aire acondicionado": 0.6030,
  "E. Distribución de Agua; Evacuación y Tratamiento de Aguas...": 0.6515,
  "F. Construccion": 0.6289,
  "G. Comercio al por mayor y al por menor, reparación de vehículos...": 0.6697,
  "H. Transporte y almacenamiento": 0.6379,
  "I. Alojamiento y servicios de comida": 0.6167,
  "J. Información y comunicaciones": 0.6117,
  "K. Actividades Financieras y de seguros": 0.6065,
  "L. Actividades inmobiliarias": 0.6173,
  "M. Actividades profesionales, científicas y técnicas": 0.6204,
  "N. Actividades de Servicios administrativos y de apoyo": 0.5910,
  "O. Administración pública y defensa...": 0.6525,
  "P. Educación": 0.6708,
  "Q. Actividades de atención de la salud humana y de asistencia social": 0.6324,
  "R. Actividades Artisticas de entretenimiento y recreación": 0.5692,
  "S. Otras actividades de servicios": 0.5633,
  "T. Actividades de los hogares individuales...": 0.5601,
  "U. Actividades de organizaciones y entidades extraterritoriales": 0.6426,
  "No Clasificados en otra parte": 0.6253,
  "Presunción Media": 0.6288,
  "Rentistas de Capital incluidos dividendos y participaciones": 0.2808,
  "Honorarios y Servicios Profesionales (No clasificados)": 0.0,
  "Costos Reales (Declarados con Soportes)": -1
};

export type ActividadIndependiente = keyof typeof PRESUNCION_COSTOS_UGPP;

// ── TABLA PROGRESIVA ART. 241 E.T. ──────────────────────────
interface TramoTabla {
  desde: number; hasta: number;
  marginal: number; baseUVT: number; cuotaFija: number;
}

export const TABLA_ART_241: TramoTabla[] = [
  { desde: 0,      hasta: 1_090,   marginal: 0.00, baseUVT: 0,      cuotaFija: 0      },
  { desde: 1_090,  hasta: 1_700,   marginal: 0.19, baseUVT: 1_090,  cuotaFija: 0      },
  { desde: 1_700,  hasta: 4_100,   marginal: 0.28, baseUVT: 1_700,  cuotaFija: 116    },
  { desde: 4_100,  hasta: 8_670,   marginal: 0.33, baseUVT: 4_100,  cuotaFija: 788    },
  { desde: 8_670,  hasta: 18_970,  marginal: 0.35, baseUVT: 8_670,  cuotaFija: 2_296  },
  { desde: 18_970, hasta: 31_000,  marginal: 0.37, baseUVT: 18_970, cuotaFija: 5_901  },
  { desde: 31_000, hasta: Infinity, marginal: 0.39, baseUVT: 31_000, cuotaFija: 10_352 },
];

// ── TABLA RETENCIÓN MENSUAL ART. 383 E.T. ───────────────────
export const TABLA_ART_383: TramoTabla[] = [
  { desde: 0,    hasta: 95,   marginal: 0.00, baseUVT: 0,   cuotaFija: 0   },
  { desde: 95,   hasta: 150,  marginal: 0.19, baseUVT: 95,  cuotaFija: 0   },
  { desde: 150,  hasta: 360,  marginal: 0.28, baseUVT: 150, cuotaFija: 10  },
  { desde: 360,  hasta: 640,  marginal: 0.33, baseUVT: 360, cuotaFija: 69  },
  { desde: 640,  hasta: 945,  marginal: 0.35, baseUVT: 640, cuotaFija: 162 },
  { desde: 945,  hasta: 2300, marginal: 0.37, baseUVT: 945, cuotaFija: 268 },
  { desde: 2300, hasta: Infinity, marginal: 0.39, baseUVT: 2300, cuotaFija: 770 },
];

function aplicarTablaArt383(baseUVTMensual: number): number {
  if (baseUVTMensual <= 0) return 0;
  for (const t of TABLA_ART_383) {
    if (baseUVTMensual >= t.desde && baseUVTMensual < t.hasta) {
      return t.cuotaFija + (baseUVTMensual - t.baseUVT) * t.marginal;
    }
  }
  const u = TABLA_ART_383[TABLA_ART_383.length - 1];
  return u.cuotaFija + (baseUVTMensual - u.baseUVT) * u.marginal;
}

// ── TIPOS DE RESULTADO ───────────────────────────────────────
export interface ResultadoCalculo {
  salarioMensual: number;
  anio: AnioGravable;
  numDependientes: number;
  constantes: ConstantesFiscales;

  // A – Ingresos
  calificaAuxilio: boolean;
  auxilioTransporteMensual: number;
  ingresoBrutoAnual: number;
  ingresosNoSalarialesMensual?: number;

  // B – Descuentos de ley
  descuentoSaludAnual: number;
  descuentoPensionAnual: number;
  totalDescuentosAnual: number;
  ingresoNetoAnual: number;

  // C – Renta exenta 25% (Art. 206 #10) — DENTRO del 40%
  rentaExentaBrutaAnual: number;
  topeRentaExentaAnual: number;
  rentaExentaAnual: number;
  topeRentaExentaActivo: boolean;

  // D – Deducción dependientes Art. 387 — DENTRO del 40%
  tieneArt387: boolean;
  deduccionArt387BrutaAnual: number;
  topeArt387Anual: number;
  deduccionArt387Anual: number;
  topeArt387Activo: boolean;

  // Medicina Prepagada y Seguros — DENTRO del 40%
  medicinaPrepagadaMensual: number;
  medicinaPrepagadaAnual: number;

  // Intereses de Vivienda — DENTRO del 40%
  interesesViviendaMensual: number;
  interesesViviendaAnual: number;

  // E – Control del techo 40%
  totalDeduccionesParaTecho: number;   // renta exenta + art387
  techo40Anual: number;
  topeDeduccion1340Anual: number;
  techoDeduccionFinalAnual: number;
  deduccionesCapadas: number;          // tras aplicar el techo
  topeTecho40Activo: boolean;
  cupoDisponibleAnual: number;         // espacio restante en el 40%
  porcentajeUsado: number;

  // Aportes Voluntarios (AFC / Pensiones)
  aportesVoluntariosMensual: number;
  aportesVoluntariosAnual: number;
  aportesVoluntariosRecortados: boolean;
  aporteSugerido: number;
  reduccionNecesaria: number;

  // F – Base gravable pre-Art. 336
  baseGravablePreArt336: number;
  baseGravablePreArt336UVT: number;

  // G – Deducción especial Art. 336 — FUERA del 40%
  tieneArt336: boolean;
  deduccionArt336Anual: number;        // 72 UVT × dep (máx 4)
  deduccionArt336AnualUVT: number;

  // H – Base gravable final
  baseGravableAnual: number;
  baseGravableAnualUVT: number;

  // I – Impuesto anual (Art. 241)
  impuestoAnualUVT: number;
  impuestoAnual: number;
  tramoMarginal: number;

  // Delta de Optimización (Ahorro Real)
  baseGravableOptimizada: number;
  impuestoOptimizadoAnual: number;
  ahorroTributarioAnual: number;
  ahorroTributarioMensual: number;


  // ── Mensuales (÷12) ────────────────────────────────────────
  ingresoBrutoMes: number;
  descuentoSaludMes: number;
  descuentoPensionMes: number;
  ingresoNetoMes: number;
  rentaExentaMes: number;
  deduccionArt387Mes: number;
  deduccionesCapadasMes: number;
  techoDeduccionMes: number;
  cupoDisponibleMes: number;
  deduccionArt336Mes: number;
  baseGravablePreArt336Mes: number;
  baseGravableMes: number;
  baseGravableMesUVT: number;
  impuestoMes: number;
  
  // Deducciones Adicionales
  deduccionGMFAnual?: number;
  deduccionFacturaAnual?: number;

  // ── Indicadores ───────────────────────────────────────────
  isImpuestoCero: boolean;
  obligadoDeclarar: boolean;

  // ── Campos Específicos para Independientes ────────────────
  isIndependiente?: boolean;
  actividadUGPP?: string;
  costosDeduciblesMes?: number;
  costosDeduciblesAnual?: number;
  costosUGPPMes?: number;
  costosUGPPAnual?: number;
  ingresoNetoSSMes?: number;
  ibcMes?: number;
  ibcAnual?: number;
  usandoIBCMinimo?: boolean; // TRUE cuando el IBC calculado < SMMLV y se aplica el piso legal
  tieneCapacidadDePago?: boolean;
  // ── Campos Auditables Mensual (Cascada 6 Pasos) ───────────
  ingresoNetoDIANAnual?: number; // Bruto - Salud - Pensión (base imponible DIAN anual)
  ingresoNetoDIANMes?: number;   // Bruto - Salud - Pensión (base imponible DIAN mensual)
  limiteLegalMensual?: number;   // min(40% ingresoNetoDIAN, 1.340 UVT/12)
  aporteAFCOptimoMes?: number;   // AFC óptimo algebraico para llenar exactamente el límite
  baseRentaExentaMes?: number;   // Base sobre la que se calcula el 25% (ingresoNetoDIAN - previas)
  // Ley 1393 de 2010 (Asalariados)
  totalDevengadoMes?: number;
  limite40Ley1393?: number;
  excesoLey1393?: number;
}

// ── FUNCIÓN PRINCIPAL ────────────────────────────────────────
export function calcularRetencion(
  salarioMensual: number,
  anio: AnioGravable = 2026,
  numDependientes: number = 0,
  aportesVoluntariosMensual: number = 0,
  medicinaPrepagadaMensual: number = 0,
  interesesViviendaMensual: number = 0,
  gmfAnual: number = 0,
  comprasFacturaElectronicaAnual: number = 0,
  ingresosNoSalarialesMensual: number = 0,
): ResultadoCalculo {
  const C = CONSTANTES_POR_ANIO[anio];
  const nDep = Math.min(Math.max(0, Math.floor(numDependientes)), C.MAX_DEPENDIENTES);

  // ── A: Ingreso Bruto Anual ───────────────────────────────
  const calificaAuxilio = salarioMensual <= 2 * C.SMMLV;
  const auxilioTransporteMensual = calificaAuxilio ? C.AUX_TRANSPORTE : 0;
  // El Ingreso Bruto Anual ahora incluye los ingresos no salariales porque son 100% gravados
  const ingresoBrutoAnual = (salarioMensual + ingresosNoSalarialesMensual + auxilioTransporteMensual) * 12;

  // Ley 1393 de 2010 (Regla del 40% para pagos no salariales)
  const totalDevengadoMes = salarioMensual + ingresosNoSalarialesMensual;
  const limite40Ley1393 = totalDevengadoMes * 0.40;
  const excesoLey1393 = Math.max(0, ingresosNoSalarialesMensual - limite40Ley1393);
  const ibcMensual = salarioMensual + excesoLey1393;

  // ── B: Descuentos de ley ─────────────────────────────────
  // Se calcula sobre el IBC (Base de Cotización) que considera la Ley 1393
  const descuentoSaludAnual   = ibcMensual * 12 * C.TASA_SALUD;
  const descuentoPensionAnual = ibcMensual * 12 * C.TASA_PENSION;
  const totalDescuentosAnual  = descuentoSaludAnual + descuentoPensionAnual;
  
  // El auxilio de transporte se resta porque es INCRGO (Ingreso No Constitutivo de Renta)
  const auxilioTransporteAnual = auxilioTransporteMensual * 12;
  const totalINCRGOAnual = totalDescuentosAnual + auxilioTransporteAnual;
  
  const ingresoNetoAnual = ingresoBrutoAnual - totalINCRGOAnual;

  // ── D: Deducción Dependientes Art. 387 – DENTRO del 40% ─
  const tieneArt387              = nDep > 0;
  const topeArt387Anual          = C.TOPE_ART387_UVT_MES * 12 * C.UVT; // 384 UVT/año
  const deduccionArt387BrutaAnual = tieneArt387 ? ingresoBrutoAnual * 0.10 : 0;
  const deduccionArt387Anual      = tieneArt387
    ? Math.min(deduccionArt387BrutaAnual, topeArt387Anual)
    : 0;
  const topeArt387Activo = tieneArt387 && deduccionArt387BrutaAnual > topeArt387Anual;

  // ── E: Control del Techo 40% ─────────────────────────────
  const medicinaPrepagadaValidaMensual = Math.min(medicinaPrepagadaMensual, 16 * C.UVT);
  const interesesViviendaValidaMensual = Math.min(interesesViviendaMensual, 100 * C.UVT);
  
  const medicinaPrepagadaAnual = medicinaPrepagadaValidaMensual * 12;
  const interesesViviendaAnual = interesesViviendaValidaMensual * 12;

  const aportesVoluntariosAnual = aportesVoluntariosMensual * 12;
  
  // Triple candado legal (Art. 126-1 y 126-4 E.T.)
  const limite30PorcientoAnual = ingresoBrutoAnual * 0.30;
  const limite3800UVTAnual = C.TOPE_VOLUNTARIOS_UVT_ANUAL * C.UVT;
  const aportesVoluntariosValidosAnual = Math.min(aportesVoluntariosAnual, limite30PorcientoAnual, limite3800UVTAnual);
  const aportesVoluntariosRecortados = aportesVoluntariosAnual > aportesVoluntariosValidosAnual;
  
  // ── C: Renta Exenta 25% (Art. 206 #10) – DENTRO del 40% ─
  const baseRentaExenta = Math.max(0, ingresoNetoAnual - deduccionArt387Anual - medicinaPrepagadaAnual - interesesViviendaAnual - aportesVoluntariosValidosAnual);
  const rentaExentaBrutaAnual = baseRentaExenta * C.PORCENTAJE_RENTA_EXENTA;
  const topeRentaExentaAnual  = C.TOPE_RENTA_EXENTA_UVT_ANUAL * C.UVT;
  const rentaExentaAnual      = Math.min(rentaExentaBrutaAnual, topeRentaExentaAnual);
  const topeRentaExentaActivo = rentaExentaBrutaAnual > topeRentaExentaAnual;

  const deduccionGMFAnual = gmfAnual * 0.5;
  const totalDeduccionesParaTechoSinAFC = rentaExentaAnual + deduccionArt387Anual + medicinaPrepagadaAnual + interesesViviendaAnual + deduccionGMFAnual;
  const totalDeduccionesParaTecho  = totalDeduccionesParaTechoSinAFC + aportesVoluntariosValidosAnual;
  const techo40Anual               = ingresoNetoAnual * C.PORCENTAJE_TECHO;
  const topeDeduccion1340Anual     = C.TOPE_DEDUCCION_UVT_ANUAL * C.UVT;
  
  // DOBLE CANDADO (Art. 336 E.T.)
  const topeRelativo = techo40Anual;
  const topeAbsoluto = topeDeduccion1340Anual;
  const limiteReal = Math.min(topeRelativo, topeAbsoluto);
  const beneficiosUsados = totalDeduccionesParaTecho;
  
  const cupoDisponibleAnualSinAFC = Math.max(0, limiteReal - totalDeduccionesParaTechoSinAFC);
  const cupoDisponibleMesSinAFC = cupoDisponibleAnualSinAFC / 12;
  
  const cupoDisponibleAnual = Math.max(0, limiteReal - beneficiosUsados);
  
  const techoDeduccionFinalAnual   = limiteReal;
  const deduccionesCapadas         = Math.min(totalDeduccionesParaTecho, techoDeduccionFinalAnual);
  const topeTecho40Activo          = totalDeduccionesParaTecho > techoDeduccionFinalAnual;
  const porcentajeUsado            = techoDeduccionFinalAnual > 0
    ? Math.min(100, (totalDeduccionesParaTecho / techoDeduccionFinalAnual) * 100)
    : 100;

  // ── F: Base Gravable Pre-Art. 336 ────────────────────────
  const baseGravablePreArt336    = Math.max(0, ingresoNetoAnual - deduccionesCapadas);
  const baseGravablePreArt336UVT = baseGravablePreArt336 / C.UVT;

  // ── G: Deducción Especial Art. 336 – FUERA del 40% ──────
  const tieneArt336          = nDep > 0;
  const deduccionArt336AnualUVT = tieneArt336 ? nDep * C.DEDUCCION_DEP_ART336_UVT_ANUAL : 0;
  const deduccionArt336Anual    = deduccionArt336AnualUVT * C.UVT;

  // ── H: Base Gravable Final ───────────────────────────────
  const deduccionFacturaAnual = Math.min(comprasFacturaElectronicaAnual * 0.01, 240 * C.UVT);
  const baseGravableAnual    = Math.max(0, baseGravablePreArt336 - deduccionArt336Anual - deduccionFacturaAnual);
  const baseGravableAnualUVT = baseGravableAnual / C.UVT;

  // ── I: Tabla Art. 241 ────────────────────────────────────
  const { impuestoUVT, tramoMarginal } = aplicarTablaArt241(baseGravableAnualUVT);
  const impuestoAnual    = Math.round(impuestoUVT * C.UVT);
  const impuestoAnualUVT = impuestoUVT;

  // ── Delta de Optimización (Ahorro Real) ───────────────
  const baseGravableOptimizada = Math.max(0, baseGravableAnual - cupoDisponibleAnual);
  const baseGravableOptimizadaUVT = baseGravableOptimizada / C.UVT;
  const { impuestoUVT: impuestoOptimizadoUVT } = aplicarTablaArt241(baseGravableOptimizadaUVT);
  const impuestoOptimizadoAnual = Math.round(impuestoOptimizadoUVT * C.UVT);
  const ahorroTributarioAnual = Math.max(0, impuestoAnual - impuestoOptimizadoAnual);
  const ahorroTributarioMensual = ahorroTributarioAnual / 12;

  // ── Mensuales ────────────────────────────────────────────

  // ── J: Retención Mensual (Art. 383) ──────────────────────
  const ingresoNetoMensual = ingresoNetoAnual / 12;
  const rentaExentaMes = rentaExentaAnual / 12;
  
  const deduccionArt387MensualReal = deduccionArt387Anual / 12; // Ya tiene el tope de 32 UVT anualizado
  
  const totalDeduccionesMesSinAFC = rentaExentaMes + deduccionArt387MensualReal + medicinaPrepagadaValidaMensual + interesesViviendaValidaMensual;
  const deduccionesCapadasMesSinAFC = Math.min(totalDeduccionesMesSinAFC, techo40Anual / 12);
  const baseGravableMesPre336SinAFC = ingresoNetoMensual - deduccionesCapadasMesSinAFC;
  const baseGravableMesSinAFC = Math.max(0, baseGravableMesPre336SinAFC);

  const totalDeduccionesMes = totalDeduccionesMesSinAFC + aportesVoluntariosMensual;
  const techo40Mes = ingresoNetoMensual * C.PORCENTAJE_TECHO;
  const deduccionesCapadasMesLocal = Math.min(totalDeduccionesMes, techo40Mes);
  
  const baseGravableMesPre336Local = ingresoNetoMensual - deduccionesCapadasMesLocal;
  
  const baseGravableMesFinal = Math.max(0, baseGravableMesPre336Local);
  const baseGravableMesUVT = baseGravableMesFinal / C.UVT;
  
  const retencionMensualUVT = aplicarTablaArt383(baseGravableMesUVT);
  const retencionMensualCOP = Math.round(retencionMensualUVT * C.UVT);

  // Lógica de Aporte Óptimo
  const metaRetencionCero = (1090 * C.UVT) / 12;
  const reduccionNecesaria = baseGravableMesSinAFC - metaRetencionCero;
  let aporteSugerido = 0;
  if (reduccionNecesaria > 0) {
    aporteSugerido = Math.min(reduccionNecesaria, cupoDisponibleMesSinAFC);
  }

  return {
    salarioMensual, anio, numDependientes: nDep, constantes: C,

    calificaAuxilio, auxilioTransporteMensual, ingresoBrutoAnual,
    descuentoSaludAnual, descuentoPensionAnual, totalDescuentosAnual, ingresoNetoAnual,
    ingresosNoSalarialesMensual,
    ibcMes: ibcMensual,

    rentaExentaBrutaAnual, topeRentaExentaAnual, rentaExentaAnual, topeRentaExentaActivo,

    tieneArt387, deduccionArt387BrutaAnual, topeArt387Anual,
    deduccionArt387Anual, topeArt387Activo,

    medicinaPrepagadaMensual,
    medicinaPrepagadaAnual,
    interesesViviendaMensual,
    interesesViviendaAnual,

    totalDeduccionesParaTecho, techo40Anual, topeDeduccion1340Anual,
    techoDeduccionFinalAnual, deduccionesCapadas, topeTecho40Activo,
    cupoDisponibleAnual, porcentajeUsado,

    aportesVoluntariosMensual,
    aportesVoluntariosAnual,
    aportesVoluntariosRecortados,
    aporteSugerido,
    reduccionNecesaria,

    baseGravablePreArt336, baseGravablePreArt336UVT,

    tieneArt336, deduccionArt336Anual, deduccionArt336AnualUVT,

    deduccionGMFAnual,
    deduccionFacturaAnual,

    baseGravableAnual, baseGravableAnualUVT,
    impuestoAnualUVT, impuestoAnual, tramoMarginal,
    baseGravableOptimizada, impuestoOptimizadoAnual,
    ahorroTributarioAnual, ahorroTributarioMensual,

    ingresoBrutoMes:          ingresoBrutoAnual / 12,
    descuentoSaludMes:        descuentoSaludAnual / 12,
    descuentoPensionMes:      descuentoPensionAnual / 12,
    ingresoNetoMes:           ingresoNetoMensual,
    rentaExentaMes:           rentaExentaMes,
    deduccionArt387Mes:       deduccionArt387MensualReal,
    deduccionesCapadasMes:    deduccionesCapadasMesLocal,
    techoDeduccionMes:        techo40Mes,
    cupoDisponibleMes:        cupoDisponibleAnual / 12,
    deduccionArt336Mes:       0,
    baseGravablePreArt336Mes: baseGravableMesPre336Local,
    baseGravableMes:          baseGravableMesFinal,
    baseGravableMesUVT:       baseGravableMesUVT,
    impuestoMes:              retencionMensualCOP,

    isImpuestoCero:  impuestoAnual <= 0,
    obligadoDeclarar: ingresoBrutoAnual > C.UMBRAL_DECLARAR_UVT * C.UVT,

    // Ley 1393 de 2010 (Asalariados)
    totalDevengadoMes,
    limite40Ley1393,
    excesoLey1393,
  };
}

// ── TABLA Art. 241 ───────────────────────────────────────────
function aplicarTablaArt241(baseUVT: number): { impuestoUVT: number; tramoMarginal: number } {
  if (baseUVT <= 0) return { impuestoUVT: 0, tramoMarginal: 0 };
  for (const t of TABLA_ART_241) {
    if (baseUVT >= t.desde && baseUVT < t.hasta) {
      return { impuestoUVT: t.cuotaFija + (baseUVT - t.baseUVT) * t.marginal, tramoMarginal: t.marginal };
    }
  }
  const u = TABLA_ART_241[TABLA_ART_241.length - 1];
  return { impuestoUVT: u.cuotaFija + (baseUVT - u.baseUVT) * u.marginal, tramoMarginal: u.marginal };
}

// ── FUNCIÓN INDEPENDIENTES ───────────────────────────────────
export function calcularRetencionIndependiente(
  ingresosBrutosMes: number,
  actividad: ActividadIndependiente,
  aplicaTabla383: boolean,
  tarifaRetencionPlana: number,
  anio: AnioGravable = 2026,
  numDependientes: number = 0,
  costosRealesCop?: number,
  aportesVoluntariosMensual: number = 0,
  medicinaPrepagadaMensual: number = 0,
  interesesViviendaMensual: number = 0,
  gmfAnual: number = 0,
  comprasFacturaElectronicaAnual: number = 0,
): ResultadoCalculo {
  const C = CONSTANTES_POR_ANIO[anio];
  const nDep = Math.min(Math.max(0, Math.floor(numDependientes)), C.MAX_DEPENDIENTES);

  const ingresoBrutoAnual = ingresosBrutosMes * 12;

  // 1. Asignación de Costos (Separación UGPP vs DIAN)
  // REGLA DE ORO: La presunción de costos solo existe para la UGPP (Seguridad Social).
  // Para la DIAN (Renta), si no hay soportes reales, el costo es CERO.
  const costosUGPPMes = actividad === "Costos Reales (Declarados con Soportes)"
    ? (costosRealesCop || 0)
    : ingresosBrutosMes * PRESUNCION_COSTOS_UGPP[actividad];
  const costosUGPPAnual = costosUGPPMes * 12;

  const costosDIANMes = actividad === "Costos Reales (Declarados con Soportes)"
    ? (costosRealesCop || 0)
    : 0;
  const costosDIANAnual = costosDIANMes * 12;

  // Para compatibilidad con la interfaz anterior
  const costosDeduciblesMes = costosDIANMes;
  const costosDeduciblesAnual = costosDIANAnual;

  // 2. IBC y Seguridad Social (Mensual y Anualizado)
  // Se usa costosUGPPMes para el cálculo de capacidad de pago e IBC
  const ingresoNetoSSMes = Math.max(0, ingresosBrutosMes - costosUGPPMes);
  const tieneCapacidadDePago = ingresoNetoSSMes >= C.SMMLV;

  let ibcMes = 0;
  let descuentoSaludMes = 0;
  let descuentoPensionMes = 0;
  let usandoIBCMinimo = false;

  if (!tieneCapacidadDePago) {
    ibcMes = 0;
    descuentoSaludMes = 0;
    descuentoPensionMes = 0;
  } else {
    ibcMes = ingresoNetoSSMes * 0.40;
    if (ibcMes < C.SMMLV) {
      // Piso legal: mínimo 1 SMMLV (Decreto 1601/2022)
      ibcMes = C.SMMLV;
      usandoIBCMinimo = true;
    } else if (ibcMes > 25 * C.SMMLV) {
      // Techo legal: máximo 25 SMMLV (Art. 5 Ley 100/1993)
      ibcMes = 25 * C.SMMLV;
    }
    // Salud (12.5%) y Pensión (16%) calculados sobre el IBC ya topado
    descuentoSaludMes = ibcMes * 0.125;
    descuentoPensionMes = ibcMes * 0.16;
  }

  const descuentoSaludAnual = descuentoSaludMes * 12;
  const descuentoPensionAnual = descuentoPensionMes * 12;
  const totalDescuentosAnual = descuentoSaludAnual + descuentoPensionAnual;

  const ibcAnual = ibcMes * 12;
  const ingresoNetoAnual = ingresoBrutoAnual - totalDescuentosAnual;

  // Renta Exenta 25% (Switch Exclusividad Art 336 y Método de Retención)
  const tieneCostosDIAN = costosDIANAnual > 0;

  // Deducción Dependientes Art 387
  const tieneArt387 = nDep > 0;
  const topeArt387Anual = C.TOPE_ART387_UVT_MES * 12 * C.UVT;
  const deduccionArt387BrutaAnual = tieneArt387 ? ingresoBrutoAnual * 0.10 : 0;
  const deduccionArt387Anual = tieneArt387 ? Math.min(deduccionArt387BrutaAnual, topeArt387Anual) : 0;
  const topeArt387Activo = tieneArt387 && deduccionArt387BrutaAnual > topeArt387Anual;

  // Control Techo 40%
  const medicinaPrepagadaValidaMensual = Math.min(medicinaPrepagadaMensual, 16 * C.UVT);
  const interesesViviendaValidaMensual = Math.min(interesesViviendaMensual, 100 * C.UVT);
  
  const medicinaPrepagadaAnual = medicinaPrepagadaValidaMensual * 12;
  const interesesViviendaAnual = interesesViviendaValidaMensual * 12;
  const aportesVoluntariosAnual = aportesVoluntariosMensual * 12;
  
  // Triple candado legal (Art. 126-1 y 126-4 E.T.)
  const limite30PorcientoAnual = ingresoBrutoAnual * 0.30;
  const limite3800UVTAnual = C.TOPE_VOLUNTARIOS_UVT_ANUAL * C.UVT;
  const aportesVoluntariosValidosAnual = Math.min(aportesVoluntariosAnual, limite30PorcientoAnual, limite3800UVTAnual);
  const aportesVoluntariosRecortados = aportesVoluntariosAnual > aportesVoluntariosValidosAnual;
  
  let rentaExentaBrutaAnual = 0;
  let rentaExentaAnual = 0;
  let topeRentaExentaActivo = false;
  const topeRentaExentaAnual = C.TOPE_RENTA_EXENTA_UVT_ANUAL * C.UVT;

  // Solo aplica si NO tiene costos presuntos/reales y usa tabla 383
  if (!tieneCostosDIAN && aplicaTabla383) {
    const baseRentaExenta = Math.max(0, ingresoNetoAnual - deduccionArt387Anual - medicinaPrepagadaAnual - interesesViviendaAnual - aportesVoluntariosValidosAnual);
    rentaExentaBrutaAnual = baseRentaExenta * C.PORCENTAJE_RENTA_EXENTA;
    rentaExentaAnual = Math.min(rentaExentaBrutaAnual, topeRentaExentaAnual);
    topeRentaExentaActivo = rentaExentaBrutaAnual > topeRentaExentaAnual;
  }

  const deduccionGMFAnual = gmfAnual * 0.5;
  const totalDeduccionesParaTechoSinAFC = rentaExentaAnual + deduccionArt387Anual + medicinaPrepagadaAnual + interesesViviendaAnual + deduccionGMFAnual;
  const totalDeduccionesParaTecho = totalDeduccionesParaTechoSinAFC + aportesVoluntariosValidosAnual;
  
  // Corrección: El ingreso neto para el 40% debe restar los costos procedentes (Art. 336 E.T.)
  // IMPORTANTE: Aquí se usa costosDIANAnual (reales o cero)
  const ingresoNetoDIAN = ingresoBrutoAnual - costosDIANAnual - totalDescuentosAnual;
  const techo40Anual = Math.max(0, ingresoNetoDIAN) * C.PORCENTAJE_TECHO;
  const topeDeduccion1340Anual = C.TOPE_DEDUCCION_UVT_ANUAL * C.UVT;
  
  // DOBLE CANDADO (Art. 336 E.T.)
  const topeRelativo = techo40Anual;
  const topeAbsoluto = topeDeduccion1340Anual;
  const limiteReal = Math.min(topeRelativo, topeAbsoluto);
  
  // Techo 40% mensualizado (Doble Candado)
  const topeRelativoMes = (Math.max(0, ingresoNetoDIAN) * 0.40) / 12;
  const topeAbsolutoMes = (1340 * C.UVT) / 12;
  const techo40Mes = Math.min(topeRelativoMes, topeAbsolutoMes);

  const beneficiosUsados = totalDeduccionesParaTecho;
  
  const cupoDisponibleAnualSinAFC = Math.max(0, limiteReal - totalDeduccionesParaTechoSinAFC);
  const cupoDisponibleMesSinAFC = cupoDisponibleAnualSinAFC / 12;
  
  const cupoDisponibleAnual = Math.max(0, limiteReal - beneficiosUsados);
  
  const techoDeduccionFinalAnual = limiteReal;
  const deduccionesCapadas = Math.min(totalDeduccionesParaTecho, techoDeduccionFinalAnual);
  const topeTecho40Activo = totalDeduccionesParaTecho > techoDeduccionFinalAnual;
  const porcentajeUsado = techoDeduccionFinalAnual > 0
    ? Math.min(100, (totalDeduccionesParaTecho / techoDeduccionFinalAnual) * 100)
    : 100;

  // Base Gravable Pre-Art. 336
  const baseGravablePreArt336 = Math.max(0, ingresoNetoAnual - deduccionesCapadas - costosDIANAnual);
  const baseGravablePreArt336UVT = baseGravablePreArt336 / C.UVT;

  // Deducción Especial Art 336 (Fuera del 40%)
  const tieneArt336 = nDep > 0;
  const deduccionArt336AnualUVT = tieneArt336 ? nDep * C.DEDUCCION_DEP_ART336_UVT_ANUAL : 0;
  const deduccionArt336Anual = deduccionArt336AnualUVT * C.UVT;

  // Base Gravable Final Anual
  const deduccionFacturaAnual = Math.min(comprasFacturaElectronicaAnual * 0.01, 240 * C.UVT);
  const baseGravableAnual = Math.max(0, baseGravablePreArt336 - deduccionArt336Anual - deduccionFacturaAnual);
  const baseGravableAnualUVT = baseGravableAnual / C.UVT;

  // Impuesto Anual Art 241
  const { impuestoUVT, tramoMarginal } = aplicarTablaArt241(baseGravableAnualUVT);
  const impuestoAnual = Math.round(impuestoUVT * C.UVT);
  const impuestoAnualUVT = impuestoUVT;

  // ── Delta de Optimización (Ahorro Real) ───────────────
  const baseGravableOptimizada = Math.max(0, baseGravableAnual - cupoDisponibleAnual);
  const baseGravableOptimizadaUVT = baseGravableOptimizada / C.UVT;
  const { impuestoUVT: impuestoOptimizadoUVT } = aplicarTablaArt241(baseGravableOptimizadaUVT);
  const impuestoOptimizadoAnual = Math.round(impuestoOptimizadoUVT * C.UVT);
  const ahorroTributarioAnual = Math.max(0, impuestoAnual - impuestoOptimizadoAnual);
  const ahorroTributarioMensual = ahorroTributarioAnual / 12;

  // 4. Retención Mensual (Procedimiento 1 adaptado)
  const ingresoNetoMensual = ingresoNetoAnual / 12;
  const deduccionArt387MensualReal = deduccionArt387Anual / 12;
  
  const totalDeduccionesMesSinAFC = (rentaExentaAnual + deduccionArt387Anual + medicinaPrepagadaAnual + interesesViviendaAnual) / 12;
  const deduccionesCapadasMesSinAFC = Math.min(totalDeduccionesMesSinAFC, techo40Mes);
  
  // costosDIANMes = 0 para presuntos (regla DIAN), por lo que la resta es segura en ambos casos
  const baseGravableMesPre336SinAFC = ingresoNetoMensual - costosDIANMes - deduccionesCapadasMesSinAFC;
  const deduccionArt336MesReal = deduccionArt336Anual / 12; // Mostrado en UI aunque no afecte retención mensual Art. 383
  const baseGravableMesSinAFC = Math.max(0, baseGravableMesPre336SinAFC);

  const totalDeduccionesMes = totalDeduccionesMesSinAFC + aportesVoluntariosMensual;
  const deduccionesCapadasMesLocal = Math.min(totalDeduccionesMes, techo40Mes);
  
  // costosDIANMes = 0 para presuntos → resta inocua; para costos reales → deduce correctamente
  const baseGravableMesPre336Local = ingresoNetoMensual - costosDIANMes - deduccionesCapadasMesLocal;
  
  const baseGravableMesFinal = Math.max(0, baseGravableMesPre336Local);
  const baseGravableMesUVT = baseGravableMesFinal / C.UVT;
  
  let retencionMensualCOP = 0;

  if (aplicaTabla383) {
    const retencionMensualUVT = aplicarTablaArt383(baseGravableMesUVT);
    retencionMensualCOP = Math.round(retencionMensualUVT * C.UVT);
  } else {
    retencionMensualCOP = Math.round(ingresosBrutosMes * tarifaRetencionPlana);
  }

  // Lógica de Aporte Óptimo
  const metaRetencionCero = (1090 * C.UVT) / 12;
  const reduccionNecesaria = baseGravableMesSinAFC - metaRetencionCero;
  let aporteSugerido = 0;
  if (reduccionNecesaria > 0) {
    aporteSugerido = Math.min(reduccionNecesaria, cupoDisponibleMesSinAFC);
  }

  // ── Campos Auditables Mensual (Cascada 6 Pasos) ──────────
  // ingresoNetoDIANMes: base DIAN real = Bruto - SS (costos presuntos NO restan aquí)
  const ingresoNetoDIANMes = ingresoNetoMensual; // ya es ingresoBruto - SS (sin costos presuntos DIAN)
  // limiteLegalMensual: doble candado del 40%
  const limiteLegalMensual = Math.min(ingresoNetoDIANMes * 0.40, (1340 * C.UVT) / 12);
  // deduccionesPrevias dentro del 40% (antes del AFC)
  const deduccionArt387MesPrev = deduccionArt387Anual / 12;
  const medPrep = medicinaPrepagadaValidaMensual;
  const intViv = interesesViviendaValidaMensual;
  const deduccionesPreviasMes = deduccionArt387MesPrev + medPrep + intViv;
  // Base para calcular la Renta Exenta del 25%
  const baseRentaExentaMes = Math.max(0, ingresoNetoDIANMes - aportesVoluntariosMensual - deduccionesPreviasMes);
  // AFC óptimo algebraico: el monto que, sumado a RE25% y previas, llena exactamente el límite
  // Ecuación: previas + AFC + RE25%(ingresoNeto - AFC - previas) = límite
  // Despejando AFC: AFC = (límite - RE25%*ingresoNeto - (1-RE25%)*previas) / (1 - RE25%) ... solo si costos DIAN = 0
  let aporteAFCOptimoMes = 0;
  if (!tieneCostosDIAN && aplicaTabla383) {
    const re = C.PORCENTAJE_RENTA_EXENTA; // 0.25
    const candidato = (limiteLegalMensual - re * ingresoNetoDIANMes - (1 - re) * deduccionesPreviasMes) / (1 - re);
    aporteAFCOptimoMes = Math.max(0, candidato);
  }

  return {
    isIndependiente: true,
    actividadUGPP: actividad,
    costosDeduciblesMes,
    costosDeduciblesAnual,
    costosUGPPMes,
    costosUGPPAnual,
    ingresoNetoSSMes,
    ibcMes,
    ibcAnual,
    usandoIBCMinimo,
    tieneCapacidadDePago,

    salarioMensual: ingresosBrutosMes, // proxy para UI
    anio, numDependientes: nDep, constantes: C,

    calificaAuxilio: false, auxilioTransporteMensual: 0, ingresoBrutoAnual,
    descuentoSaludAnual, descuentoPensionAnual, totalDescuentosAnual, ingresoNetoAnual,

    rentaExentaBrutaAnual, topeRentaExentaAnual, rentaExentaAnual, topeRentaExentaActivo,

    tieneArt387, deduccionArt387BrutaAnual, topeArt387Anual,
    deduccionArt387Anual, topeArt387Activo,

    medicinaPrepagadaMensual,
    medicinaPrepagadaAnual,
    interesesViviendaMensual,
    interesesViviendaAnual,

    totalDeduccionesParaTecho, techo40Anual, topeDeduccion1340Anual,
    techoDeduccionFinalAnual, deduccionesCapadas, topeTecho40Activo,
    cupoDisponibleAnual, porcentajeUsado,

    aportesVoluntariosMensual,
    aportesVoluntariosAnual,
    aportesVoluntariosRecortados,
    aporteSugerido,
    reduccionNecesaria,

    baseGravablePreArt336, baseGravablePreArt336UVT,

    tieneArt336, deduccionArt336Anual, deduccionArt336AnualUVT,

    deduccionGMFAnual,
    deduccionFacturaAnual,

    baseGravableAnual, baseGravableAnualUVT,
    impuestoAnualUVT, impuestoAnual, tramoMarginal,
    baseGravableOptimizada, impuestoOptimizadoAnual,
    ahorroTributarioAnual, ahorroTributarioMensual,

    ingresoBrutoMes:          ingresosBrutosMes,
    descuentoSaludMes,
    descuentoPensionMes,
    ingresoNetoMes:           ingresoNetoMensual,
    rentaExentaMes:           rentaExentaAnual / 12,
    deduccionArt387Mes:       deduccionArt387MensualReal,
    deduccionesCapadasMes:    deduccionesCapadasMesLocal,
    techoDeduccionMes:        techo40Mes,
    cupoDisponibleMes:        cupoDisponibleAnual / 12,
    deduccionArt336Mes:       deduccionArt336MesReal,
    baseGravablePreArt336Mes: baseGravableMesPre336Local,
    baseGravableMes:          baseGravableMesFinal,
    baseGravableMesUVT:       baseGravableMesUVT,
    impuestoMes:              retencionMensualCOP,

    // Cascada 6 Pasos (campos auditables)
    ingresoNetoDIANAnual:     ingresoNetoDIAN,
    ingresoNetoDIANMes,
    limiteLegalMensual,
    aporteAFCOptimoMes,
    baseRentaExentaMes,

    isImpuestoCero:  impuestoAnual <= 0,
    obligadoDeclarar: ingresoBrutoAnual > C.UMBRAL_DECLARAR_UVT * C.UVT,
  };
}

// ── UTILIDADES DE FORMATO ────────────────────────────────────
export function formatCOP(value: number): string {
  const safeValue = isNaN(value) ? 0 : value;
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(safeValue);
}
export function formatUVT(value: number): string { return `${value.toFixed(2)} UVT`; }
export function formatPercent(value: number): string { return `${(value * 100).toFixed(1)}%`; }

// ── SALARIO MÁGICO (Búsqueda Binaria) ────────────────────────
export function encontrarSalarioMagicoAsalariado(
  anio: AnioGravable,
  numDependientes: number,
  medicinaPrepagadaMensual: number = 0,
  interesesViviendaMensual: number = 0,
  porcentajeBonos: number = 0,
  maximizarAFC: boolean = false,
): number {
  let low = 0;
  let high = 50_000_000;
  let best = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const bonosMid = porcentajeBonos > 0 ? (mid * porcentajeBonos) / (1 - porcentajeBonos) : 0;
    
    let afcMid = 0;
    if (maximizarAFC) {
       const C = CONSTANTES_POR_ANIO[anio];
       afcMid = Math.min(mid * 0.30, (C.TOPE_VOLUNTARIOS_UVT_ANUAL * C.UVT) / 12);
    }

    const res = calcularRetencion(mid, anio, numDependientes, afcMid, medicinaPrepagadaMensual, interesesViviendaMensual, 0, 0, bonosMid);
    const C = CONSTANTES_POR_ANIO[anio];
    
    if (res.baseGravableAnual <= 1090 * C.UVT) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  
  return best;
}

export function encontrarSalarioMagicoIndependiente(
  actividad: ActividadIndependiente,
  aplicaTabla383: boolean,
  tarifaRetencionPlana: number,
  anio: AnioGravable,
  numDependientes: number,
  costosRealesCop: number = 0,
  medicinaPrepagadaMensual: number = 0,
  interesesViviendaMensual: number = 0,
  maximizarAFC: boolean = false,
): number {
  const C = CONSTANTES_POR_ANIO[anio];
  const targetBaseAnual = 1090 * C.UVT; // Límite inferior del tramo gravado (Art. 241)
  
  let low = 0;
  let high = 100_000_000; // 100M mensual como techo de búsqueda
  let best = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    
    // REGLA DE ORO: En el Salario Mágico, si no hay costos reales soportados, 
    // el costo para la DIAN es $0. Los presuntos de la UGPP NO se restan de la renta.
    const searchCostosDIAN = (actividad === "Costos Reales (Declarados con Soportes)") ? costosRealesCop : 0;

    let afcMid = 0;
    if (maximizarAFC) {
      // Para encontrar el máximo "Mágico", primero hallamos el cupo disponible
      // mediante una corrida previa sin aportes voluntarios.
      const resPre = calcularRetencionIndependiente(
        mid, actividad, aplicaTabla383, tarifaRetencionPlana, anio, numDependientes,
        searchCostosDIAN, 0, medicinaPrepagadaMensual, interesesViviendaMensual
      );
      afcMid = resPre.aporteAFCOptimoMes ?? 0;
    }

    const res = calcularRetencionIndependiente(
      mid, actividad, aplicaTabla383, tarifaRetencionPlana, anio, numDependientes, 
      searchCostosDIAN, afcMid, medicinaPrepagadaMensual, interesesViviendaMensual
    );
    
    // El objetivo es el salario bruto MÁS ALTO cuya Base Gravable Anual final 
    // siga siendo menor o igual al tramo exento de 1.090 UVT.
    if (res.baseGravableAnual <= targetBaseAnual + 10) { // Tolerancia por redondeo
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  
  return best;
}

export const TARIFAS_RST = {
  "1": { nombre: "Grupo 1: Tiendas, micromercados y peluquerías", tramos: [{ u: 6000, t: 0.012 }, { u: 15000, t: 0.028 }, { u: 30000, t: 0.044 }, { u: 100000, t: 0.056 }] },
  "2": { nombre: "Grupo 2: Comercio, industria y servicios técnicos", tramos: [{ u: 6000, t: 0.016 }, { u: 15000, t: 0.020 }, { u: 30000, t: 0.035 }, { u: 100000, t: 0.045 }] },
  "3": { nombre: "Grupo 3: Expendio de comidas, bebidas y transporte", tramos: [{ u: 6000, t: 0.031 }, { u: 15000, t: 0.034 }, { u: 30000, t: 0.040 }, { u: 100000, t: 0.045 }] },
  "4": { nombre: "Grupo 4: Servicios profesionales, consultoría y científicos", tramos: [{ u: 6000, t: 0.059 }, { u: 15000, t: 0.073 }, { u: 30000, t: 0.120 }, { u: 100000, t: 0.145 }] },
  "5": { nombre: "Grupo 5: Recolección y reciclaje de desechos", tramos: [{ u: 100000, t: 0.0162 }] }
};

export function calcularRST(ingresoBrutoAnual: number, grupo: keyof typeof TARIFAS_RST, uvt: number, smmlv: number) {
  const baseUvt = ingresoBrutoAnual / uvt;
  if (baseUvt > 100000) return null;

  const conf = TARIFAS_RST[grupo];
  let tarifa = conf.tramos[conf.tramos.length - 1].t;
  for (const tramo of conf.tramos) { if (baseUvt < tramo.u) { tarifa = tramo.t; break; } }

  const impuestoBruto = ingresoBrutoAnual * tarifa;
  const ibcPension = Math.max(Math.min(ingresoBrutoAnual * 0.40, 25 * smmlv * 12), smmlv * 12);
  const descuentoPension = ibcPension * 0.16;
  const descuentoElectronico = ingresoBrutoAnual * 0.005; // 0.5% bancarizado
  
  // Parágrafo 1 Art 908: +8% INC si es expendio de comidas/bebidas (Dentro del Grupo 3)
  // Nota: El usuario debe confirmar si es transporte o comida. Por defecto para Grupo 3, aplicar si es comida.
  const impuestoConsumo = (grupo === "3") ? ingresoBrutoAnual * 0.08 : 0;

  const descuentoPensionEfectivo = Math.min(descuentoPension, impuestoBruto);
  const impuestoNeto = Math.max(0, impuestoBruto - descuentoPensionEfectivo - descuentoElectronico) + impuestoConsumo;

  return { tarifa, impuestoBruto, descuentoPension: descuentoPensionEfectivo, descuentoElectronico, impuestoConsumo, impuestoNeto };
}

