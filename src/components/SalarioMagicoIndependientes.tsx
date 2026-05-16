"use client";

import { useMemo } from "react";
import {
  formatCOP,
  CONSTANTES_POR_ANIO,
  PRESUNCION_COSTOS_UGPP,
  TARIFAS_RST,
  encontrarSalarioMagicoIndependiente,
  calcularRetencionIndependiente,
} from "@/lib/tax-calculator";
import type { AnioGravable, ActividadIndependiente } from "@/lib/tax-calculator";
import { DependientesInput } from "./DependientesInput";

const MAPEO_UGPP_A_RST: Record<string, string> = {
  "A. Agricultura, ganadería, caza, silvicultura y pesca": "1",
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

// --- HELPER COMPONENTS (PREMIUM) ---

function CascadaItem({ 
  step, label, subtitle, value, color, isTotal = false, subItems = [], highlight = false, highlightColor
}: { 
  step: number; label: string; subtitle?: string; value: number; color?: string; isTotal?: boolean; subItems?: {label: string, value: number, isSpecial?: boolean}[]; highlight?: boolean; highlightColor?: string; isSpecial?: boolean;
}) {
  const safeValue = value || 0;
  return (
    <div className={`audit-step ${highlight ? 'highlighted' : ''}`} style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 4, 
      padding: "16px",
      background: highlight ? `${highlightColor}10` : 'rgba(255,255,255,0.02)',
      border: highlight ? `2px solid ${highlightColor}` : '1px solid var(--border-color)',
      borderRadius: 16,
      transition: 'all 0.3s ease'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ 
            fontSize: '0.7rem', 
            width: 22, 
            height: 22, 
            borderRadius: '50%', 
            background: isTotal ? 'var(--text-primary)' : (color || 'var(--accent-cyan)'), 
            color: 'white', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontWeight: 900,
            marginTop: 2
          }}>{step}</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ 
              fontSize: '0.9rem', 
              fontWeight: isTotal || highlight ? 800 : 600, 
              color: highlight ? highlightColor : 'var(--text-primary)' 
            }}>{label}</span>
            {subtitle && (
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {subtitle}
              </div>
            )}
          </div>
        </div>
        <span style={{ 
          fontFamily: "JetBrains Mono, monospace", 
          fontSize: isTotal || highlight ? '1rem' : '0.9rem', 
          fontWeight: 800, 
          color: safeValue < 0 ? 'var(--text-error)' : (highlight ? highlightColor : 'var(--text-primary)'),
          textAlign: 'right'
        }}>
          {safeValue === 0 ? "$0" : (safeValue > 0 ? "" : "-") + formatCOP(Math.abs(safeValue))}
        </span>
      </div>
      
      {subItems.length > 0 && (
        <div style={{ marginLeft: 34, display: 'flex', flexDirection: 'column', gap: 6, borderLeft: '1px solid var(--border-color)', paddingLeft: 16, marginTop: 10 }}>
          {subItems.map((si, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: si.isSpecial ? 'var(--accent-amber)' : 'var(--text-muted)' }}>
              <span>{si.label}:</span>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>
                {(si.value || 0) === 0 ? "$0" : ((si.value || 0) > 0 ? "" : "-") + formatCOP(Math.abs(si.value || 0))}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BentoIndicator({ label, value, color, description }: { label: string; value: string; color: string; description?: string }) {
  return (
    <div style={{ 
      background: "var(--bg-card)", 
      border: `1px solid ${color}30`, 
      borderRadius: 20, 
      padding: 24, 
      flex: 1,
      boxShadow: `0 10px 20px -5px ${color}10`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: -10, right: -10, width: 60, height: 60, background: color, opacity: 0.05, borderRadius: '50%' }}></div>
      <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: "1.8rem", fontWeight: 900, color: color, fontFamily: "JetBrains Mono, monospace", marginBottom: 4 }}>{value}</div>
      {description && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.4 }}>{description}</div>}
    </div>
  );
}

