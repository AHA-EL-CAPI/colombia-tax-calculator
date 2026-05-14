"use client";

import { useMemo } from "react";
import { formatCOP, CONSTANTES_POR_ANIO, PRESUNCION_COSTOS_UGPP, encontrarSalarioMagicoIndependiente, calcularRetencionIndependiente, TARIFAS_RST } from "@/lib/tax-calculator";
import type { AnioGravable, ActividadIndependiente } from "@/lib/tax-calculator";
import { DependientesInput } from "@/components/DependientesInput";

const MAPEO_UGPP_A_RST: Record<string, keyof typeof TARIFAS_RST> = {
  "A. Agricultura, ganadería, caza, silvicultura y pesca": "2",
  "B. Explotación de minas y canteras": "2",
  "C. Industrias Manufactureras": "2",
  "D. Suministro de electricidad, gas, vapor y aire acondicionado": "2",
  "E. Distribución de Agua; Evacuación y Tratamiento de Aguas...": "2",
  "F. Construccion": "2",
  "G. Comercio al por mayor y al por menor, reparación de vehículos...": "2",
  "H. Transporte y almacenamiento": "3",
  "I. Alojamiento y servicios de comida": "3",
  "J. Información y comunicaciones": "2",
  "K. Actividades Financieras y de seguros": "2",
  "L. Actividades inmobiliarias": "2",
  "M. Actividades profesionales, científicas y técnicas": "4",
  "N. Actividades de Servicios administrativos y de apoyo": "2",
  "O. Administración pública y defensa...": "2",
  "P. Educación": "4",
  "Q. Actividades de atención de la salud humana y de asistencia social": "4",
  "R. Actividades Artisticas de entretenimiento y recreación": "2",
  "S. Otras actividades de servicios": "2",
  "T. Actividades de los hogares individuales...": "2",
  "U. Actividades de organizaciones y entidades extraterritoriales": "2",
  "No Clasificados en otra parte": "2",
  "Presunción Media": "2",
  "Rentistas de Capital incluidos dividendos y participaciones": "2"
};

export function useSalarioMagicoRST(anio: AnioGravable, actividadUGPP: ActividadIndependiente) {
  const C = CONSTANTES_POR_ANIO[anio];
  const uvt = C.UVT;
  const smmlv = C.SMMLV;

  const porcentajeUGPP = PRESUNCION_COSTOS_UGPP[actividadUGPP] || 0;
  const grupoRST = MAPEO_UGPP_A_RST[actividadUGPP] || "2";

  function getExpression(G: number) {
    const costosPresuntos = G * porcentajeUGPP;
    const ingresoNetoUgpp = G - costosPresuntos;
    const ibc = Math.max(ingresoNetoUgpp * 0.40, smmlv);
    
    const salud = ibc * 0.125;
    
    const baseGravableRST = Math.max(0, G - salud);
    const baseGravableRSTAnual = baseGravableRST * 12;
    const baseUvt = baseGravableRSTAnual / uvt;
    
    const conf = TARIFAS_RST[grupoRST as keyof typeof TARIFAS_RST];
    let tarifa = conf.tramos[conf.tramos.length - 1].t;
    for (const tramo of conf.tramos) {
      if (baseUvt < tramo.u) {
        tarifa = tramo.t;
        break;
      }
    }
    
    const impuestoBrutoAnual = baseGravableRSTAnual * tarifa;
    const descuentoPensionAnual = ibc * 0.16 * 12;
    const descuentoElectronicoAnual = G * 12 * 0.005;
    
    const impuestoNetoAnual = impuestoBrutoAnual - descuentoPensionAnual - descuentoElectronicoAnual;
    return impuestoNetoAnual;
  }

  let low = 0;
  let high = 100000000; // 100 millones mensual
  let optimalG = 0;

  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    if (getExpression(mid) <= 0) {
      optimalG = mid;
      low = mid;
    } else {
      high = mid;
    }
  }

  const costosPresuntos = optimalG * porcentajeUGPP;
  const ingresoNetoUgpp = optimalG - costosPresuntos;
  const ibc = Math.max(ingresoNetoUgpp * 0.40, smmlv);
  const salud = ibc * 0.125;
  const pensionTotal = ibc * 0.16;
  const pensionDescuento = ibc * 0.16;
  
  const baseGravableRST = Math.max(0, optimalG - salud);
  const baseGravableRSTAnual = baseGravableRST * 12;
  const baseUvt = baseGravableRSTAnual / uvt;

  const conf = TARIFAS_RST[grupoRST as keyof typeof TARIFAS_RST];
  let tarifa = conf.tramos[conf.tramos.length - 1].t;
  for (const tramo of conf.tramos) {
    if (baseUvt < tramo.u) {
      tarifa = tramo.t;
      break;
    }
  }

  const impuestoBrutoAnual = baseGravableRSTAnual * tarifa;
  const descuentoPensionAnual = pensionDescuento * 12;
  const descuentoElectronicoAnual = optimalG * 12 * 0.005;

  const descuentoPensionEfectivo = Math.min(descuentoPensionAnual, impuestoBrutoAnual);
  const impuestoNetoAnual = Math.max(0, impuestoBrutoAnual - descuentoPensionEfectivo - descuentoElectronicoAnual);

  return {
    optimalG,
    breakdown: {
      porcentajeUGPP,
      grupoRST,
      tarifa,
      costosPresuntos,
      ingresoNetoUgpp,
      ibcMensual: ibc,
      salud,
      pensionTotal,
      baseGravableRST,
      impuestoBruto: impuestoBrutoAnual,
      descuentoPension: descuentoPensionEfectivo,
      descuentoElectronico: descuentoElectronicoAnual,
      impuestoNeto: impuestoNetoAnual
    }
  };
}

