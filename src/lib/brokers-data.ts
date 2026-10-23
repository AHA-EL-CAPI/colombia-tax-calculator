// src/lib/brokers-data.ts

// 1. Interfaces Robusteccidas
export interface EscalaComision {
  limite_superior: number | null;
  tipo: 'fija' | 'porcentaje';
  valor: number;
}

export interface BrokerConfig {
  id: string;
  nombre: string;
  monto_minimo_compra: number;
  monto_minimo_venta: number;
  iva: number;
  escalas: EscalaComision[];
  costo_suscripcion_mensual?: number;
  costo_fijo_por_operacion?: number;
  costo_retiro_fijo?: number; // Costo para traer dinero a cuenta Colombia
  notas_ui?: string;
  fuente: string;
}

// 2. Data Estática
export const brokers: BrokerConfig[] = [
  {
    id: "trii-basico",
    nombre: "Trii (Básico)",
    monto_minimo_compra: 0,
    monto_minimo_venta: 0,
    iva: 0.19,
    escalas: [
      { limite_superior: 5000000, tipo: "fija", valor: 12500 },
      { limite_superior: null, tipo: "porcentaje", valor: 0.0025 }
    ],
    fuente: "https://trii.co/"
  },
  {
    id: "trii-pro",
    nombre: "Trii Pro",
    monto_minimo_compra: 0,
    monto_minimo_venta: 0,
    iva: 0.19,
    costo_suscripcion_mensual: 34900,
    notas_ui: "Requiere pago mensual de $34.900. Ideal si haces múltiples operaciones al mes.",
    escalas: [
      { limite_superior: 5000000, tipo: "fija", valor: 6250 },
      { limite_superior: null, tipo: "porcentaje", valor: 0.00125 }
    ],
    fuente: "https://trii.co/trii-pro"
  },
  {
    id: "bancolombia-promo",
    nombre: "Bancolombia (eTrading - Promo)",
    monto_minimo_compra: 200000,
    monto_minimo_venta: 200000,
    iva: 0.19,
    escalas: [
      { limite_superior: 10000000, tipo: "fija", valor: 20000 },
      { limite_superior: null, tipo: "porcentaje", valor: 0.0020 }
    ],
    fuente: "Promoción actual eTrading"
  },
  {
    id: "bancolombia-std",
    nombre: "Bancolombia (eTrading - Estándar)",
    monto_minimo_compra: 1000000,
    monto_minimo_venta: 500000,
    iva: 0.19,
    escalas: [
      { limite_superior: 16700000, tipo: "fija", valor: 50000 },
      { limite_superior: null, tipo: "porcentaje", valor: 0.0030 }
    ],
    fuente: "Tarifario estándar eTrading"
  },
  {
    id: "davivienda-homebroker",
    nombre: "Davivienda Homebroker",
    monto_minimo_compra: 1000000,
    monto_minimo_venta: 1000000,
    iva: 0.19,
    escalas: [
      { limite_superior: 20000000, tipo: "fija", valor: 60000 },
      { limite_superior: 50000000, tipo: "porcentaje", valor: 0.0030 },
      { limite_superior: null, tipo: "porcentaje", valor: 0.0020 }
    ],
    fuente: "Tarifario Davivienda Homebroker"
  },
  {
    id: "ibkr-plenti-etf",
    nombre: "IBKR (Plenti - ETFs)",
    monto_minimo_compra: 0,
    monto_minimo_venta: 0,
    iva: 0, // Operaciones internacionales no tienen IVA
    costo_fijo_por_operacion: 13065, // $3.00 ACH + $0.35 Min Tiered a TRM $3.900
    notas_ui: "Asume TRM $3.900. Incluye Spread Plenti (~1.36%), envío ACH ($3 USD) y comisión min. IBKR Tiered ($0.35 USD). Asume compra de menos de 100 acciones (ej. ETFs o Blue Chips).",
    escalas: [
      { limite_superior: null, tipo: "porcentaje", valor: 0.013626 } // Spread Plenti base
    ],
    fuente: "https://www.interactivebrokers.com/en/pricing/commissions-stocks.php"
  },
  {
    id: "ibkr-plenti-std",
    nombre: "IBKR (Plenti - Standard)",
    monto_minimo_compra: 0,
    monto_minimo_venta: 0,
    iva: 0,
    costo_fijo_por_operacion: 19500, // $3.00 ACH + $2.00 Tiered variable a TRM $3.900
    notas_ui: "Asume TRM $3.900. Escenario conservador para compra de gran volumen de acciones baratas. Costo fijo estimado en $5 USD + Spread.",
    escalas: [
      { limite_superior: null, tipo: "porcentaje", valor: 0.013626 }
    ],
    fuente: "https://www.interactivebrokers.com/en/pricing/commissions-stocks.php"
  },
  {
    id: "xtb-latam",
    nombre: "XTB (Acciones Spot)",
    monto_minimo_compra: 39000,
    monto_minimo_venta: 39000,
    iva: 0,
    escalas: [
      { limite_superior: null, tipo: "porcentaje", valor: 0.005 }
    ],
    costo_retiro_fijo: 117000, // Promedio conservador de costos SWIFT intermediarios ($30 USD)
    notas_ui: "0% corretaje, pero aplica 0.5% spread. ¡PELIGRO! Retiros vía SWIFT pueden costar entre $58k y $195k COP por bancos intermediarios.",
    fuente: "https://www.xtb.com/lat/centro-de-ayuda/tarifas-y-comisiones"
  },
  {
    id: "etoro-colombia",
    nombre: "eToro (Monederos Locales)",
    monto_minimo_compra: 39000,
    monto_minimo_venta: 39000,
    iva: 0,
    costo_fijo_por_operacion: 0, // Acciones spot no cobran comisión fija por trade
    costo_retiro_fijo: 19500,    // $5 USD fijo
    escalas: [
      { limite_superior: null, tipo: "porcentaje", valor: 0.03 } // 3% conversión
    ],
    notas_ui: "El 3% de conversión de divisa al fondear es tu costo principal. Retiro fijo de $5 USD.",
    fuente: "https://www.etoro.com/es/trading/fees/conversion/"
  },
  {
    id: "hapi-pse",
    nombre: "Hapi (Fondeo PSE)",
    monto_minimo_compra: 3900,
    monto_minimo_venta: 3900,
    iva: 0,
    costo_fijo_por_operacion: 585, // Clearing fee ($0.15 USD)
    costo_retiro_fijo: 19500,      // $4.99 USD retiro local
    escalas: [
      { limite_superior: 1794000, tipo: "fija", valor: 11661 }, // Mínimo $2.99 USD PSE
      { limite_superior: null, tipo: "porcentaje", valor: 0.0065 } // 0.65% PSE
    ],
    notas_ui: "Eficiente para montos medios. Fondeo PSE tiene costo fijo mín. de $2.99 USD. Clearing fee por trade.",
    fuente: "https://help.hapi.trade/en/articles/8976002"
  }
];

