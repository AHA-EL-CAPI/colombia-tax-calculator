// src/lib/brokers-data.ts

// 1. Interfaces Robusteccidas
export interface EscalaComision {
  limite_superior: number | null;
  tipo: 'fija' | 'porcentaje';
  valor: number;
}

export interface BrokerConfig {
  id: string; // Buena pr├íctica: un ID ├║nico para iterar en React (keys)
  nombre: string;
  monto_minimo_compra: number;
  monto_minimo_venta: number;
  iva: number;
  escalas: EscalaComision[];
  costo_suscripcion_mensual?: number; // Opcional: Para brokers como Trii Pro
  costo_fijo_por_operacion?: number; // NUEVO: Para sumar ACH o m├¡nimos internacionales
  notas_ui?: string; // Opcional: Para mostrar advertencias en la tarjeta ganadora
  fuente: string;
}

// 2. Data Est├ítica
export const brokers: BrokerConfig[] = [
  {
    id: "trii-basico",
    nombre: "Trii (B├ísico)",
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
    notas_ui: "Requiere pago mensual de $34.900. Ideal si haces m├║ltiples operaciones al mes.",
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
    fuente: "Promoci├│n actual eTrading"
  },
  {
    id: "bancolombia-std",
    nombre: "Bancolombia (eTrading - Est├índar)",
    monto_minimo_compra: 1000000,
    monto_minimo_venta: 500000,
    iva: 0.19,
    escalas: [
      { limite_superior: 16700000, tipo: "fija", valor: 50000 },
      { limite_superior: null, tipo: "porcentaje", valor: 0.0030 }
    ],
    fuente: "Tarifario est├índar eTrading"
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
    notas_ui: "Asume TRM $3.900. Incluye Spread Plenti (~1.36%), env├¡o ACH ($3 USD) y comisi├│n min. IBKR Tiered ($0.35 USD). Asume compra de menos de 100 acciones (ej. ETFs o Blue Chips).",
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
    monto_minimo_compra: 39000, // Aprox $10 USD m├¡nimo operativo
    monto_minimo_venta: 39000,
    iva: 0,
    escalas: [
      { limite_superior: null, tipo: "porcentaje", valor: 0.005 } // 0.5% de tipo de cambio / FX markup oculto por operaci├│n
    ],
    notas_ui: "Corretaje 0% hasta 100k EUR/mes, pero aplica un 0.5% de spread cambiario por operaci├│n. Retiros menores a $50 USD cobran una penalidad alta de $30 USD (~117,000 COP).",
    fuente: "https://xas-new-cdn.xtb.com/file/0104/57/79b44b80-d317-4b24-96b1-a1b9736251d0/latam-tabla-de-comisiones-abril-29-2026-docx.pdf"
  },
  {
    id: "etoro-colombia",
    nombre: "eToro (Monederos Locales)",
    monto_minimo_compra: 39000, // $10 USD por posici├│n
    monto_minimo_venta: 39000,
    iva: 0,
    escalas: [
      { limite_superior: null, tipo: "porcentaje", valor: 0.03 } // 3% de comisi├│n por conversi├│n en pasarelas/monederos para Colombia
    ],
    notas_ui: "Acciones reales a 0% de comisi├│n. El costo cr├¡tico es el 3% por conversi├│n al depositar mediante pasarelas disponibles en Colombia. Retiro fijo de $5 USD y tarifa de inactividad de $10 USD/mes tras 1 a├▒o.",
    fuente: "https://www.etoro.com/es/trading/fees/conversion/"
  },
  {
    id: "hapi-pse",
    nombre: "Hapi (Fondeo PSE)",
    monto_minimo_compra: 3900, // $1 USD permite fracciones
    monto_minimo_venta: 3900,
    iva: 0,
    costo_fijo_por_operacion: 585, // $0.15 USD de clearing por operaci├│n fraccionaria a TRM $3.900
    escalas: [
      { limite_superior: null, tipo: "porcentaje", valor: 0.017 } // ~1.7% promedio de comisi├│n de dep├│sito por red local/PSE
    ],
    notas_ui: "Sin comisi├│n de corretaje, pero el fondeo por PSE cuesta ~1.7%. Aplica cobro de clearing de $0.10 o $0.15 USD por transacci├│n. Mantenimiento de $4.99 USD/mes solo si la cuenta tiene menos de $100 y pasa 60 d├¡as inactiva.",
    fuente: "https://help.hapi.trade/en/articles/8976002-understanding-the-clearing-house-fee-and-other-fees-on-hapi"
  },
  {
    id: 'xtb-standard',
    nombre: 'XTB',
    monto_minimo_compra: 39000,
    monto_minimo_venta: 39000,
    iva: 0,
    escalas: [
      {
        limite_superior: null,
        tipo: 'porcentaje',
        valor: 0
      }
    ],
    notas_ui: '0% de comisi├│n en acciones al contado hasta 100,000 EUR/mes. Retiros menores a $50 USD incurren en una tarifa fija de $30 USD (aprox. 117,000 COP). Posibles spreads de cambio si se fondea en COP.',
    fuente: 'https://xas-new-cdn.xtb.com/file/0104/57/79b44b80-d317-4b24-96b1-a1b9736251d0/latam-tabla-de-comisiones-abril-29-2026-docx.pdf'
  },
  {
    id: 'etoro-standard',
    nombre: 'eToro',
    monto_minimo_compra: 39000,
    monto_minimo_venta: 39000,
    iva: 0,
    escalas: [
      {
        limite_superior: null,
        tipo: 'porcentaje',
        valor: 0.015
      }
    ],
    notas_ui: 'Cero comisiones en acciones reales (sin apalancamiento). Retiros tienen cobro fijo de $5 USD (19,500 COP). Inactividad penalizada con $10 USD/mes tras 1 a├▒o. Spreads cambiarios cargados al fondear.',
    fuente: 'https://www.etoro.com/es/trading/fees/?f2&Task=Click'
  },
  {
    id: 'hapi-standard',
    nombre: 'Hapi',
    monto_minimo_compra: 3900,
    monto_minimo_venta: 3900,
    iva: 0,
    escalas: [
      {
        limite_superior: null,
        tipo: 'porcentaje',
        valor: 0
      }
    ],
    costo_fijo_por_operacion: 585,
    notas_ui: 'Cobra "clearing fee" de $0.10 USD (enteras) o $0.15 USD (fracciones) por trade. Inactividad de $4.99 USD/mes si balance < $100 y 60+ d├¡as sin operar. Dep├│sitos/retiros var├¡an seg├║n m├⌐todo (cripto o transfer).',
    fuente: 'https://help.hapi.trade/en/articles/8976002-understanding-the-clearing-house-fee-and-other-fees-on-hapi'
  }
];