// --- HOOKS ---

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
    
    const descuentoPensionEfectivo = Math.min(descuentoPensionAnual, impuestoBrutoAnual);
    const impuestoNetoAnual = Math.max(0, impuestoBrutoAnual - descuentoPensionEfectivo - descuentoElectronicoAnual);
    
    return impuestoNetoAnual;
  }

  let low = 0;
  let high = 150000000; 
  let optimalG = 0;

  for (let i = 0; i < 60; i++) {
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
  const descuentoPensionAnual = pensionTotal * 12;
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
      baseGravableRSTAnual,
      impuestoBruto: impuestoBrutoAnual,
      descuentoPension: descuentoPensionEfectivo,
      descuentoElectronico: descuentoElectronicoAnual,
      impuestoNeto: impuestoNetoAnual
    }
  };
}

// --- MAIN COMPONENT ---

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

  const isCostosReales = actividad === "Costos Reales (Declarados con Soportes)";
  const C = CONSTANTES_POR_ANIO[anio];

  const { optimalG: optimalGRST, breakdown: breakdownRST } = useSalarioMagicoRST(anio, actividad);

  // --- ESCENARIO A: ORGÁNICO ---
  const { salarioOrg, resOrg } = useMemo(() => {
    const searchCostos = isCostosReales ? (costosRealesCop || 0) : 0;
    const magicoOrg = encontrarSalarioMagicoIndependiente(actividad, true, 0, anio, numDependientes, searchCostos, medicinaPrepagadaCop, interesesViviendaCop, false) || 0;
    const res = calcularRetencionIndependiente(magicoOrg, actividad, true, 0, anio, numDependientes, searchCostos, 0, medicinaPrepagadaCop, interesesViviendaCop);
    return { salarioOrg: magicoOrg, resOrg: res };
  }, [anio, numDependientes, actividad, costosRealesCop, medicinaPrepagadaCop, interesesViviendaCop, isCostosReales]);

  // --- ESCENARIO B: MAXIMIZADO (CON AFC) ---
  const { salarioMax, resMax } = useMemo(() => {
    const searchCostos = isCostosReales ? (costosRealesCop || 0) : 0;
    const magicoMax = encontrarSalarioMagicoIndependiente(actividad, true, 0, anio, numDependientes, searchCostos, medicinaPrepagadaCop, interesesViviendaCop, true) || 0;
    
    // Hallar AFC óptimo
    const resPre = calcularRetencionIndependiente(magicoMax, actividad, true, 0, anio, numDependientes, searchCostos, 0, medicinaPrepagadaCop, interesesViviendaCop);
    const afcOptimo = resPre.aporteAFCOptimoMes || 0;
    
    const res = calcularRetencionIndependiente(magicoMax, actividad, true, 0, anio, numDependientes, searchCostos, afcOptimo, medicinaPrepagadaCop, interesesViviendaCop);
    return { salarioMax: magicoMax, resMax: { ...res, afcOptimo } };
  }, [actividad, anio, numDependientes, costosRealesCop, medicinaPrepagadaCop, interesesViviendaCop, isCostosReales]);

  const netoOrg = (salarioOrg || 0) - (resOrg.descuentoSaludMes || 0) - (resOrg.descuentoPensionMes || 0);
  const netoMax = (salarioMax || 0) - (resMax.descuentoSaludMes || 0) - (resMax.descuentoPensionMes || 0) - (resMax.afcOptimo || 0);
  const netoRST = (optimalGRST || 0) - (breakdownRST.salud || 0) - (breakdownRST.pensionTotal || 0) - ((breakdownRST.impuestoNeto || 0) / 12);

  if (!aplicaTabla383) {
    return (
      <div style={{ background: "rgba(245, 158, 11, 0.05)", border: "2px dashed rgba(245, 158, 11, 0.3)", borderRadius: 24, padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: "3rem", marginBottom: 16 }}>⚡</div>
        <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent-amber)", marginBottom: 12 }}>Optimización Inactiva</h3>
        <p style={{ maxWidth: 500, margin: "0 auto 32px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          El &quot;Salario Mágico&quot; requiere el uso de la <strong>Tabla Progresiva (Art. 383)</strong>. 
          En tarifa plana del 10/11%, no hay tramo exento que optimizar.
        </p>
        <button onClick={() => setAplicaTabla383(true)} className="btn-primary" style={{ background: "var(--accent-amber)" }}>Activar Art. 383</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
      
      {/* --- PANEL DE CONTROL --- */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 24, padding: 32, backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.5rem' }}>🧪</span> Laboratorio de Optimización
            </h3>
            <div style={{ background: "var(--accent-cyan)", color: "#0f172a", padding: "6px 16px", borderRadius: 30, fontSize: "0.7rem", fontWeight: 900, textTransform: 'uppercase' }}>
              RST GRUPO {breakdownRST.grupoRST}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            <div>
              <label style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 10 }}>Actividad Económica</label>
              <select value={actividad} onChange={(e) => setActividad(e.target.value as ActividadIndependiente)} className="tax-input" style={{ width: '100%' }}>
                {Object.keys(PRESUNCION_COSTOS_UGPP).map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <DependientesInput value={numDependientes} onChange={setNumDependientes} />
            </div>
          </div>

          {isCostosReales && (
            <div className="animate-fade-up">
              <label style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 10 }}>Costos Mensuales Soportados</label>
              <input type="text" value={costosRealesCop.toLocaleString()} onChange={(e) => setCostosRealesRaw(e.target.value.replace(/\D/g,""))} className="tax-input" placeholder="$0" />
            </div>
          )}
        </div>
      </div>

      {/* --- ESCENARIOS (VERTICAL) --- */}
      <div style={{ display: "flex", flexDirection: "column", gap: 64 }}>
        
        {/* ESCENARIO A: ORGÁNICO */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 32, overflow: "hidden", boxShadow: "0 20px 50px -20px rgba(0,0,0,0.2)" }}>
          <div style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", padding: "40px", textAlign: 'center', color: 'white' }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 800, opacity: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>Salario Mágico Orgánico</div>
            <div style={{ fontSize: "3rem", fontWeight: 950, fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(salarioOrg || 0)}</div>
            <div style={{ fontSize: "0.9rem", fontWeight: 600, opacity: 0.9, marginTop: 4 }}>Ingreso bruto máximo sin generar Retención en la Fuente</div>
          </div>
          
          <div style={{ padding: 40 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
              <BentoIndicator label="Neto Disponible" value={formatCOP(netoOrg || 0)} color="#10b981" description="Lo que recibes en tu cuenta tras pagar PILA." />
              <BentoIndicator label="Base Gravable" value={formatCOP((resOrg.baseGravableAnual || 0) / 12)} color="var(--text-primary)" description="Ajustada al tramo exento de 1.090 UVT." />
            </div>

            <h4 style={{ fontSize: "0.8rem", fontWeight: 900, color: "var(--text-muted)", textTransform: 'uppercase', marginBottom: 20, letterSpacing: '0.1em' }}>Cascada de Auditoría Fiscal (6 Pasos)</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "24px" }}>
              {/* PASO 1 */}
              <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 1: Ingreso Bruto</div></div>
                  <div style={{ fontSize: "1rem", fontWeight: 800, fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(salarioOrg || 0)}</div>
                </div>
              </div>

              {/* PASO 2 */}
              <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 2: (-) Aportes a Seguridad Social (PILA)</div></div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-error, #ef4444)" }}>(-) {formatCOP((resOrg.descuentoSaludMes || 0) + (resOrg.descuentoPensionMes || 0))}</div>
                </div>
                <div style={{ marginLeft: "12px", marginTop: "8px", padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>↳ Ingreso Bruto base:</span><span>{formatCOP(salarioOrg || 0)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>↳ (-) Costos Presuntos UGPP ({(PRESUNCION_COSTOS_UGPP[actividad] * 100).toFixed(1)}%):</span><span>- {formatCOP(resOrg.costosUGPPMes || 0)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>↳ (=) Ingreso Neto para SS:</span><span>{formatCOP(resOrg.ingresoNetoSSMes || 0)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}><span>↳ IBC Teórico (40% del Neto SS):</span><span>{formatCOP((resOrg.ingresoNetoSSMes || 0) * 0.40)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: resOrg.usandoIBCMinimo ? "#f59e0b" : "var(--text-primary)" }}><span>↳ IBC Final de Cotización: <span style={{ fontWeight: "normal", marginLeft: 4, color: resOrg.usandoIBCMinimo ? "#f59e0b" : "var(--text-success, #10b981)" }}>{resOrg.usandoIBCMinimo ? "⚠️ Ajustado al piso legal de 1 SMMLV" : "✅ Calculado orgánicamente al 40%"}</span></span><span>{formatCOP(resOrg.ibcMes || 0)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>↳ Salud (12.5%):</span><span>- {formatCOP(resOrg.descuentoSaludMes || 0)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>↳ Pensión (16%):</span><span>- {formatCOP(resOrg.descuentoPensionMes || 0)}</span></div>
                </div>
              </div>

              {/* PASO 3 */}
              <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)", background: "rgba(255,255,255,0.01)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 3: (=) Ingreso Neto DIAN</div><div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Base real impositiva (Ingreso Bruto - Salud y Pensión)</div></div>
                  <div style={{ fontSize: "1rem", fontWeight: 800, fontFamily: "JetBrains Mono, monospace" }}>(=) {formatCOP(resOrg.ingresoNetoDIANMes || 0)}</div>
                </div>
              </div>

              {/* PASO 4 */}
              <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 4: (-) Deducciones y Rentas Exentas</div>
                    <div style={{ marginTop: "2px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#38bdf8" }}>[ Límite aplicable: {formatCOP(resOrg.limiteLegalMensual || 0)} ]</span>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontStyle: "italic", opacity: 0.8 }}>(Menor entre el 40% del Neto DIAN y el tope de 1.340 UVT anuales)</span>
                    </div>
                  </div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-error, #ef4444)" }}>(-) {formatCOP(resOrg.deduccionesCapadasMes || 0)}</div>
                </div>
                <div style={{ marginLeft: "12px", marginTop: "8px", padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>↳ Dependientes Art. 387 <span style={{fontSize: "0.65rem", color: "var(--text-muted)", fontStyle: "italic"}}>(10% del Bruto, máx 32 UVT/mes)</span>:</span><span>- {numDependientes > 0 ? formatCOP(resOrg.deduccionArt387Mes || 0) : "$0"}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>↳ Aportes Óptimos (AFC/FPV):</span><span>- $0</span></div>
                  <div style={{ borderTop: "1px dashed rgba(255,255,255,0.05)", paddingTop: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}><span>↳ (=) Base Depurada para Renta Exenta:</span><span>{formatCOP(resOrg.baseRentaExentaMes || 0)}</span></div>
                    <div style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.7rem", marginTop: "2px", marginBottom: "6px" }}>Fórmula: Ingreso Neto DIAN - Dependientes - Aportes AFC/FPV</div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}><span>↳ Renta Exenta (25% de la Base Depurada):</span><span>- {formatCOP(resOrg.rentaExentaMes || 0)}</span></div>
                  </div>
                </div>
              </div>

              {/* PASO 5 */}
              {numDependientes > 0 && (
                <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div><div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 5: (-) Deducciones sin límite del 40%</div></div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-error, #ef4444)" }}>(-) {formatCOP(resOrg.deduccionArt336Mes || 0)}</div>
                  </div>
                  <div style={{ marginLeft: "12px", marginTop: "8px", padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: "12px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    <div>↳ Dependientes Adicionales (Ley 2277): {numDependientes * 6} UVT mensuales = - {formatCOP(resOrg.deduccionArt336Mes || 0)}</div>
                  </div>
                </div>
              )}

              {/* PASO 6 */}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "16px", borderLeft: "4px solid #10b981", background: "rgba(16, 185, 129, 0.04)", borderRadius: "8px", alignItems: "center" }}>
                <div><div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#10b981" }}>Paso 6: (=) Base Gravable Final</div></div>
                <div style={{ fontSize: "1.2rem", fontWeight: 900, fontFamily: "JetBrains Mono, monospace", color: "#10b981" }}>(=) {formatCOP((resOrg.baseGravableAnual || 0) / 12)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ESCENARIO B: MAXIMIZADO */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 32, overflow: "hidden", boxShadow: "0 20px 50px -20px rgba(0,0,0,0.2)" }}>
          <div style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", padding: "40px", textAlign: 'center', color: 'white' }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 800, opacity: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>Salario Mágico Maximizado (con AFC)</div>
            <div style={{ fontSize: "3rem", fontWeight: 950, fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(salarioMax || 0)}</div>
            <div style={{ fontSize: "0.9rem", fontWeight: 600, opacity: 0.9, marginTop: 4 }}>Optimizando hasta el tope del 40% de beneficios tributarios</div>
          </div>
          
          <div style={{ padding: 40 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
              <BentoIndicator label="Neto Disponible" value={formatCOP(netoMax || 0)} color="#3b82f6" description="Tras PILA y Ahorro Voluntario en AFC." />
              <BentoIndicator label="Aporte AFC Sugerido" value={formatCOP(resMax.afcOptimo || 0)} color="var(--accent-cyan)" description="Monto exacto para llenar tu cupo del 40%." />
            </div>

            <h4 style={{ fontSize: "0.8rem", fontWeight: 900, color: "var(--text-muted)", textTransform: 'uppercase', marginBottom: 20, letterSpacing: '0.1em' }}>Cascada de Auditoría Fiscal (6 Pasos)</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "24px" }}>
              {/* PASO 1 */}
              <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 1: Ingreso Bruto</div><div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Honorarios calculados</div></div>
                  <div style={{ fontSize: "1rem", fontWeight: 800, fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(salarioMax || 0)}</div>
                </div>
              </div>

              {/* PASO 2 */}
              <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 2: (-) Aportes a Seguridad Social (PILA)</div></div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-error, #ef4444)" }}>(-) {formatCOP((resMax.descuentoSaludMes || 0) + (resMax.descuentoPensionMes || 0))}</div>
                </div>
                <div style={{ marginLeft: "12px", marginTop: "8px", padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>↳ Ingreso Bruto base:</span><span>{formatCOP(salarioMax || 0)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>↳ (-) Costos Presuntos UGPP ({(PRESUNCION_COSTOS_UGPP[actividad] * 100).toFixed(1)}%):</span><span>- {formatCOP(resMax.costosUGPPMes || 0)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>↳ (=) Ingreso Neto para SS:</span><span>{formatCOP(resMax.ingresoNetoSSMes || 0)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}><span>↳ IBC Teórico (40% del Neto SS):</span><span>{formatCOP((resMax.ingresoNetoSSMes || 0) * 0.40)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: resMax.usandoIBCMinimo ? "#f59e0b" : "var(--text-primary)" }}><span>↳ IBC Final de Cotización: <span style={{ fontWeight: "normal", marginLeft: 4, color: resMax.usandoIBCMinimo ? "#f59e0b" : "var(--text-success, #10b981)" }}>{resMax.usandoIBCMinimo ? "⚠️ Ajustado al piso legal de 1 SMMLV" : "✅ Calculado orgánicamente al 40%"}</span></span><span>{formatCOP(resMax.ibcMes || 0)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>↳ Salud (12.5%):</span><span>- {formatCOP(resMax.descuentoSaludMes || 0)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>↳ Pensión (16%):</span><span>- {formatCOP(resMax.descuentoPensionMes || 0)}</span></div>
                </div>
              </div>

              {/* PASO 3 */}
              <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)", background: "rgba(255,255,255,0.01)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 3: (=) Ingreso Neto DIAN</div></div>
                  <div style={{ fontSize: "1rem", fontWeight: 800, fontFamily: "JetBrains Mono, monospace" }}>(=) {formatCOP(resMax.ingresoNetoDIANMes || 0)}</div>
                </div>
              </div>

              {/* PASO 4 */}
              <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 4: (-) Rentas Exentas y Deducciones</div>
                    <div style={{ marginTop: "2px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#38bdf8" }}>[ Límite aplicable: {formatCOP(resMax.limiteLegalMensual || 0)} ]</span>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontStyle: "italic", opacity: 0.8 }}>(Menor entre el 40% del Neto DIAN y el tope de 1.340 UVT anuales)</span>
                    </div>
                  </div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-error, #ef4444)" }}>(-) {formatCOP(resMax.deduccionesCapadasMes || 0)}</div>
                </div>
                <div style={{ marginLeft: "12px", marginTop: "8px", padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>↳ Dependientes Art. 387 <span style={{fontSize: "0.65rem", color: "var(--text-muted)", fontStyle: "italic"}}>(10% del Bruto, máx 32 UVT/mes)</span>:</span><span>- {numDependientes > 0 ? formatCOP(resMax.deduccionArt387Mes || 0) : "$0"}</span></div>
                  {(resMax.aporteAFCOptimoMes || 0) > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span>↳ Aportes Óptimos (AFC/FPV):</span><span>- {formatCOP(resMax.aporteAFCOptimoMes || 0)}</span></div>
                  )}
                  <div style={{ borderTop: "1px dashed rgba(255,255,255,0.05)", paddingTop: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}><span>↳ (=) Base Depurada para Renta Exenta:</span><span>{formatCOP(resMax.baseRentaExentaMes || 0)}</span></div>
                    <div style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.7rem", marginTop: "2px", marginBottom: "6px" }}>Fórmula: Ingreso Neto DIAN - Dependientes - Aportes AFC/FPV</div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}><span>↳ Renta Exenta (25% de la Base Depurada):</span><span>- {formatCOP(resMax.rentaExentaMes || 0)}</span></div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, borderTop: "1px solid var(--border-color)", paddingTop: "6px", marginTop: "4px", color: "var(--text-primary)" }}><span>(=) Total Aplicado en la Bolsa:</span><span>- {formatCOP(resMax.deduccionesCapadasMes || 0)}</span></div>
                </div>
              </div>

              {/* PASO 5 */}
              {numDependientes > 0 && (
                <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div><div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 5: (-) Deducciones sin límite del 40%</div></div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-error, #ef4444)" }}>(-) {formatCOP(resMax.deduccionArt336Mes || 0)}</div>
                  </div>
                  <div style={{ marginLeft: "12px", marginTop: "8px", padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: "12px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    <div>↳ Dependientes Adicionales (Ley 2277): {numDependientes * 6} UVT mensuales = - {formatCOP(resMax.deduccionArt336Mes || 0)}</div>
                  </div>
                </div>
              )}

              {/* PASO 6 */}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "16px", borderLeft: "4px solid #3b82f6", background: "rgba(59, 130, 246, 0.04)", borderRadius: "8px", alignItems: "center" }}>
                <div><div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#3b82f6" }}>Paso 6: (=) Base Gravable Final</div></div>
                <div style={{ fontSize: "1.2rem", fontWeight: 900, fontFamily: "JetBrains Mono, monospace", color: "#3b82f6" }}>(=) {formatCOP((resMax.baseGravableAnual || 0) / 12)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ESCENARIO C: RST */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 32, overflow: "hidden", boxShadow: "0 20px 50px -20px rgba(0,0,0,0.2)" }}>
          <div style={{ background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)", padding: "40px", textAlign: 'center', color: 'white' }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 800, opacity: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>Alternativa: Régimen Simple (RST)</div>
            <div style={{ fontSize: "3rem", fontWeight: 950, fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(optimalGRST || 0)}</div>
            <div style={{ fontSize: "0.9rem", fontWeight: 600, opacity: 0.9, marginTop: 4 }}>Ingreso bruto máximo con Impuesto Neto RST = $0</div>
          </div>
          
          <div style={{ padding: 40 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
              <BentoIndicator label="Neto Disponible" value={formatCOP(netoRST || 0)} color="#06b6d4" description="Tras pagar Salud y Pensión (Impuesto Simple compensado)." />
              <BentoIndicator label="Tarifa Simple" value={((breakdownRST.tarifa || 0) * 100).toFixed(1) + "%"} color="var(--text-primary)" description={`Para Grupo ${breakdownRST.grupoRST} en este tramo.`} />
            </div>

            <h4 style={{ fontSize: "0.8rem", fontWeight: 900, color: "var(--text-muted)", textTransform: 'uppercase', marginBottom: 20, letterSpacing: '0.1em' }}>Liquidación Proyectada RST (6 Pasos)</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <CascadaItem 
                step={1} 
                label="Ingreso Bruto Mensual" 
                value={optimalGRST || 0} 
                isTotal 
              />
              <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 2: (-) Aporte Salud (PILA)</div></div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-error, #ef4444)" }}>- {formatCOP(breakdownRST.salud || 0)}</div>
                </div>
                <div style={{ marginLeft: "12px", marginTop: "8px", padding: "12px", background: "rgba(255,255,255,0.02)", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>↳ Ingreso Bruto base:</span><span>{formatCOP(optimalGRST || 0)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>↳ (-) Costos Presuntos UGPP ({(PRESUNCION_COSTOS_UGPP[actividad] * 100).toFixed(1)}%):</span><span>- {formatCOP(breakdownRST.costosPresuntos || 0)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}><span>↳ (=) Ingreso Neto para SS:</span><span>{formatCOP(breakdownRST.ingresoNetoUgpp || 0)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>↳ IBC Teórico (40% del Neto SS):</span><span>{formatCOP((breakdownRST.ingresoNetoUgpp || 0) * 0.4)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
                    <span>
                      ↳ IBC Final de Cotización:{" "}
                      <span style={{ fontSize: "0.65rem", fontWeight: 400, opacity: 0.8 }}>
                        {(breakdownRST.ibcMensual === C.SMMLV) ? "⚠️ Ajustado al piso legal de 1 SMMLV" : "✅ Calculado orgánicamente al 40%"}
                      </span>
                    </span>
                    <span>{formatCOP(breakdownRST.ibcMensual || 0)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-error, #ef4444)" }}><span>↳ Salud (12.5%):</span><span>- {formatCOP(breakdownRST.salud || 0)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#10b981" }}><span>↳ Pensión (16%): <span style={{ fontSize: "0.65rem", fontStyle: "italic", opacity: 0.8 }}>(Se resta del impuesto, no de la base)</span></span><span>- {formatCOP(breakdownRST.pensionTotal || 0)}</span></div>
                </div>
              </div>
              <CascadaItem 
                step={3} 
                label="(=) Base Gravable RST" 
                value={breakdownRST.baseGravableRST || 0} 
                isTotal 
              />
              <CascadaItem 
                step={4} 
                label="Impuesto Simple Bruto" 
                value={(breakdownRST.impuestoBruto || 0) / 12} 
                color="var(--accent-cyan)" 
                subtitle={`Calculado al ${ ((breakdownRST.tarifa || 0)*100).toFixed(1) }% sobre ingresos anuales.`} 
              />
              <CascadaItem 
                step={5} 
                label="(-) Descuento Pensión (Art. 903)" 
                value={-(breakdownRST.descuentoPension || 0) / 12} 
                color="#10b981" 
                isSpecial 
                subtitle="El 100% de tu aporte a pensión resta directamente el impuesto." 
              />
              <CascadaItem 
                step={6} 
                label="(=) Impuesto Neto RST" 
                value={(breakdownRST.impuestoNeto || 0) / 12} 
                highlight 
                highlightColor="#06b6d4" 
                subtitle="Optimizado al punto de equilibrio cero." 
              />
              {breakdownRST.impuestoNeto === 0 && (
                <div style={{ marginTop: "16px", padding: "12px", background: "rgba(56, 189, 248, 0.05)", border: "1px dashed rgba(56, 189, 248, 0.2)", borderRadius: "8px", fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                  <div style={{ fontWeight: 700, color: "#38bdf8", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                    🛑 Límite de Optimización por Tramo RST alcanzado
                  </div>
                  A pesar de que el aporte a Pensión es matemáticamente superior al impuesto, el Salario Mágico se detiene exactamente aquí porque el ingreso anual proyectado ha alcanzado las <strong>6.000 UVT</strong>. Si se incrementa el ingreso, se cambia automáticamente a la siguiente categoría/tramo del RST, incrementando la tarifa base del <strong>5.9% al 7.3%</strong> e impidiendo lograr un impuesto neto de cero.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