// 3. Lógica de Cálculo (Devuelve la info completa para la UI)
export function calcularComision(monto: number, broker: BrokerConfig, tipoOperacion: 'compra' | 'venta' = 'compra', incluirSalida = false) {
  const minimoRequerido = tipoOperacion === 'compra' ? broker.monto_minimo_compra : broker.monto_minimo_venta;

  if (monto < minimoRequerido) {
    return { error: true, mensaje: `Monto mínimo: $${minimoRequerido.toLocaleString('es-CO')}` };
  }

  let costoBase = 0;
  for (const escala of broker.escalas) {
    if (escala.limite_superior === null || monto <= escala.limite_superior) {
      costoBase = escala.tipo === 'fija' ? escala.valor : monto * escala.valor;
      break;
    }
  }

  const costoTransaccional = (costoBase * (1 + broker.iva)) + (broker.costo_fijo_por_operacion || 0);
  const costo_suscripcion = broker.costo_suscripcion_mensual || 0;
  const costoFinal = costoTransaccional;
  const costoTotal = costoFinal + costo_suscripcion + (incluirSalida ? (broker.costo_retiro_fijo || 0) : 0);

  return {
    error: false,
    costoBase,
    costoTransaccional,
    costoFinal,
    costo_suscripcion,
    costoTotal,
    notas_adicionales: broker.notas_ui || null
  };
}