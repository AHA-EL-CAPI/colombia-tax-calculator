// src/lib/brokers-data.ts

// 1. Interfaces Robusteccidas
export interface EscalaComision {
  limite_superior: number | null;
  tipo: 'fija' | 'porcentaje';
  valor: number;
}

export interface BrokerConfig {
  id: string; // Buena práctica: un ID único para iterar en React (keys)
  nombre: string;
  monto_minimo_compra: number;
  monto_minimo_venta: number;
  iva: number;
  escalas: EscalaComision[];
  costo_suscripcion_mensual?: number; // Opcional: Para brokers como Trii Pro
  costo_fijo_por_operacion?: number; // NUEVO: Para sumar ACH o mínimos internacionales
  notas_ui?: string; // Opcional: Para mostrar advertencias en la tarjeta ganadora
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
  }
];

// 3. Lógica de Cálculo (Devuelve la info completa para la UI)
export function calcularComision(monto: number, broker: BrokerConfig, tipoOperacion: 'compra' | 'venta' = 'compra') {
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

  // NUEVO CÁLCULO: Se calcula el IVA sobre la comisión base, y se suma el costo fijo (que no lleva IVA)
  const costoFinal = (costoBase * (1 + broker.iva)) + (broker.costo_fijo_por_operacion || 0);

  return {
    error: false,
    costoBase,
    costoFinal,
    // Devolvemos las propiedades especiales para que la UI decida qué hacer con ellas
    costo_suscripcion: broker.costo_suscripcion_mensual || 0,
    notas_adicionales: broker.notas_ui || null
  };
}