interface SalarioMagicoIndependientesProps {
  anio: AnioGravable;
  numDependientes: number;
  setNumDependientes: (val: number) => void;
  actividad: ActividadIndependiente;
  setActividad: (actividad: ActividadIndependiente) => void;
  aplicaTabla383: boolean;
  setAplicaTabla383: (val: boolean) => void;
  costosRealesCop: number;
  setCostosRealesRaw: (val: string) => void;
  medicinaPrepagadaCop?: number;
  interesesViviendaCop?: number;
}



// Búsqueda binaria eliminada por soluciones algebraicas cerradas

export function SalarioMagicoIndependientes({ 
  anio, 
  numDependientes, 
  setNumDependientes,
  actividad, 
  setActividad,
  aplicaTabla383, 
  setAplicaTabla383,
  costosRealesCop,
  setCostosRealesRaw,
  medicinaPrepagadaCop = 0,
  interesesViviendaCop = 0,
}: SalarioMagicoIndependientesProps) {

  const C = CONSTANTES_POR_ANIO[anio];
  const nDep = Math.min(Math.max(0, Math.floor(numDependientes)), C.MAX_DEPENDIENTES);
  const deduccionArt336Mes = nDep > 0 ? nDep * 6 * C.UVT : 0;

  const { optimalG: optimalGRST, breakdown: breakdownRST } = useSalarioMagicoRST(anio, actividad);

  // --- ESCENARIO A: ORGÁNICO ---
  const { salarioOrg, resOrg } = useMemo(() => {
    const MetaFiscal_Mes = (1090 * C.UVT) / 12;
    const Deduccion_Art336_Mes = nDep * 6 * C.UVT;
    const MetaNeto_Mes = MetaFiscal_Mes + Deduccion_Art336_Mes + medicinaPrepagadaCop + interesesViviendaCop;

    let p = 0;
    let costsMes = 0;
    let BrutoMes = 0;
    let AportesFinalesMes = 0;
    let IngresoNetoMes = 0;

    const costsPresuntos = PRESUNCION_COSTOS_UGPP[actividad] || 0;
    const isCostosReales = actividad === "Costos Reales (Declarados con Soportes)";

    if (isCostosReales) {
      costsMes = costosRealesCop || 0;
      if (costsMes > 0) {
        IngresoNetoMes = MetaNeto_Mes;
        BrutoMes = IngresoNetoMes / 0.886 + costsMes;
        
        const ibcMes = (BrutoMes - costsMes) * 0.40;
        if (ibcMes < C.SMMLV) {
          AportesFinalesMes = C.SMMLV * 0.285;
          BrutoMes = IngresoNetoMes + AportesFinalesMes + costsMes;
        } else {
          AportesFinalesMes = (BrutoMes - costsMes) * 0.114;
        }
      } else {
        IngresoNetoMes = MetaNeto_Mes / 0.75;
        BrutoMes = IngresoNetoMes / 0.886;
        
        const ibcMes = BrutoMes * 0.40;
        if (ibcMes < C.SMMLV) {
          AportesFinalesMes = C.SMMLV * 0.285;
          BrutoMes = IngresoNetoMes + AportesFinalesMes;
        } else {
          AportesFinalesMes = BrutoMes * 0.114;
        }
      }
    } else {
      p = costsPresuntos;
      if (p > 0) {
        IngresoNetoMes = MetaNeto_Mes;
        BrutoMes = IngresoNetoMes / ((1 - p) * 0.886);
        
        const ibcMes = BrutoMes * (1 - p) * 0.40;
        if (ibcMes < C.SMMLV) {
          AportesFinalesMes = C.SMMLV * 0.285;
          BrutoMes = (IngresoNetoMes + AportesFinalesMes) / (1 - p);
          costsMes = BrutoMes * p;
        } else {
          AportesFinalesMes = BrutoMes * (1 - p) * 0.114;
          costsMes = BrutoMes * p;
        }
      } else {
        IngresoNetoMes = MetaNeto_Mes / 0.75;
        BrutoMes = IngresoNetoMes / 0.886;
        
        const ibcMes = BrutoMes * 0.40;
        if (ibcMes < C.SMMLV) {
          AportesFinalesMes = C.SMMLV * 0.285;
          BrutoMes = IngresoNetoMes + AportesFinalesMes;
        } else {
          AportesFinalesMes = BrutoMes * 0.114;
        }
      }
    }

    return {
      salarioOrg: BrutoMes,
      resOrg: {
        costosDeduciblesMes: costsMes,
        descuentoSaludMes: AportesFinalesMes * (0.125 / 0.285),
        descuentoPensionMes: AportesFinalesMes * (0.16 / 0.285),
        ingresoNetoMes: IngresoNetoMes,
      }
    };
  }, [C, nDep, actividad, costosRealesCop, medicinaPrepagadaCop, interesesViviendaCop]);

  // --- ESCENARIO B: MAXIMIZADO ---
  const { salarioMax, resMax } = useMemo(() => {
    const magicoMax = encontrarSalarioMagicoIndependiente(
      actividad,
      aplicaTabla383,
      0, // tarifaRetencionPlana
      anio,
      numDependientes,
      costosRealesCop,
      medicinaPrepagadaCop,
      interesesViviendaCop,
      true // maximizarAFC
    );

    const afcOptimo = Math.min(magicoMax * 0.30, (C.TOPE_VOLUNTARIOS_UVT_ANUAL * C.UVT) / 12);

    const resCalculoMax = calcularRetencionIndependiente(
      magicoMax,
      actividad,
      aplicaTabla383,
      0, // tarifaRetencionPlana
      anio,
      numDependientes,
      costosRealesCop,
      afcOptimo,
      medicinaPrepagadaCop,
      interesesViviendaCop
    );

    const costsAnual = actividad === "Costos Reales (Declarados con Soportes)" ? (costosRealesCop || 0) * 12 : magicoMax * 12 * (PRESUNCION_COSTOS_UGPP[actividad] || 0);
    const AportesFinales = resCalculoMax.descuentoSaludAnual + resCalculoMax.descuentoPensionAnual;
    const Neto_DIAN_Anual = magicoMax * 12 - costsAnual - AportesFinales;

    return {
      salarioMax: magicoMax,
      resMax: {
        costosDeduciblesMes: costsAnual / 12,
        descuentoSSMes: AportesFinales / 12,
        saludMes: resCalculoMax.descuentoSaludAnual / 12,
        pensionMes: resCalculoMax.descuentoPensionAnual / 12,
        ingresoNetoMensual: Neto_DIAN_Anual / 12,
        BrutoAnual: magicoMax * 12,
        costsAnual,
        AportesFinales,
        rentaExentaMes: resCalculoMax.rentaExentaMes,
        aportesVoluntariosMensual: afcOptimo,
        deduccionesCapadasMes: resCalculoMax.deduccionesCapadasMes
      }
    };
  }, [C, actividad, aplicaTabla383, anio, numDependientes, costosRealesCop, medicinaPrepagadaCop, interesesViviendaCop]);

  const comparativoData = useMemo(() => {
    const netoOrg = salarioOrg - resOrg.descuentoSaludMes - resOrg.descuentoPensionMes;
    const netoMax = salarioMax - resMax.saludMes - resMax.pensionMes - resMax.aportesVoluntariosMensual;
    const netoRST = optimalGRST - breakdownRST.salud - breakdownRST.pensionTotal - (breakdownRST.impuestoNeto / 12);
    
    return {
      org: { g: salarioOrg, salud: resOrg.descuentoSaludMes, pension: resOrg.descuentoPensionMes, afc: 0, neto: netoOrg },
      max: { g: salarioMax, salud: resMax.saludMes, pension: resMax.pensionMes, afc: resMax.aportesVoluntariosMensual, neto: netoMax },
      rst: { g: optimalGRST, salud: breakdownRST.salud, pension: breakdownRST.pensionTotal, afc: 0, neto: netoRST }
    };
  }, [salarioOrg, resOrg, salarioMax, resMax, optimalGRST, breakdownRST]);

  // Variables para la Caja Blanca
  const metaFiscalOrg = (1090 * C.UVT) / 12;
  const paso2Org = deduccionArt336Mes;
  const paso2_1Org = medicinaPrepagadaCop;
  const paso2_2Org = interesesViviendaCop;

  const metaFiscalMax = (1090 * C.UVT) / 12;
  const paso2Max = deduccionArt336Mes;

  if (!aplicaTabla383) {
    return (
      <div style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent-amber)" }}>⚠️ No aplica para tarifa plana</div>
        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 8 }}>
          El &quot;Salario Mágico&quot; requiere que apliques a la tabla progresiva (Art. 383). Bajo tarifa plana comercial del 10% u 11%, cualquier ingreso mayor a cero genera retención.
        </div>
      </div>
    );
  }

  const afcEfectivoMax = resMax.deduccionesCapadasMes - resMax.rentaExentaMes;
  const flujoCajaMax = salarioMax - resMax.descuentoSSMes - afcEfectivoMax;

  const icaEstimado = salarioOrg * 0.00966;
  const icaEstimadoMax = salarioMax * 0.00966;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      
      {/* ── CABECERA: SELECTOR DE ACTIVIDAD + BADGE RST ── */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 16, padding: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 6 }}>
              Actividad Económica (Costos Presuntos)
            </label>
            <select
              value={actividad}
              onChange={(e) => setActividad(e.target.value as ActividadIndependiente)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid var(--border-color)",
                background: "var(--bg-card)",
                color: "var(--text-primary)",
                fontSize: "0.9rem",
                appearance: "none",
                WebkitAppearance: "none",
                MozAppearance: "none",
                backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 12px center",
                backgroundSize: "16px",
                paddingRight: "40px"
              }}
            >
              {Object.keys(PRESUNCION_COSTOS_UGPP).map((key) => (
                <option key={key} value={key} style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}>
                  {key}
                </option>
              ))}
            </select>
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              Presunción de Costos UGPP: <strong>{((PRESUNCION_COSTOS_UGPP[actividad] || 0) * 100).toFixed(2)}%</strong>
            </div>
            <div style={{ 
              fontSize: "0.75rem", 
              fontWeight: 700, 
              color: "#0f172a", // Dark text for light background
              background: "var(--accent-cyan)", 
              padding: "4px 10px", 
              borderRadius: "20px" 
            }}>
              Mapeado a Grupo {MAPEO_UGPP_A_RST[actividad] || "1"} del RST
            </div>
          </div>

          {actividad === "Costos Reales (Declarados con Soportes)" && (
            <div className="animate-fade-up">
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 6 }}>
                Costos Reales Mensuales
              </label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: "var(--text-muted)", fontSize: "1rem" }}>$</span>
                <input
                  type="text"
                  value={costosRealesCop > 0 ? costosRealesCop.toLocaleString("es-CO") : ""}
                  onChange={(e) => setCostosRealesRaw(e.target.value.replace(/[^0-9]/g, ""))}
                  className="tax-input"
                  style={{ paddingLeft: 34, fontSize: "1rem" }}
                  placeholder="0"
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 6 }}>
              Método de Retención
            </label>
            <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: "var(--text-primary)", cursor: "pointer" }}>
                <input type="radio" name="metodo-magico" checked={aplicaTabla383} onChange={() => setAplicaTabla383(true)} />
                Tabla Art. 383
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: "var(--text-primary)", cursor: "pointer" }}>
                <input type="radio" name="metodo-magico" checked={!aplicaTabla383} onChange={() => setAplicaTabla383(false)} />
                Tarifa Plana (11%)
              </label>
            </div>
          </div>

          <div style={{ paddingTop: 16, borderTop: "1px solid var(--border-color)" }}>
            <DependientesInput value={numDependientes} onChange={setNumDependientes} />
          </div>
        </div>
      </div>
      
      {/* ── BLOQUE A: ESCENARIO ORGÁNICO ── */}
      <div style={{ 
        background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 16, overflow: "hidden" 
      }}>
        <div style={{ background: "linear-gradient(135deg, rgba(52,211,153,0.1), rgba(16,185,129,0.05))", padding: 24, textAlign: "center", borderBottom: "1px solid rgba(52,211,153,0.3)" }}>
          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
            Escenario Orgánico (Sin aportes voluntarios)
          </div>
          <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--accent-emerald)", fontFamily: "JetBrains Mono, monospace", marginBottom: 8 }}>
            {formatCOP(salarioOrg)}
          </div>
          <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            Máximo honorario bruto con retención $0, confiando solo en rentas exentas de ley y dependientes.
          </div>
        </div>
        
        <div style={{ padding: "0 20px" }}>
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", paddingTop: 16 }}>
            Demostración Top-Down
          </div>
          
          {/* Paso 1: Ingreso Bruto */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 1: Ingreso Bruto</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Honorarios calculados</div>
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-primary)", textAlign: "right" }}>
              {formatCOP(salarioOrg)}
            </div>
          </div>

          {/* Paso 2: Costos Deducibles */}
          {resOrg.costosDeduciblesMes > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 2: (-) Costos Deducibles</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{actividad === "Costos Reales (Declarados con Soportes)" ? "Costos Reales" : `Costos Presuntos (${((PRESUNCION_COSTOS_UGPP[actividad] || 0) * 100).toFixed(2)}%)`}</div>
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-primary)", textAlign: "right" }}>
                (-) {formatCOP(resOrg.costosDeduciblesMes)}
              </div>
            </div>
          )}

          {/* Paso 3: (=) Ingreso Neto */}
          <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 3: (=) Ingreso Neto</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Base para aportes a seguridad social (40% del Ingreso Neto de Costos)</div>
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-primary)", textAlign: "right" }}>
                (=) {formatCOP(salarioOrg - resOrg.costosDeduciblesMes)}
              </div>
            </div>
            <div style={{ marginLeft: "12px", marginTop: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <span>↳ IBC (40% del Ingreso Neto):</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(Math.max(C.SMMLV, (salarioOrg - resOrg.costosDeduciblesMes) * 0.40))}</span>
              </div>
            </div>
          </div>

          {/* Paso 4: (-) Salud y Pensión */}
          <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 4: (-) Salud y Pensión</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Aportes a Seguridad Social (PILA)</div>
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-primary)", textAlign: "right" }}>
                (-) {formatCOP(resOrg.descuentoSaludMes + resOrg.descuentoPensionMes)}
              </div>
            </div>
            {/* Sub-renglones */}
            <div style={{ marginLeft: "12px", marginTop: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <span>↳ Salud (12.5% de IBC):</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(resOrg.descuentoSaludMes)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <span>↳ Pensión (16% de IBC):</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(resOrg.descuentoPensionMes)}</span>
              </div>
            </div>
          </div>

          {/* Paso 5: (=) Base Gravable Final */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: "2px solid var(--accent-emerald)", marginTop: "4px" }}>
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--accent-emerald)" }}>Paso 5: (=) Base Gravable Final</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Monto sobre el que se tiene $0 impuesto (90.83 UVT mensuales | 1090 UVT anuales con UVT = {formatCOP(C.UVT)})</div>
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, fontFamily: "JetBrains Mono, monospace", color: "var(--accent-emerald)", textAlign: "right" }}>
              (=) {formatCOP(metaFiscalOrg)}
            </div>
          </div>

          {/* Dinero a Casa */}
          <div style={{ 
            background: "rgba(16, 185, 129, 0.1)", 
            border: "1px solid var(--accent-emerald)", 
            borderRadius: 12, 
            padding: "16px", 
            marginTop: "16px" 
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>💰 Dinero a Casa (Flujo de Caja Libre)</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Lo que realmente llega a tu cuenta bancaria para gastar. (Sin descontar aún el pago de ICA municipal)</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                  Desglose: {formatCOP(salarioOrg)} (Honorarios) - {formatCOP(resOrg.descuentoSaludMes + resOrg.descuentoPensionMes)} (PILA) - {formatCOP(0)} (Impuesto)
                </div>
              </div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, fontFamily: "JetBrains Mono, monospace", color: "var(--accent-emerald)" }}>
                {formatCOP(salarioOrg - (resOrg.descuentoSaludMes + resOrg.descuentoPensionMes))}
              </div>
            </div>
          </div>

          {/* Banner de Advertencia (ICA) - Orgánico */}
          <div style={{
            marginTop: "12px",
            padding: "12px 16px",
            borderRadius: "12px",
            background: "rgba(245, 158, 11, 0.05)",
            border: "1px solid rgba(245, 158, 11, 0.15)",
            borderLeft: "4px solid #f59e0b",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "12px"
          }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.1rem" }}>🏛️</span>
              <div>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>Impuesto Municipal (ICA) No Incluido</div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", marginTop: 2 }}>
                  Estimado al 0.966% sobre el ingreso bruto. Este impuesto es municipal y no se puede reducir con aportes a pensión o AFC.
                </div>
              </div>
            </div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-primary)" }}>
              - {formatCOP(icaEstimado)}
            </div>
          </div>
        </div>
      </div>

      {/* ── BLOQUE B: ESCENARIO MAXIMIZADO ── */}
      <div style={{ 
        background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 16, overflow: "hidden" 
      }}>
        <div style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(37,99,235,0.05))", padding: 24, textAlign: "center", borderBottom: "1px solid rgba(59,130,246,0.3)" }}>
          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
            Escenario Maximizado (Con tope 40%)
          </div>
          <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--accent-blue)", fontFamily: "JetBrains Mono, monospace", marginBottom: 8 }}>
            {formatCOP(salarioMax)}
          </div>
          <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            Máximo honorario posible si utilizas el tope del 40% invirtiendo inteligentemente (AFC / Pensión Voluntaria).
          </div>
        </div>
        
        <div style={{ padding: "0 20px" }}>
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", paddingTop: 16 }}>
            Demostración Top-Down
          </div>
          
          {/* Paso 1: Ingreso Bruto */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 1: Ingreso Bruto</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Honorarios calculados</div>
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-primary)", textAlign: "right" }}>
              {formatCOP(salarioMax)}
            </div>
          </div>

          {/* Paso 2: Costos Deducibles */}
          {resMax.costosDeduciblesMes > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 2: (-) Costos Deducibles</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{actividad === "Costos Reales (Declarados con Soportes)" ? "Costos Reales" : `Costos Presuntos (${((PRESUNCION_COSTOS_UGPP[actividad] || 0) * 100).toFixed(2)}%)`}</div>
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-primary)", textAlign: "right" }}>
                (-) {formatCOP(resMax.costosDeduciblesMes)}
              </div>
            </div>
          )}

          {/* Paso 3: (=) Ingreso Neto */}
          <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 3: (=) Ingreso Neto</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Base para aportes a seguridad social (40% del Ingreso Neto de Costos)</div>
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-primary)", textAlign: "right" }}>
                (=) {formatCOP(salarioMax - resMax.costosDeduciblesMes)}
              </div>
            </div>
            <div style={{ marginLeft: "12px", marginTop: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <span>↳ IBC (40% del Ingreso Neto):</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(Math.max(C.SMMLV, (salarioMax - resMax.costosDeduciblesMes) * 0.40))}</span>
              </div>
            </div>
          </div>

          {/* Paso 4: (-) Salud y Pensión */}
          <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 4: (-) Salud y Pensión</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Aportes a Seguridad Social (PILA)</div>
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-primary)", textAlign: "right" }}>
                (-) {formatCOP(resMax.descuentoSSMes)}
              </div>
            </div>
            {/* Sub-renglones */}
            <div style={{ marginLeft: "12px", marginTop: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <span>↳ Salud (12.5% de IBC):</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(resMax.descuentoSSMes * (0.125 / 0.285))}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <span>↳ Pensión (16% de IBC):</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(resMax.descuentoSSMes * (0.16 / 0.285))}</span>
              </div>
            </div>
          </div>

          {/* Paso 5: (=) Ingreso Neto */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-color)", borderTop: "1px dashed rgba(107, 114, 128, 0.5)", marginTop: "8px", paddingTop: "8px" }}>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 5: (=) Ingreso Neto</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Ingreso base para renta</div>
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-primary)", textAlign: "right" }}>
              (=) {formatCOP(resMax.ingresoNetoMensual)}
            </div>
          </div>

          {resMax.rentaExentaMes === 0 ? (
            // VISTA COLAPSADA (1 sola línea para independientes con Costos Presuntos)
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border-color)" }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 6: (-) Deducciones y Rentas Exentas</span>
                <span style={{ display: "block", fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 2 }}>
                  Optimizado al tope del 40% de {formatCOP(resMax.ingresoNetoMensual)} en aportes voluntarios.
                </span>
              </div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-primary)", textAlign: "right" }}>
                (-) {formatCOP(resMax.deduccionesCapadasMes)}
              </div>
            </div>
          ) : (
            // VISTA DETALLADA (Para Freelancers que sí tienen Renta Exenta del 25%)
            <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 6: (-) Deducciones y Rentas Exentas</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Optimizado al tope del 40%</div>
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-primary)", textAlign: "right" }}>
                  (-) {formatCOP(resMax.deduccionesCapadasMes)}
                </div>
              </div>
              {/* Sub-renglones */}
              <div style={{ marginLeft: "12px", marginTop: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  <span>↳ Renta Exenta (25%):</span>
                  <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(resMax.rentaExentaMes)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  <span>↳ Aportes Voluntarios (AFC/FPV):</span>
                  <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(afcEfectivoMax)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-primary)", fontWeight: 700 }}>
                  <span>(=) Total Deducciones Aplicadas:</span>
                  <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(resMax.deduccionesCapadasMes)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Paso 7: (=) Base Gravable Final */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: "2px solid var(--accent-emerald)", marginTop: "4px" }}>
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--accent-emerald)" }}>Paso 7: (=) Base Gravable Final</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Monto sobre el que se tiene $0 impuesto (90.83 UVT mensuales | 1090 UVT anuales con UVT = {formatCOP(C.UVT)})</div>
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, fontFamily: "JetBrains Mono, monospace", color: "var(--accent-emerald)", textAlign: "right" }}>
              (=) {formatCOP(metaFiscalMax)}
            </div>
          </div>

          {/* Dinero a Casa */}
          <div style={{ 
            background: "rgba(16, 185, 129, 0.1)", 
            border: "1px solid var(--accent-emerald)", 
            borderRadius: 12, 
            padding: "16px", 
            marginTop: "16px" 
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>💰 Dinero a Casa (Flujo de Caja Libre)</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Lo que realmente llega a tu cuenta bancaria para gastar. (Sin descontar aún el pago de ICA municipal)</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                  Desglose: {formatCOP(salarioMax)} (Honorarios) - {formatCOP(resMax.descuentoSSMes)} (PILA) 
                  {afcEfectivoMax > 0 && ` - ${formatCOP(afcEfectivoMax)} (AFC/FPV)`} 
                  - {formatCOP(0)} (Impuesto)
                </div>
              </div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, fontFamily: "JetBrains Mono, monospace", color: "var(--accent-emerald)" }}>
                {formatCOP(flujoCajaMax)}
              </div>
            </div>
          </div>

          {/* Banner de Advertencia (ICA) - Maximizado */}
          <div style={{
            marginTop: "12px",
            padding: "12px 16px",
            borderRadius: "12px",
            background: "rgba(245, 158, 11, 0.05)",
            border: "1px solid rgba(245, 158, 11, 0.15)",
            borderLeft: "4px solid #f59e0b",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "12px"
          }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.1rem" }}>🏛️</span>
              <div>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>Impuesto Municipal (ICA) No Incluido</div>
                <div style={{ fontSize: "0.68rem", color: "var(--text-secondary)", marginTop: 2 }}>
                  Estimado al 0.966% sobre el ingreso bruto. Este impuesto es municipal y no se puede reducir con aportes a pensión o AFC.
                </div>
              </div>
            </div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-primary)" }}>
              - {formatCOP(icaEstimadoMax)}
            </div>
          </div>
        </div>
      </div>

      {/* ── BLOQUE C: ESCENARIO RST ── */}
      <div style={{ 
        background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 16, overflow: "hidden" 
      }}>
        <div style={{ background: "linear-gradient(135deg, rgba(147,51,234,0.1), rgba(126,34,206,0.05))", padding: 24, textAlign: "center", borderBottom: "1px solid rgba(147,51,234,0.3)" }}>
          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
            Escenario Régimen Simple (RST)
          </div>
          <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "#a855f7", fontFamily: "JetBrains Mono, monospace", marginBottom: 8 }}>
            {formatCOP(optimalGRST)}
          </div>
          <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            Máximo honorario bruto para pagar $0 de impuesto consolidado en el RST (Grupo {breakdownRST.grupoRST}).
          </div>
        </div>
        
        <div style={{ padding: "0 20px" }}>
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", paddingTop: 16 }}>
            Demostración Top-Down (Cálculo Mensualizado)
          </div>
          
          {/* Paso 1: Ingreso Bruto */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 1: Ingreso Bruto</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Honorarios calculados (Punto de Equilibrio RST)</div>
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-primary)", textAlign: "right" }}>
              {formatCOP(optimalGRST)}
            </div>
          </div>

          {/* Paso 2: Cálculo del IBC */}
          <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 2: Cálculo del IBC (Seguridad Social)</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Para hallar tus aportes, la UGPP permite descontar los costos presuntos.</div>
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-primary)", textAlign: "right" }}>
                {formatCOP(breakdownRST.ibcMensual)}
              </div>
            </div>
            <div style={{ marginLeft: "12px", marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <span>↳ Ingreso Bruto:</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(optimalGRST)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <span>↳ (-) Costos Presuntos ({(breakdownRST.porcentajeUGPP * 100).toFixed(2)}%):</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>-{formatCOP(breakdownRST.costosPresuntos)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <span>↳ (=) Ingreso Neto para SS:</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(breakdownRST.ingresoNetoUgpp)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-primary)", fontWeight: 700, marginTop: "2px", paddingTop: "2px", borderTop: "1px dashed var(--border-color)" }}>
                <span>↳ IBC Resultante (40% del Neto):</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(breakdownRST.ibcMensual)}</span>
              </div>
            </div>
          </div>

          {/* Paso 3: Salud (INCRGO) */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 3: (-) Salud (INCRGO)</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Único aporte que reduce la base del impuesto (12.5% del IBC)</div>
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--accent-red)", textAlign: "right" }}>
              (-) {formatCOP(breakdownRST.salud)}
            </div>
          </div>

          {/* Paso 4: Base Gravable */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 4: (=) Base Gravable Mensual (RST)</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Dinero sobre el cual se calculará la tarifa (Ingreso Bruto - Salud)</div>
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-primary)", textAlign: "right" }}>
              (=) {formatCOP(breakdownRST.baseGravableRST)}
            </div>
          </div>

          {/* Paso 5: Impuesto Bruto */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 5: Impuesto Simple Bruto</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Tarifa del {(breakdownRST.tarifa * 100).toFixed(2)}% (Grupo {breakdownRST.grupoRST})</div>
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-primary)", textAlign: "right" }}>
              {formatCOP(breakdownRST.impuestoBruto / 12)}
            </div>
          </div>

          {/* Paso 6: Descuentos */}
          <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 6: (-) Descuentos Tributarios</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Beneficios que restan al impuesto a pagar (Art. 912 E.T.)</div>
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--accent-red)", textAlign: "right" }}>
                (-) {formatCOP(breakdownRST.pensionTotal + (breakdownRST.descuentoElectronico / 12))}
              </div>
            </div>
            <div style={{ marginLeft: "12px", marginTop: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <span>↳ Aporte a Pensión Real (16% del IBC):</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>-{formatCOP(breakdownRST.pensionTotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <span>↳ Pagos Electrónicos (0.5% del Bruto):</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>-{formatCOP(breakdownRST.descuentoElectronico / 12)}</span>
              </div>
              {/* Alerta de Tope de Descuento */}
              {breakdownRST.pensionTotal > (breakdownRST.impuestoBruto / 12) && (
                <div style={{ marginTop: "4px", padding: "4px 8px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "4px", fontSize: "0.7rem", color: "var(--accent-red)" }}>
                  <em>Nota: La ley impide que los descuentos superen el impuesto. Se aplicarán máximo {formatCOP(breakdownRST.impuestoBruto / 12)} para dejar tu saldo en cero.</em>
                </div>
              )}
            </div>
          </div>

          {/* Paso 7: Impuesto Neto */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: "2px solid var(--accent-emerald)", marginTop: "4px" }}>
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--accent-emerald)" }}>Paso 7: (=) Impuesto Neto Consolidado</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Impuesto unificado definitivo (Incluye ICA)</div>
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, fontFamily: "JetBrains Mono, monospace", color: "var(--accent-emerald)", textAlign: "right" }}>
              (=) {formatCOP(breakdownRST.impuestoNeto / 12)}
            </div>
          </div>

          {/* Dinero a Casa */}
          <div style={{ 
            background: "rgba(16, 185, 129, 0.1)", 
            border: "1px solid var(--accent-emerald)", 
            borderRadius: 12, 
            padding: "16px", 
            marginTop: "16px",
            marginBottom: "24px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>💰 Dinero a Casa (Flujo de Caja Libre)</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Lo que realmente llega a tu cuenta bancaria. (En el RST el ICA ya está incluido)</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                  Desglose: {formatCOP(optimalGRST)} (Ingresos) - {formatCOP(breakdownRST.salud)} (Salud) - {formatCOP(breakdownRST.pensionTotal)} (Pensión) - {formatCOP(breakdownRST.impuestoNeto / 12)} (Impuesto)
                </div>
              </div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, fontFamily: "JetBrains Mono, monospace", color: "var(--accent-emerald)" }}>
                {formatCOP(optimalGRST - breakdownRST.salud - breakdownRST.pensionTotal - (breakdownRST.impuestoNeto / 12))}
              </div>
            </div>
          </div>

          {/* Insight Analítico: El Muro del Tramo */}
          <div style={{
            marginTop: "16px",
            marginBottom: "24px",
            padding: "16px",
            borderRadius: "12px",
            background: "rgba(168, 85, 247, 0.05)",
            border: "1px solid rgba(168, 85, 247, 0.2)",
            display: "flex",
            gap: "12px"
          }}>
            <div style={{ fontSize: "1.2rem" }}>🛑</div>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#a855f7" }}>¿Por qué el algoritmo se detuvo aquí? (El salto de tramo)</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px", lineHeight: 1.5 }}>
                Tus descuentos actuales superan el impuesto a pagar, lo que insinúa que podrías ganar más. Sin embargo, este salario anualizado roza exactamente la frontera del tramo actual en la tabla del RST. Si ganas un solo peso adicional, tu tarifa consolidada saltará al siguiente nivel, disparando tu impuesto por encima de tu capacidad de descuento. <strong>Este es el techo matemático perfecto de eficiencia fiscal.</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerta de Transparencia Tributaria: ICA */}
      <div style={{
        marginTop: "24px",
        padding: "16px 20px",
        borderRadius: "12px",
        background: "rgba(245, 158, 11, 0.08)", // Fondo ámbar tenue
        border: "1px solid rgba(245, 158, 11, 0.25)",
        display: "flex",
        gap: "14px",
        alignItems: "flex-start"
      }}>
        <div style={{
          fontSize: "1.2rem",
          marginTop: "2px"
        }}>
          🏛️
        </div>
        <div>
          <h4 style={{
            fontSize: "0.85rem",
            fontWeight: 700,
            color: "#f59e0b", // Ámbar vibrante
            margin: "0 0 6px 0",
            letterSpacing: "0.02em"
          }}>
            Nota importante sobre Impuestos Municipales (ICA)
          </h4>
          <p style={{
            fontSize: "0.75rem",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            margin: 0
          }}>
            Esta calculadora proyecta exclusivamente tu <strong style={{ color: "var(--text-primary)" }}>Impuesto de Renta (Tributo Nacional DIAN)</strong>. Ten en cuenta que como trabajador independiente en el Régimen Ordinario, también eres responsable de declarar y pagar el <strong>Impuesto de Industria y Comercio (ICA)</strong> en tu municipio. 
            <br /><br />
            El ICA se cobra sobre tu <strong>Ingreso Bruto Total</strong> (sin descontar costos ni seguridad social) y la tarifa varía según tu ciudad (suele rondar el 1%). Te sugerimos reservar esta provisión en tu flujo de caja.
          </p>
        </div>
      </div>

      {/* Análisis de Dinero Real en Bolsillo */}
      <div style={{
        marginTop: "32px",
        padding: "24px",
        borderRadius: "16px",
        backgroundColor: "var(--bg-elevated, rgba(255,255,255,0.03))",
        border: "1px solid var(--border-color, #334155)",
      }}>
        <h3 style={{
          fontSize: "1.2rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "8px"
        }}>
          💰 Análisis de Dinero Real en Bolsillo
        </h3>


        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px"
        }}>
          {/* Escenario 1: Ordinario Orgánico */}
          <div style={{
            padding: "16px",
            borderRadius: "12px",
            backgroundColor: "rgba(255, 255, 255, 0.02)",
            border: "1px solid var(--border-color, #334155)",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Ordinario Orgánico
            </h4>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>Ingreso Bruto:</span>
              <span style={{ fontWeight: 600 }}>{formatCOP(comparativoData.org.g)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#f87171" }}>
              <span>(-) Salud:</span>
              <span>-{formatCOP(comparativoData.org.salud)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#f87171" }}>
              <span>(-) Pensión:</span>
              <span>-{formatCOP(comparativoData.org.pension)}</span>
            </div>
            <div style={{
              marginTop: "auto",
              paddingTop: "12px",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              justifyContent: "space-between",
              fontSize: "1rem",
              fontWeight: 700,
              color: "#10b981"
            }}>
              <span>Neto en Bolsillo:</span>
              <span>{formatCOP(comparativoData.org.neto)}</span>
            </div>
          </div>

          {/* Escenario 2: Ordinario Maximizado */}
          <div style={{
            padding: "16px",
            borderRadius: "12px",
            backgroundColor: "rgba(255, 255, 255, 0.02)",
            border: "1px solid var(--border-color, #334155)",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Ordinario Maximizado
            </h4>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>Ingreso Bruto:</span>
              <span style={{ fontWeight: 600 }}>{formatCOP(comparativoData.max.g)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#f87171" }}>
              <span>(-) Salud:</span>
              <span>-{formatCOP(comparativoData.max.salud)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#f87171" }}>
              <span>(-) Pensión:</span>
              <span>-{formatCOP(comparativoData.max.pension)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#f87171" }}>
              <span>(-) AFC/FPV:</span>
              <span>-{formatCOP(comparativoData.max.afc)}</span>
            </div>
            <div style={{
              marginTop: "auto",
              paddingTop: "12px",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              justifyContent: "space-between",
              fontSize: "1rem",
              fontWeight: 700,
              color: "#10b981"
            }}>
              <span>Neto en Bolsillo:</span>
              <span>{formatCOP(comparativoData.max.neto)}</span>
            </div>
          </div>

          {/* Escenario 3: Régimen Simple (RST) */}
          <div style={{
            padding: "16px",
            borderRadius: "12px",
            backgroundColor: "rgba(59, 130, 246, 0.05)", // Resaltado con azul
            border: "1px solid rgba(59, 130, 246, 0.2)",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#60a5fa", margin: 0 }}>
              Régimen Simple (RST)
            </h4>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>Ingreso Bruto:</span>
              <span style={{ fontWeight: 600 }}>{formatCOP(comparativoData.rst.g)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#f87171" }}>
              <span>(-) Salud:</span>
              <span>-{formatCOP(comparativoData.rst.salud)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "#f87171" }}>
              <span>(-) Pensión:</span>
              <span>-{formatCOP(comparativoData.rst.pension)}</span>
            </div>
            <div style={{
              marginTop: "auto",
              paddingTop: "12px",
              borderTop: "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              justifyContent: "space-between",
              fontSize: "1rem",
              fontWeight: 700,
              color: "#10b981"
            }}>
              <span>Neto en Bolsillo:</span>
              <span>{formatCOP(comparativoData.rst.neto)}</span>
            </div>
          </div>
        </div>
        {/* Tabla Comparativa de Flujo de Caja */}
        <div style={{ marginTop: "32px", overflowX: "auto" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "16px" }}>
            📊 Comparativa de Flujo de Caja (Bolsillo Real)
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", color: "var(--text-primary)" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border-color)", textAlign: "left" }}>
                <th style={{ padding: "12px 8px", color: "var(--text-secondary)" }}>Escenario</th>
                <th style={{ padding: "12px 8px", color: "var(--text-secondary)", textAlign: "right" }}>Ingreso Bruto</th>
                <th style={{ padding: "12px 8px", color: "var(--text-secondary)", textAlign: "right" }}>SS (Salud+Pens.)</th>
                <th style={{ padding: "12px 8px", color: "var(--text-secondary)", textAlign: "right" }}>AFC / Voluntarios</th>
                <th style={{ padding: "12px 8px", color: "var(--text-secondary)", textAlign: "right" }}>Impuesto</th>
                <th style={{ padding: "12px 8px", color: "var(--text-secondary)", textAlign: "right", fontWeight: 700 }}>Neto Real</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>Ordinario Orgánico</td>
                <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(comparativoData.org.g)}</td>
                <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(comparativoData.org.salud + comparativoData.org.pension)}</td>
                <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(comparativoData.org.afc)}</td>
                <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(0)}</td>
                <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: "var(--accent-emerald)" }}>{formatCOP(comparativoData.org.neto)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600 }}>Ordinario Maximizado</td>
                <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(comparativoData.max.g)}</td>
                <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(comparativoData.max.salud + comparativoData.max.pension)}</td>
                <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(comparativoData.max.afc)}</td>
                <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(0)}</td>
                <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: "var(--accent-emerald)" }}>{formatCOP(comparativoData.max.neto)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border-color)", backgroundColor: "rgba(59, 130, 246, 0.05)" }}>
                <td style={{ padding: "12px 8px", fontWeight: 600, color: "#60a5fa" }}>Régimen Simple (RST)</td>
                <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(comparativoData.rst.g)}</td>
                <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(comparativoData.rst.salud + comparativoData.rst.pension)}</td>
                <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(comparativoData.rst.afc)}</td>
                <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(breakdownRST.impuestoNeto / 12)}</td>
                <td style={{ padding: "12px 8px", textAlign: "right", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: "var(--accent-emerald)" }}>{formatCOP(comparativoData.rst.neto)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

