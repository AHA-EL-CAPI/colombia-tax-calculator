"use client";
import { ResultadoCalculo, formatCOP, formatUVT, PRESUNCION_COSTOS_UGPP, TABLA_ART_383 } from "@/lib/tax-calculator";
interface Props { resultado: ResultadoCalculo; aplicaTabla383?: boolean; }

function Row({ label, value, sub, bold, accent, negative, dim, highlight, valueColor, subTestId, valueTestId }: {
  label: string; value: string; sub?: string;
  bold?: boolean; accent?: boolean; negative?: boolean; dim?: boolean;
  highlight?: string; valueColor?: string; subTestId?: string; valueTestId?: string;
}) {
  const color = valueColor
    ? valueColor
    : accent
      ? "var(--accent-cyan)"
      : negative
        ? "var(--accent-rose)"     // red for SS deductions
        : dim
          ? "var(--text-muted)"
          : bold
            ? "var(--text-primary)" // white for totals
            : highlight
              ? highlight           // tinted to highlight color (violet, amber, orange)
              : "var(--accent-emerald)"; // green for standard income values
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
      padding:"14px 0", gap:16,
      borderBottom:"1px solid var(--border-color)",
      background: highlight ? `${highlight}12` : undefined,
      borderRadius: highlight ? 10 : undefined,
      paddingLeft: highlight ? 16 : undefined,
      paddingRight: highlight ? 16 : undefined,
      margin: highlight ? "6px 0" : undefined,
    }}>
      <span style={{ fontSize:"0.78rem", color: dim?"var(--text-muted)":"var(--text-secondary)", flex:1 }}>{label}</span>
      <div style={{ textAlign:"right" }}>
        <span data-testid={valueTestId} style={{ fontSize:"0.82rem", fontWeight:bold?700:500,
          fontFamily:"JetBrains Mono, monospace", color }}>{value}</span>
        {sub && <span data-testid={subTestId} style={{ display:"block", fontSize:"0.68rem", color:"var(--text-muted)" }}>{sub}</span>}
      </div>
    </div>
  );
}

function SectionHead({ title, color, note }: { title:string; color:string; note?:string }) {
  return (
    <div style={{ marginTop:16, marginBottom:6 }}>
      <div style={{ fontSize:"0.65rem", fontWeight:800, letterSpacing:"0.08em",
        color, display:"flex", alignItems:"center", gap:6 }}>
        <div style={{ width:16, height:2, borderRadius:1, background:color }}/>{title}
      </div>
      {note && <div style={{ fontSize:"0.66rem", color:"var(--text-muted)", marginTop:2 }}>{note}</div>}
    </div>
  );
}

