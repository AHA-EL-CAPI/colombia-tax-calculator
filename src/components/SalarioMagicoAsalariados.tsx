"use client";

import { useMemo } from "react";
import { formatCOP, CONSTANTES_POR_ANIO } from "@/lib/tax-calculator";
import type { AnioGravable } from "@/lib/tax-calculator";
import { encontrarSalarioMagicoAsalariado, calcularRetencion } from "@/lib/tax-calculator";

interface SalarioMagicoAsalariadosProps {
  anio: AnioGravable;
  numDependientes: number;
  medicinaPrepagadaCop?: number;
  interesesViviendaCop?: number;
}



export function SalarioMagicoAsalariados({ 
  anio, 
  numDependientes,
  medicinaPrepagadaCop = 0,
  interesesViviendaCop = 0,
}: SalarioMagicoAsalariadosProps) {

  const C = CONSTANTES_POR_ANIO[anio];

  // --- ESCENARIO A: ORGÁNICO ---
  const salarioOrg = useMemo(() => encontrarSalarioMagicoAsalariado(anio, numDependientes, medicinaPrepagadaCop, interesesViviendaCop, 0, false), [anio, numDependientes, medicinaPrepagadaCop, interesesViviendaCop]);
  const resOrg = useMemo(() => calcularRetencion(salarioOrg, anio, numDependientes, 0, medicinaPrepagadaCop, interesesViviendaCop, 0, 0, 0), [salarioOrg, anio, numDependientes, medicinaPrepagadaCop, interesesViviendaCop]);

  // --- ESCENARIO B: MAXIMIZADO ---
  const salarioMax = useMemo(() => encontrarSalarioMagicoAsalariado(anio, numDependientes, medicinaPrepagadaCop, interesesViviendaCop, 0, true), [anio, numDependientes, medicinaPrepagadaCop, interesesViviendaCop]);
  const resMax = useMemo(() => {
    const afc = salarioMax * 0.30;
    return calcularRetencion(salarioMax, anio, numDependientes, afc, medicinaPrepagadaCop, interesesViviendaCop, 0, 0, 0);
  }, [salarioMax, anio, numDependientes, medicinaPrepagadaCop, interesesViviendaCop]);

  // --- ESCENARIO C: MIX SALARIAL ---
  const porcentajeBonos = 0.40; // 40%
  const salarioMix = useMemo(() => encontrarSalarioMagicoAsalariado(anio, numDependientes, medicinaPrepagadaCop, interesesViviendaCop, porcentajeBonos, false), [anio, numDependientes, medicinaPrepagadaCop, interesesViviendaCop, porcentajeBonos]);
  const bonosMix = useMemo(() => (salarioMix * porcentajeBonos) / (1 - porcentajeBonos), [salarioMix, porcentajeBonos]);
  const totalDevengadoMix = salarioMix + bonosMix;
  const resMix = useMemo(() => calcularRetencion(salarioMix, anio, numDependientes, 0, medicinaPrepagadaCop, interesesViviendaCop, 0, 0, bonosMix), [salarioMix, anio, numDependientes, medicinaPrepagadaCop, interesesViviendaCop, bonosMix]);

  // --- ESCENARIO D: MIX SALARIAL + MAXIMIZADO (OPTIMIZACIÓN TOTAL) ---
  const porcentajeBonosMixMax = 0.40;
  // Llamamos al iterador con bonos (0.40) y maximizarAFC (true)
  const salarioMixMax = useMemo(() => encontrarSalarioMagicoAsalariado(anio, numDependientes, medicinaPrepagadaCop, interesesViviendaCop, porcentajeBonosMixMax, true), [anio, numDependientes, medicinaPrepagadaCop, interesesViviendaCop]);
  
  // Reconstruimos las variables para la UI
  const bonosMixMax = useMemo(() => (salarioMixMax * porcentajeBonosMixMax) / (1 - porcentajeBonosMixMax), [salarioMixMax, porcentajeBonosMixMax]);
  const totalDevengadoMixMax = salarioMixMax + bonosMixMax;
  const afcOptimoMixMax = salarioMixMax * 0.30; 
  
  // Ejecutamos la calculadora con los bonos y el AFC inyectado
  const resMixMax = useMemo(() => calcularRetencion(salarioMixMax, anio, numDependientes, afcOptimoMixMax, medicinaPrepagadaCop, interesesViviendaCop, 0, 0, bonosMixMax), [salarioMixMax, anio, numDependientes, afcOptimoMixMax, medicinaPrepagadaCop, interesesViviendaCop, bonosMixMax]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      
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
            Máximo salario bruto con retención $0, confiando solo en rentas exentas de ley y dependientes.
          </div>
        </div>
        
        <div style={{ padding: "0 20px" }}>
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", paddingTop: 16 }}>
            Demostración Top-Down
          </div>
          {/* Paso 1: Ingreso Bruto */}
          <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 700 }}>
              <span>(=) Base de Cotización (IBC):</span>
              <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(resOrg.ingresoBrutoMes)}</span>
            </div>
          </div>

          {/* Paso 2: (-) Salud y Pensión */}
          <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 2: (-) Salud y Pensión</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Aportes obligatorios</div>
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-primary)", textAlign: "right" }}>
                (-) {formatCOP(resOrg.descuentoSaludMes + resOrg.descuentoPensionMes)}
              </div>
            </div>
            
            <div style={{ marginLeft: "12px", marginTop: "4px", padding: "8px", background: "rgba(255,255,255,0.02)", borderRadius: 8, display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <span>↳ Salud (4% de IBC):</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(resOrg.descuentoSaludMes)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <span>↳ Pensión (4% de IBC):</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(resOrg.descuentoPensionMes)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-primary)", fontWeight: 700, borderTop: "1px solid var(--border-color)", paddingTop: 4, marginTop: 4 }}>
                <span>(=) Total Aportes (Salud + Pensión):</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(resOrg.descuentoSaludMes + resOrg.descuentoPensionMes)}</span>
              </div>
            </div>
          </div>

          {/* Paso 3: (=) Ingreso Neto */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-color)", background: "rgba(255,255,255,0.02)" }}>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 3: (=) Ingreso Neto</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Base para calcular deducciones</div>
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-primary)", textAlign: "right" }}>
              (=) {formatCOP(resOrg.ingresoNetoMes)}
            </div>
          </div>

          {/* Paso 4: (-) Deducciones y Rentas Exentas */}
          <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Paso 4: (-) Deducciones y Rentas Exentas</div>
            
            <div style={{ marginLeft: "12px", display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <span>↳ Renta Exenta (25%):</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>(-) {formatCOP(resOrg.rentaExentaMes)}</span>
              </div>
              
              {resOrg.deduccionArt387Mes > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  <span>↳ Dependientes Art. 387:</span>
                  <span style={{ fontFamily: "JetBrains Mono, monospace" }}>(-) {formatCOP(resOrg.deduccionArt387Mes)}</span>
                </div>
              )}
              
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-primary)", fontWeight: 700, borderTop: "1px dashed var(--border-color)", paddingTop: 4, marginTop: 4 }}>
                <span>(=) Total Deducciones Aplicadas (Max 40%):</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>(-) {formatCOP(resOrg.deduccionesCapadasMes + resOrg.deduccionArt336Mes)}</span>
              </div>
            </div>
          </div>

          {/* Paso 5: (=) Base Gravable Final */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-color)", background: "rgba(255,255,255,0.02)" }}>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 5: (=) Base Gravable Final</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Monto sobre el que se calcula el impuesto (90.83 UVT mensuales | 1090 UVT anuales con UVT = {formatCOP(C.UVT)})</div>
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-primary)", textAlign: "right" }}>
              (=) {formatCOP(resOrg.baseGravableMes)}
            </div>
          </div>

          {/* Impuesto Calculado */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: "2px solid var(--accent-emerald)", marginTop: "4px" }}>
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--accent-emerald)" }}>Impuesto Calculado</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Retención en la fuente mensual</div>
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, fontFamily: "JetBrains Mono, monospace", color: "var(--accent-emerald)", textAlign: "right" }}>
              {formatCOP(resOrg.impuestoMes)}
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
            Máximo salario posible si utilizas el tope del 40% invirtiendo inteligentemente (AFC / Pensión Voluntaria).
          </div>
        </div>
        
        <div style={{ padding: "0 20px" }}>
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", paddingTop: 16 }}>
            Demostración Top-Down
          </div>
          {/* Paso 1: Ingreso Bruto */}
          <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 700 }}>
              <span>(=) Base de Cotización (IBC):</span>
              <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(resMax.ingresoBrutoMes)}</span>
            </div>
          </div>

          {/* Paso 2: (-) Salud y Pensión */}
          <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 2: (-) Salud y Pensión</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Aportes obligatorios</div>
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-primary)", textAlign: "right" }}>
                (-) {formatCOP(resMax.descuentoSaludMes + resMax.descuentoPensionMes)}
              </div>
            </div>
            
            <div style={{ marginLeft: "12px", marginTop: "4px", padding: "8px", background: "rgba(255,255,255,0.02)", borderRadius: 8, display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <span>↳ Salud (4% de IBC):</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(resMax.descuentoSaludMes)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <span>↳ Pensión (4% de IBC):</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(resMax.descuentoPensionMes)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-primary)", fontWeight: 700, borderTop: "1px solid var(--border-color)", paddingTop: 4, marginTop: 4 }}>
                <span>(=) Total Aportes (Salud + Pensión):</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(resMax.descuentoSaludMes + resMax.descuentoPensionMes)}</span>
              </div>
            </div>
          </div>

          {/* Paso 3: (=) Ingreso Neto */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-color)", background: "rgba(255,255,255,0.02)" }}>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 3: (=) Ingreso Neto</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Base para calcular deducciones</div>
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-primary)", textAlign: "right" }}>
              (=) {formatCOP(resMax.ingresoNetoMes)}
            </div>
          </div>

          {/* Paso 4: (-) Deducciones y Rentas Exentas */}
          <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Paso 4: (-) Deducciones y Rentas Exentas</div>
            
            <div style={{ marginLeft: "12px", display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <span>↳ Renta Exenta (25%):</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>(-) {formatCOP(resMax.rentaExentaMes)}</span>
              </div>
              
              {resMax.deduccionArt387Mes > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  <span>↳ Dependientes Art. 387:</span>
                  <span style={{ fontFamily: "JetBrains Mono, monospace" }}>(-) {formatCOP(resMax.deduccionArt387Mes)}</span>
                </div>
              )}
              
              {resMax.aportesVoluntariosMensual > 0 && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    <span>↳ Aportes Voluntarios:</span>
                    <span style={{ fontFamily: "JetBrains Mono, monospace" }}>(-) {formatCOP(resMax.aportesVoluntariosMensual)}</span>
                  </div>
                  {resMax.aportesVoluntariosRecortados && (
                    <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", fontStyle: "italic", textAlign: "right" }}>
                      *Aporte limitado al 30% del ingreso o 3.800 UVT anuales.
                    </div>
                  )}
                </>
              )}
              
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-primary)", fontWeight: 700, borderTop: "1px dashed var(--border-color)", paddingTop: 4, marginTop: 4 }}>
                <span>(=) Total Deducciones Aplicadas (Max 40%):</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>(-) {formatCOP(resMax.deduccionesCapadasMes + resMax.deduccionArt336Mes)}</span>
              </div>
            </div>
          </div>

          {/* Paso 5: (=) Base Gravable Final */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-color)", background: "rgba(255,255,255,0.02)" }}>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 5: (=) Base Gravable Final</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Monto sobre el que se calcula el impuesto (90.83 UVT mensuales | 1090 UVT anuales con UVT = {formatCOP(C.UVT)})</div>
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-primary)", textAlign: "right" }}>
              (=) {formatCOP(resMax.baseGravableMes)}
            </div>
          </div>

          {/* Impuesto Calculado */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: "2px solid var(--accent-blue)", marginTop: "4px" }}>
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--accent-blue)" }}>Impuesto Calculado</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Retención en la fuente mensual</div>
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, fontFamily: "JetBrains Mono, monospace", color: "var(--accent-blue)", textAlign: "right" }}>
              {formatCOP(resMax.impuestoMes)}
            </div>
          </div>
        </div>
      </div>
      {/* ── BLOQUE C: ESCENARIO MIX SALARIAL ── */}
      <div style={{ 
        background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 16, overflow: "hidden" 
      }}>
        <div style={{ background: "linear-gradient(135deg, rgba(147,51,234,0.1), rgba(126,34,206,0.05))", padding: 24, textAlign: "center", borderBottom: "1px solid rgba(147,51,234,0.3)" }}>
          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
            Escenario Mix Salarial (Optimización IBC)
          </div>
          <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--accent-purple)", fontFamily: "JetBrains Mono, monospace", marginBottom: 8 }}>
            {formatCOP(totalDevengadoMix)}
          </div>
          <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            Máximo ingreso total combinando salario (60%) and bonos (40%) para reducir el IBC y lograr retención $0.
          </div>
        </div>
        
        <div style={{ padding: "0 20px" }}>
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", paddingTop: 16 }}>
            Demostración Top-Down
          </div>
          {/* Paso 1: Ingreso Bruto */}
          <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <span>↳ Salario Base:</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(resMix.ingresoBrutoMes - (resMix.ingresosNoSalarialesMensual || 0))}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <span>↳ Ingresos No Salariales / Bonos (Ley 1393: Máximo 40% de Ingreso bruto, no contribuyen para IBC):</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(resMix.ingresosNoSalarialesMensual || 0)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-primary)", fontWeight: 700, borderTop: "1px solid var(--border-color)", paddingTop: 4, marginTop: 4 }}>
                <span>(=) Base de Cotización (IBC):</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(resMix.ibcMes || 0)}</span>
              </div>
            </div>
          </div>

          {/* Paso 2: (-) Salud y Pensión */}
          <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 2: (-) Salud y Pensión</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Aportes obligatorios</div>
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-primary)", textAlign: "right" }}>
                (-) {formatCOP(resMix.descuentoSaludMes + resMix.descuentoPensionMes)}
              </div>
            </div>
            
            <div style={{ marginLeft: "12px", marginTop: "4px", padding: "8px", background: "rgba(255,255,255,0.02)", borderRadius: 8, display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <span>↳ Salud (4% de IBC):</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(resMix.descuentoSaludMes)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <span>↳ Pensión (4% de IBC):</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(resMix.descuentoPensionMes)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-primary)", fontWeight: 700, borderTop: "1px solid var(--border-color)", paddingTop: 4, marginTop: 4 }}>
                <span>(=) Total Aportes (Salud + Pensión):</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(resMix.descuentoSaludMes + resMix.descuentoPensionMes)}</span>
              </div>
            </div>
          </div>

          {/* Paso 3: (=) Ingreso Neto */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-color)", background: "rgba(255,255,255,0.02)" }}>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 3: (=) Ingreso Neto</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Base para calcular deducciones</div>
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-primary)", textAlign: "right" }}>
              (=) {formatCOP(resMix.ingresoNetoMes)}
            </div>
          </div>

          {/* Paso 4: (-) Deducciones y Rentas Exentas */}
          <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Paso 4: (-) Deducciones y Rentas Exentas</div>
            
            <div style={{ marginLeft: "12px", display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <span>↳ Renta Exenta (25%):</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>(-) {formatCOP(resMix.rentaExentaMes)}</span>
              </div>
              
              {resMix.deduccionArt387Mes > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  <span>↳ Dependientes Art. 387:</span>
                  <span style={{ fontFamily: "JetBrains Mono, monospace" }}>(-) {formatCOP(resMix.deduccionArt387Mes)}</span>
                </div>
              )}
              
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-primary)", fontWeight: 700, borderTop: "1px dashed var(--border-color)", paddingTop: 4, marginTop: 4 }}>
                <span>(=) Total Deducciones Aplicadas (Max 40%):</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>(-) {formatCOP(resMix.deduccionesCapadasMes + resMix.deduccionArt336Mes)}</span>
              </div>
            </div>
          </div>

          {/* Paso 5: (=) Base Gravable Final */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-color)", background: "rgba(255,255,255,0.02)" }}>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 5: (=) Base Gravable Final</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Monto sobre el que se calcula el impuesto (90.83 UVT mensuales | 1090 UVT anuales con UVT = {formatCOP(C.UVT)})</div>
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-primary)", textAlign: "right" }}>
              (=) {formatCOP(resMix.baseGravableMes)}
            </div>
          </div>

          {/* Impuesto Calculado */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: "2px solid var(--accent-purple)", marginTop: "4px" }}>
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--accent-purple)" }}>Impuesto Calculado</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Retención en la fuente mensual</div>
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, fontFamily: "JetBrains Mono, monospace", color: "var(--accent-purple)", textAlign: "right" }}>
              {formatCOP(resMix.impuestoMes)}
            </div>
          </div>
        </div>
      </div>

      {/* ── BLOQUE D: ESCENARIO MIX + MAX (OPTIMIZACIÓN TOTAL) ── */}
      <div style={{ 
        background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 16, overflow: "hidden", marginTop: 24
      }}>
        <div style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.05))", padding: 24, textAlign: "center", borderBottom: "1px solid rgba(245,158,11,0.3)" }}>
          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
            Escenario Óptimo (Ley 1393 + Tope AFC)
          </div>
          <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "#f59e0b", fontFamily: "JetBrains Mono, monospace", marginBottom: 8 }}>
            {formatCOP(totalDevengadoMixMax)}
          </div>
          <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            Ingreso total máximo combinando 40% de bonos y copando el 40% de deducciones con aportes voluntarios.
          </div>
        </div>
        
        <div style={{ padding: "0 20px" }}>
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", paddingTop: 16 }}>
            Demostración Top-Down
          </div>
          {/* Paso 1: Ingreso Bruto */}
          <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <span>↳ Salario Base:</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(resMixMax.ingresoBrutoMes - (resMixMax.ingresosNoSalarialesMensual || 0))}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <span>↳ Ingresos No Salariales / Bonos (Ley 1393: Máximo 40% de Ingreso bruto, no contribuyen para IBC):</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(resMixMax.ingresosNoSalarialesMensual || 0)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-primary)", fontWeight: 700, borderTop: "1px solid var(--border-color)", paddingTop: 4, marginTop: 4 }}>
                <span>(=) Base de Cotización (IBC):</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(resMixMax.ibcMes || 0)}</span>
              </div>
            </div>
          </div>

          {/* Paso 2: (-) Salud y Pensión */}
          <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 2: (-) Salud y Pensión</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Aportes obligatorios</div>
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-primary)", textAlign: "right" }}>
                (-) {formatCOP(resMixMax.descuentoSaludMes + resMixMax.descuentoPensionMes)}
              </div>
            </div>
            
            <div style={{ marginLeft: "12px", marginTop: "4px", padding: "8px", background: "rgba(255,255,255,0.02)", borderRadius: 8, display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <span>↳ Salud (4% de IBC):</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(resMixMax.descuentoSaludMes)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <span>↳ Pensión (4% de IBC):</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(resMixMax.descuentoPensionMes)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-primary)", fontWeight: 700, borderTop: "1px solid var(--border-color)", paddingTop: 4, marginTop: 4 }}>
                <span>(=) Total Aportes (Salud + Pensión):</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(resMixMax.descuentoSaludMes + resMixMax.descuentoPensionMes)}</span>
              </div>
            </div>
          </div>

          {/* Paso 3: (=) Ingreso Neto */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-color)", background: "rgba(255,255,255,0.02)" }}>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 3: (=) Ingreso Neto</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Base para calcular deducciones</div>
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-primary)", textAlign: "right" }}>
              (=) {formatCOP(resMixMax.ingresoNetoMes)}
            </div>
          </div>

          {/* Paso 4: (-) Deducciones y Rentas Exentas */}
          <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>Paso 4: (-) Deducciones y Rentas Exentas</div>
            
            <div style={{ marginLeft: "12px", display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                <span>↳ Renta Exenta (25%):</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>(-) {formatCOP(resMixMax.rentaExentaMes)}</span>
              </div>
              
              {resMixMax.deduccionArt387Mes > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  <span>↳ Dependientes Art. 387:</span>
                  <span style={{ fontFamily: "JetBrains Mono, monospace" }}>(-) {formatCOP(resMixMax.deduccionArt387Mes)}</span>
                </div>
              )}

              {resMixMax.aportesVoluntariosMensual > 0 && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    <span>↳ Aportes Voluntarios:</span>
                    <span style={{ fontFamily: "JetBrains Mono, monospace" }}>(-) {formatCOP(resMixMax.aportesVoluntariosMensual)}</span>
                  </div>
                  {resMixMax.aportesVoluntariosRecortados && (
                    <div style={{ fontSize: "0.65rem", color: "var(--text-secondary)", fontStyle: "italic", textAlign: "right" }}>
                      *Aporte limitado al 30% del ingreso o 3.800 UVT anuales.
                    </div>
                  )}
                </>
              )}
              
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-primary)", fontWeight: 700, borderTop: "1px dashed var(--border-color)", paddingTop: 4, marginTop: 4 }}>
                <span>(=) Total Deducciones Aplicadas (Max 40%):</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace" }}>(-) {formatCOP(resMixMax.deduccionesCapadasMes + resMixMax.deduccionArt336Mes)}</span>
              </div>
            </div>
          </div>

          {/* Paso 5: (=) Base Gravable Final */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-color)", background: "rgba(255,255,255,0.02)" }}>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 5: (=) Base Gravable Final</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Monto sobre el que se calcula el impuesto (90.83 UVT mensuales | 1090 UVT anuales con UVT = {formatCOP(C.UVT)})</div>
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--text-primary)", textAlign: "right" }}>
              (=) {formatCOP(resMixMax.baseGravableMes)}
            </div>
          </div>

          {/* Impuesto Calculado */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: "2px solid var(--accent-purple)", marginTop: "4px" }}>
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--accent-purple)" }}>Impuesto Calculado</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Retención en la fuente mensual</div>
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, fontFamily: "JetBrains Mono, monospace", color: "var(--accent-purple)", textAlign: "right" }}>
              {formatCOP(resMixMax.impuestoMes)}
            </div>
          </div>
        </div>
      </div>

      {/* Sección Educativa */}
      <div style={{ 
        background: "var(--bg-card)", 
        border: "1px solid var(--border-color)", 
        borderRadius: 16, 
        padding: 24,
        marginTop: 24
      }}>
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>
            ⚖️ ¡Cuidado con la estructuración de tu salario! (Normativa UGPP y CST)
          </h3>
          
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
            gap: 16 
          }}>
            {/* Columna 1: SÍ */}
            <div style={{ 
              background: "rgba(16, 185, 129, 0.1)", 
              padding: 16, 
              borderRadius: 8,
              border: "1px solid rgba(16, 185, 129, 0.2)"
            }}>
              <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--accent-emerald)", marginBottom: 12 }}>
                ✅ ¿Qué SÍ es válido? (Art. 128 CST)
              </h4>
              <ul style={{ fontSize: "0.85rem", color: "var(--text-secondary)", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                <li>Auxilios pactados por mutuo acuerdo (alimentación, vestuario, educación).</li>
                <li>Primas extralegales ocasionales.</li>
                <li>Gastos de representación y herramientas de trabajo.</li>
                <li>Participación en utilidades.</li>
              </ul>
            </div>
            
            {/* Columna 2: NO */}
            <div style={{ 
              background: "rgba(239, 68, 68, 0.1)", 
              padding: 16, 
              borderRadius: 8,
              border: "1px solid rgba(239, 68, 68, 0.2)"
            }}>
              <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "#ef4444", marginBottom: 12 }}>
                ❌ ¿Qué NO es válido? (Art. 127 CST)
              </h4>
              <ul style={{ fontSize: "0.85rem", color: "var(--text-secondary)", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                <li>Comisiones por ventas.</li>
                <li>Horas extras y recargos nocturnos.</li>
                <li>Bonificaciones habituales que retribuyan directamente el desempeño del trabajo.</li>
                <li>Disfrazar salario ordinario como auxilios (Evocación de fraude ante la UGPP).</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bloque de Impacto */}
        <div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>
            Impacto Financiero
          </h3>
          
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
            gap: 16 
          }}>
            {/* Beneficios */}
            <div style={{ 
              background: "rgba(255, 255, 255, 0.02)", 
              padding: 16, 
              borderRadius: 8,
              border: "1px solid var(--border-color)"
            }}>
              <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--accent-emerald)", marginBottom: 12 }}>
                🟢 Beneficios (El lado amable de la Ley 1393)
              </h4>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: 8 }}>
                <p><strong>Para el empleado:</strong> Mayor flujo de caja mensual neto (más dinero en el bolsillo), ya que se reduce la base para los descuentos del 8% de PILA (Salud y Pensión).</p>
                <p><strong>Para la empresa:</strong> Ahorro masivo en costos de nómina (aprox. 30% al 40%), ya que no se pagan aportes parafiscales, ni seguridad social, ni prestaciones sobre esta porción.</p>
              </div>
            </div>
            
            {/* Perjuicios */}
            <div style={{ 
              background: "rgba(255, 255, 255, 0.02)", 
              padding: 16, 
              borderRadius: 8,
              border: "1px solid var(--border-color)"
            }}>
              <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#f59e0b", marginBottom: 12 }}>
                ⚠️ Perjuicios / Costos Ocultos (El lado oscuro para el empleado)
              </h4>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: 8 }}>
                <p><strong>Prestaciones Sociales:</strong> Al no ser salario, recibirás menos dinero en tus Cesantías, Intereses sobre Cesantías y Prima de Servicios de mitad y fin de año.</p>
                <p><strong>Vacaciones:</strong> Tu liquidación de vacaciones será menor.</p>
                <p><strong>Futuro Pensional:</strong> Tu Ingreso Base de Liquidación (IBL) será más bajo, lo que significa una mesada pensional menor en la vejez al cotizar sobre una base reducida.</p>
              </div>
            </div>
          </div>
        </div>
    </div>
  </div>
  );
}