// 3. L├│gica de C├ílculo (Devuelve la info completa para la UI)
export function calcularComision(monto: number, broker: BrokerConfig, tipoOperacion: 'compra' | 'venta' = 'compra') {
  const minimoRequerido = tipoOperacion === 'compra' ? broker.monto_minimo_compra : broker.monto_minimo_venta;

  if (monto < minimoRequerido) {
    return { error: true, mensaje: `Monto m├¡nimo: $${minimoRequerido.toLocaleString('es-CO')}` };
  }

  let costoBase = 0;
  for (const escala of broker.escalas) {
    if (escala.limite_superior === null || monto <= escala.limite_superior) {
      costoBase = escala.tipo === 'fija' ? escala.valor : monto * escala.valor;
      break;
    }
  }

  // NUEVO C├üLCULO: Se calcula el IVA sobre la comisi├│n base, y se suma el costo fijo (que no lleva IVA)
  const costoFinal = (costoBase * (1 + broker.iva)) + (broker.costo_fijo_por_operacion || 0);

  return {
    error: false,
    costoBase,
    costoFinal,
    // Devolvemos las propiedades especiales para que la UI decida qu├⌐ hacer con ellas
    costo_suscripcion: broker.costo_suscripcion_mensual || 0,
    notas_adicionales: broker.notas_ui || null
  };
}