export function SeccionResumenLey({ resultado: r, aplicaTabla383 }: Props) {
  const C = r.constantes;
  const tramo = TABLA_ART_383.find(t => r.baseGravableMesUVT >= t.desde && r.baseGravableMesUVT < t.hasta)
    ?? TABLA_ART_383[TABLA_ART_383.length - 1];
    
  const costosTotalesMes = r.isIndependiente ? (r.costosDeduciblesMes || 0) : 0;
  const auxTranspMes = r.calificaAuxilio ? r.auxilioTransporteMensual : 0;
  const granTotalDeduccionesMes = r.descuentoSaludMes + r.descuentoPensionMes + auxTranspMes + costosTotalesMes + r.rentaExentaMes + r.deduccionArt387Mes + r.medicinaPrepagadaMensual + r.interesesViviendaMensual;

  return (
    <div className="card animate-fade-up" style={{ gridColumn:"1/-1" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
        <div style={{ width:36, height:36, borderRadius:10,
          background:"linear-gradient(135deg,rgba(52,211,153,0.15),rgba(52,211,153,0.05))",
          border:"1px solid rgba(52,211,153,0.2)",
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </div>
        <div>
          <div style={{ fontWeight:700, fontSize:"0.92rem", color:"var(--text-primary)" }}>
            Impacto en tu Nómina Mensual
          </div>
          <div style={{ fontSize:"0.68rem", color:"var(--text-muted)", fontWeight:600, letterSpacing:"0.06em" }}>
            DESGLOSE MENSUAL (ANUAL ÷ 12) · VIGENCIA {r.anio}
          </div>
        </div>
        {r.numDependientes > 0 && (
          <div style={{ marginLeft:"auto", padding:"4px 12px", borderRadius:20,
            background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.25)",
            fontSize:"0.68rem", fontWeight:700, color:"#f59e0b" }}>
            👨‍👩‍👧 {r.numDependientes} dependiente{r.numDependientes>1?"s":""}
          </div>
        )}
      </div>

      <div className="main-grid" style={{ marginTop: 24 }}>

        {/* TARJETA 1: DEPURACIÓN UGPP / CÁLCULO IBC MENSUAL */}
        <div style={{ padding: 32, borderRadius: 20, background: "rgba(6, 182, 212, 0.06)", border: "1px solid rgba(6, 182, 212, 0.15)" }}>
          <SectionHead title="DEPURACIÓN UGPP / CÁLCULO IBC MENSUAL" color="#06b6d4"/>
          
          {!r.isIndependiente ? (
            <>
              <Row label="Salario Base" value={formatCOP(r.salarioMensual)} valueColor="#06b6d4"/>
              {r.totalDevengadoMes !== undefined && (r.totalDevengadoMes - r.salarioMensual) > 0 && (
                <Row label="(+) Ingresos No Salariales / Bonos" value={formatCOP(r.totalDevengadoMes - r.salarioMensual)}/>
              )}
              {r.calificaAuxilio && <Row dim label="(+) Auxilio Transporte" value={formatCOP(r.auxilioTransporteMensual)}/>}
              <Row bold label="(=) INGRESO BRUTO TOTAL" value={formatCOP(r.ingresoBrutoMes)} />

              {/* Bloque DEPURACIÓN UGPP (Ley 1393) */}
              {r.totalDevengadoMes !== undefined && (
                <div style={{ margin: "16px 0 8px", padding: "16px 14px", borderRadius: 12, background: "rgba(148, 163, 184, 0.05)", border: "1px dashed rgba(148, 163, 184, 0.3)", position: "relative" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 12 }}>DEPURACIÓN UGPP (Ley 1393)</div>
                  
                  <Row label="Renglón A: Ingreso Total (Salario + Bonos)" 
                    value={formatCOP(r.totalDevengadoMes!)} />
                  
                  <Row label="Renglón B: Límite Legal del 40% (Art. 1 Ley 1393)" 
                    value={formatCOP(r.limite40Ley1393!)} />
                  
                  <Row label="Renglón C: Ingresos No Salariales / Bonos" 
                    value={formatCOP(r.ingresosNoSalarialesMensual || 0)} />
                  
                  <div>
                    <Row label="Renglón D: (+) Exceso Sujeto a Aportes" 
                      value={formatCOP(r.excesoLey1393!)}
                      valueColor={r.excesoLey1393! > 0 ? "var(--accent-rose)" : "var(--accent-emerald)"} />
                    <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: -4, marginBottom: 8 }}>
                      Renglón C - Renglón B. Si es negativo, es $0
                    </div>
                  </div>
                  
                  <div style={{ margin: "10px 0", borderTop: "1px solid var(--border-color)", paddingTop: 10 }}>
                    <Row bold label="Renglón E: (=) Base de Cotización (IBC)" 
                      value={formatCOP(r.ibcMes!)} />
                    <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: -4 }}>
                      Salario Base + Exceso. Sobre este valor se calculan Salud y Pensión.
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Row bold label="Ingreso Bruto Mensual" value={formatCOP(r.ingresoBrutoMes)} />
          )}

          {r.isIndependiente && r.ibcMes !== undefined && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border-color)" }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>(-) Deducciones por Actividad (Costos Presuntos o Reales)</span>
                  {r.actividadUGPP !== "Costos Reales (Declarados con Soportes)" && r.actividadUGPP && PRESUNCION_COSTOS_UGPP[r.actividadUGPP] !== undefined && (
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>
                      (${formatCOP(r.ingresoBrutoMes * 12)} × {(PRESUNCION_COSTOS_UGPP[r.actividadUGPP] * 100).toFixed(2)}% / 12)
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 500, fontFamily: "JetBrains Mono, monospace", color: "var(--accent-rose)" }}>
                    - {formatCOP(r.costosDeduciblesMes || 0)}
                  </span>
                </div>
              </div>

              <div style={{ padding: "10px 0", borderBottom: "1px solid var(--border-color)", borderTop: "1px solid var(--border-color)", margin: "10px 0" }}>
                <Row bold label="Ingreso Neto para SS Mensual" value={formatCOP(r.ingresoNetoSSMes!)} />
              </div>

              {r.tieneCapacidadDePago === false ? (
                <div style={{ margin: "12px 0", padding: "10px 14px", borderRadius: 8, background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", color: "#f59e0b", fontSize: "0.75rem" }}>
                  ⚠️ <strong>Sin Capacidad de Pago:</strong> Tus ingresos netos son inferiores a 1 SMMLV. No estás obligado a cotizar a seguridad social.
                </div>
              ) : (
                <div style={{ margin: "12px 0", padding: "10px 14px", borderRadius: 8, background: "rgba(52, 211, 153, 0.1)", border: "1px solid rgba(52, 211, 153, 0.3)", color: "#34d399", fontSize: "0.75rem" }}>
                  ✅ <strong>Con Capacidad de Pago:</strong> Tus ingresos netos son superiores a 1 SMMLV. Es obligatorio cotizar sobre el IBC calculado.
                </div>
              )}

              <div style={{ paddingTop: 4 }}>
                <Row label="(×) Factor de cotización (40%)" value={`IBC Sugerido: ${formatCOP(Math.max(0, r.ingresoNetoSSMes! * 0.40))}`} />
              </div>

              {r.usandoIBCMinimo && (
                <div style={{ background: "rgba(251,146,60,0.1)", color: "#fb923c", padding: "8px 12px", borderRadius: 6, fontSize: "0.75rem", margin: "12px 0 4px" }}>
                  ⚠️ <strong>Ajuste al Piso Legal:</strong> El IBC no puede ser menor a 1 Salario Mínimo ({formatCOP(C.SMMLV)}).
                </div>
              )}
              {!r.usandoIBCMinimo && r.ibcMes >= C.SMMLV * 25 && (
                <div style={{ background: "rgba(251,146,60,0.1)", color: "#fb923c", padding: "8px 12px", borderRadius: 6, fontSize: "0.75rem", margin: "12px 0 4px" }}>
                  ⚠️ <strong>Ajuste al Techo Legal:</strong> El IBC se topó al máximo de 25 Salarios Mínimos.
                </div>
              )}

              <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-body)", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border-color)" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>Base de Cotización Final (IBC Mensual)</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Valor definitivo para cotización</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: "1.05rem", fontFamily: "JetBrains Mono, monospace", color: "var(--text-primary)" }}>
                  {formatCOP(r.ibcMes!)}
                </div>
              </div>
            </>
          )}
        </div>

        {/* TARJETA UNIFICADA: DESCUENTOS DE LEY Y DEDUCCIONES (Mensualizado) */}
        <div style={{ padding: 32, borderRadius: 20, background: "rgba(148, 163, 184, 0.06)", border: "1px solid rgba(148, 163, 184, 0.15)" }}>
          <SectionHead title="DESCUENTOS DE LEY Y DEDUCCIONES (Mensualizado)" color="#94a3b8" />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {/* 1. Salud */}
            <Row negative label={r.isIndependiente && r.ibcMes !== undefined 
              ? `(-) Aporte Salud (12.5% de IBC: ${formatCOP(r.ibcMes)})` 
              : `(-) Aporte Salud (4% de IBC: ${formatCOP(r.ibcMes || 0)})`}
              value={`- ${formatCOP(r.descuentoSaludMes)}`} />
            
            {/* 2. Pensión */}
            <Row negative label={r.isIndependiente && r.ibcMes !== undefined 
              ? `(-) Aporte Pensión (16% de IBC: ${formatCOP(r.ibcMes)})` 
              : `(-) Aporte Pensión (4% de IBC: ${formatCOP(r.ibcMes || 0)})`}
              value={`- ${formatCOP(r.descuentoPensionMes)}`} />
            
            {/* 3. Subtotal PILA */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 700, borderTop: "1px solid rgba(148, 163, 184, 0.15)", paddingTop: 8, marginTop: 4 }}>
              <span style={{ color: "var(--text-secondary)" }}>(=) Subtotal PILA (Seguridad Social)</span>
              <span style={{ fontFamily: "JetBrains Mono, monospace", color: "var(--accent-rose)" }}>- {formatCOP(r.descuentoSaludMes + r.descuentoPensionMes)}</span>
            </div>

            {/* 4. Auxilio de Transporte */}
            {r.calificaAuxilio && (
              <Row negative label="(-) Auxilio de Transporte (INCRGO)"
                value={`- ${formatCOP(r.auxilioTransporteMensual)}`} />
            )}

            {/* 5. Medicina Prepagada */}
            <Row negative label="(-) Medicina Prepagada / Seguros" value={`- ${formatCOP(r.medicinaPrepagadaMensual)}`} dim={r.medicinaPrepagadaMensual === 0} />
            
            {/* 6. Dependientes */}
            <Row negative label={`(-) Dependientes (Art. 387 - 10%)`} value={`- ${formatCOP(r.deduccionArt387Mes)}`} />
            
            {/* 7. Intereses de Vivienda */}
            <Row negative label="(-) Intereses de Vivienda" value={`- ${formatCOP(r.interesesViviendaMensual)}`} dim={r.interesesViviendaMensual === 0} />
            
            {/* 8. Renta Exenta 25% */}
            <Row negative label="(-) Renta Exenta 25%" value={`- ${formatCOP(r.rentaExentaMes)}`} />
            
            {/* 9. Barra de Progreso Límite 40% */}
            {aplicaTabla383 !== false && (
              <div style={{ margin: "16px 0", padding: "16px 20px", borderRadius: 12,
                background: "rgba(148,163,184,0.05)", border: "1px solid rgba(148,163,184,0.15)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>LÍMITE 40% / 1.340 UVT (Mensualizado)</span>
                  <span style={{ fontSize: "0.8rem", fontFamily: "JetBrains Mono, monospace",
                    color: r.topeTecho40Activo ? "#f59e0b" : "var(--text-muted)" }}>{r.porcentajeUsado.toFixed(1)}% usado</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: "rgba(148,163,184,0.15)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 4, transition: "width 0.6s ease",
                    width: `${Math.min(100, r.porcentajeUsado)}%`,
                    background: r.topeTecho40Activo
                      ? "linear-gradient(90deg, #f59e0b, #ea580c)"
                      : "linear-gradient(90deg, #94a3b8, #64748b)" }} />
                </div>
                {r.topeTecho40Activo && (
                  <div style={{ marginTop: 8, fontSize: "0.75rem", color: "#fbbf24", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>⚠️</span> Techo alcanzado. Deducciones limitadas a {formatCOP(r.techoDeduccionFinalAnual / 12)}
                  </div>
                )}
              </div>
            )}

            {/* 10. Deducciones por Actividad (Costos) para Independientes */}
            {r.isIndependiente && (
              <Row negative label="(-) Deducciones por Actividad (Costos Presuntos o Reales)"
                value={`- ${formatCOP(r.costosDeduciblesMes || 0)}`} dim={(r.costosDeduciblesMes || 0) === 0} />
            )}

            {/* 11. GRAN TOTAL DEDUCCIONES */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", marginTop: 8, borderTop: "2px solid var(--accent-rose)" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>(=) GRAN TOTAL DEDUCCIONES</span>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "1.1rem", fontWeight: 800, fontFamily: "JetBrains Mono, monospace", color: "var(--accent-rose)" }}>
                  - {formatCOP(granTotalDeduccionesMes)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* COL 3 – Base y retención */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* TARJETA 4: BASE GRAVABLE MENSUAL */}
          <div style={{ padding: 32, borderRadius: 20, background: "rgba(52, 211, 153, 0.06)", border: "1px solid rgba(52, 211, 153, 0.15)" }}>
            <SectionHead title="BASE GRAVABLE MENSUAL" color="#34d399" />
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                <span style={{ color: "var(--text-secondary)" }}>Ingreso Bruto</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace", color: "var(--accent-emerald)" }}>{formatCOP(r.ingresoBrutoMes)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                <span style={{ color: "var(--text-secondary)" }}>(-) Gran Total Deducciones</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace", color: "var(--accent-rose)" }}>
                  - {formatCOP(granTotalDeduccionesMes)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1rem", fontWeight: 700, borderTop: "1.5px solid rgba(52, 211, 153, 0.3)", paddingTop: 12, marginTop: 4 }}>
                <span style={{ color: "var(--text-primary)" }}>(=) Base Gravable Final</span>
                <div style={{ textAlign: "right" }}>
                  <span data-testid="base-uvt-mes" style={{ fontFamily: "JetBrains Mono, monospace", color: "var(--accent-emerald)" }}>{formatCOP(r.baseGravableMes)}</span>
                  <span style={{ display: "block", fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 500 }}>
                    {formatUVT(r.baseGravableMesUVT)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* TARJETA 5: RETENCIÓN EN LA FUENTE */}
          <div style={{ padding: 32, borderRadius: 20, background: "rgba(52, 211, 153, 0.06)", border: "1px solid rgba(52, 211, 153, 0.15)" }}>
            <SectionHead title="RETENCIÓN EN LA FUENTE" color="#34d399" />
            
            {/* Desglose de Tabla Progresiva (Caja Blanca) */}
            <div style={{ marginTop: 12, marginBottom: 12, padding: 12, borderRadius: 10, background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(52, 211, 153, 0.1)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: 6, fontWeight: 600 }}>
                Desglose de Tabla (Art. 383):
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: 3 }}>
                <div>• Base Mensual UVT: <span style={{ fontFamily: "JetBrains Mono, monospace", color: "var(--text-secondary)" }}>{r.baseGravableMesUVT.toFixed(2)}</span> UVT</div>
                <div>• Tramo Aplicable: <span style={{ color: "var(--text-secondary)" }}>&gt; {tramo.desde} a {tramo.hasta === Infinity ? "más" : tramo.hasta}</span> UVT</div>
                <div>• Cálculo: <span style={{ color: "var(--text-secondary)" }}>({r.baseGravableMesUVT.toFixed(2)} - {tramo.baseUVT}) × {(tramo.marginal * 100).toFixed(0)}% + {tramo.cuotaFija} = {((r.baseGravableMesUVT - tramo.baseUVT) * tramo.marginal + tramo.cuotaFija).toFixed(2)}</span> UVT</div>
                <div>• Conversión a Pesos: <span style={{ fontFamily: "JetBrains Mono, monospace", color: "#34d399" }}>{((r.baseGravableMesUVT - tramo.baseUVT) * tramo.marginal + tramo.cuotaFija).toFixed(2)} UVT × ${C.UVT.toLocaleString("es-CO")} = {formatCOP(r.impuestoMes)}</span></div>
              </div>
            </div>
            
            <div style={{ padding: 16, borderRadius: 14, marginTop: 4,
              background: "linear-gradient(135deg,rgba(52,211,153,0.1),rgba(52,211,153,0.04))",
              border: "1.5px solid rgba(52,211,153,0.25)", textAlign: "center" }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#34d399", letterSpacing: "0.06em", marginBottom: 4 }}>
                RETENCIÓN MENSUAL ESTIMADA
              </div>
              <div data-testid="retencion-monthly-cop" style={{ fontSize: "1.9rem", fontWeight: 800,
                fontFamily: "JetBrains Mono, monospace", color: "#34d399" }}>
                {formatCOP(r.impuestoMes)}
              </div>
              <div style={{ fontSize: "0.71rem", color: "var(--text-muted)", marginTop: 4 }}>
                Anual: <strong style={{ color: "var(--text-secondary)" }}>{formatCOP(r.impuestoAnual)}</strong>
              </div>
            </div>

            {/* Advertencia ICA Mensual (Provisión) */}
            <div style={{
              marginTop: "16px",
              padding: "12px 16px",
              borderRadius: "12px",
              backgroundColor: "rgba(245, 158, 11, 0.05)",
              border: "1px solid rgba(245, 158, 11, 0.2)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ color: "#f59e0b", fontWeight: 600, fontSize: "0.85rem" }}>
                  💡 Provisión sugerida para ICA
                </span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                  Reserva este monto de tu flujo de caja mensual.
                </span>
              </div>
              <span style={{ color: "#f59e0b", fontFamily: "JetBrains Mono, monospace", fontWeight: 600, fontSize: "0.9rem" }}>
                {formatCOP((r.ingresoBrutoAnual * 0.01) / 12)} / mes
              </span>
            </div>

            {/* Cupo disponible (solo si obligado a declarar and no topado) */}
            {r.obligadoDeclarar && !r.topeTecho40Activo && (
              <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 10,
                background: "rgba(6, 182, 212, 0.05)", border: "1px solid rgba(6, 182, 212, 0.15)" }}>
                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#06b6d4", marginBottom: 3 }}>
                  Cupo disponible para AFC / Pensiones Voluntarias
                </div>
                <div style={{ fontSize: "0.77rem", fontWeight: 600,
                  fontFamily: "JetBrains Mono, monospace", color: "var(--text-primary)" }}>
                  {formatCOP(r.cupoDisponibleMes)}/mes · {formatCOP(r.cupoDisponibleAnual)}/año
                </div>
                <div style={{ fontSize: "0.67rem", color: "var(--text-muted)", marginTop: 2 }}>
                  {formatUVT(r.cupoDisponibleAnual / C.UVT)} restantes en el 40%
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
