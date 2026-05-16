"use client";
import { ResultadoCalculo, formatCOP, formatUVT, TABLA_ART_241, PRESUNCION_COSTOS_UGPP } from "@/lib/tax-calculator";
interface Props { resultado: ResultadoCalculo; aplicaTabla383?: boolean; }

function Row({ label, value, sub, bold, accent, negative, dim, valueColor, subTestId }: {
  label: string; value: string; sub?: string;
  bold?: boolean; accent?: boolean; negative?: boolean; dim?: boolean;
  valueColor?: string; subTestId?: string;
}) {
  const color = valueColor
    ? valueColor
    : accent
      ? "var(--accent-cyan)"
      : negative
        ? "var(--accent-rose)"      // red for SS deductions
        : dim
          ? "var(--text-muted)"
          : bold
            ? "var(--text-primary)" // white for bold totals
            : "var(--accent-emerald)"; // green for default income values
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
      padding:"10px 0", gap:12, borderBottom:"1px solid var(--border-color)" }}>
      <span style={{ fontSize:"0.78rem", color: dim?"var(--text-muted)":"var(--text-secondary)", flex:1 }}>
        {label}
      </span>
      <div style={{ textAlign:"right" }}>
        <span data-testid={subTestId} style={{ fontSize:"0.82rem", fontWeight: bold?700:500,
          fontFamily:"JetBrains Mono, monospace", color }}>{value}</span>
        {sub && <span style={{ display: "block", fontSize:"0.68rem", color:"var(--text-muted)" }}>{sub}</span>}
      </div>
    </div>
  );
}

function SectionHead({ title, color }: { title: string; color: string }) {
  return (
    <div style={{ fontSize:"0.65rem", fontWeight:800, letterSpacing:"0.08em",
      color, marginTop:14, marginBottom:4, display:"flex", alignItems:"center", gap:6 }}>
      <div style={{ width:16, height:2, borderRadius:1, background:color }} />{title}
    </div>
  );
}

export function SeccionProyeccionAnual({ resultado: r, aplicaTabla383 }: Props) {
  const C = r.constantes;
  const tramo = TABLA_ART_241.find(t => r.baseGravableAnualUVT >= t.desde && r.baseGravableAnualUVT < t.hasta)
    ?? TABLA_ART_241[TABLA_ART_241.length - 1];

  return (
    <div className="card animate-fade-up" style={{ gridColumn:"1/-1" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
        <div style={{ width:36, height:36, borderRadius:10,
          background:"linear-gradient(135deg,rgba(6,182,212,0.15),rgba(6,182,212,0.05))",
          border:"1px solid rgba(6,182,212,0.2)",
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        </div>
        <div>
          <div style={{ fontWeight:700, fontSize:"0.92rem", color:"var(--text-primary)" }}>
            Resumen Fiscal Anual {r.anio}
          </div>
          <div style={{ fontSize:"0.68rem", color:"var(--text-muted)", fontWeight:600, letterSpacing:"0.06em" }}>
            PROYECCIÓN ANUAL · ARTS. 241, 336, 387 E.T.
          </div>
        </div>
        {!r.obligadoDeclarar && (
          <div style={{ marginLeft:"auto", padding:"4px 12px", borderRadius:20,
            background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.25)",
            fontSize:"0.68rem", fontWeight:700, color:"#34d399" }}>
            ✓ No obligado a declarar
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 24 }}>

        {/* Warning banner */}
        <div style={{
          padding: "12px 16px", borderRadius: 8,
          background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)",
          fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5,
          marginTop: -8
        }}>
          💡 <strong style={{ color: "#eab308" }}>¿Por qué se calcula todo Anual?</strong> Todo cálculo oficial de retención requiere proyectar tu salario anual (×12) y computar topes anualizados. Luego el impuesto resultante se divide entre 12 meses.
        </div>

        <div className="main-grid">

          {/* ── INGRESOS — values in cyan ── */}
          <div style={{ padding: 32, borderRadius: 20, background: "rgba(6, 182, 212, 0.06)", border: "1px solid rgba(6, 182, 212, 0.15)" }}>
            <SectionHead title={r.isIndependiente ? "DEPURACIÓN UGPP / CÁLCULO IBC ANUAL" : "INGRESOS LABORALES"} color="#06b6d4" />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>

              
              {r.isIndependiente && r.ibcMes !== undefined ? (
                <div style={{ margin: "16px 0 8px", padding: "20px 16px 16px", borderRadius: 12, background: "rgba(148, 163, 184, 0.05)", border: "1px dashed rgba(148, 163, 184, 0.3)", position: "relative" }}>
                  
                  <Row label="Ingreso Bruto Anual" value={formatCOP(r.ingresoBrutoAnual)} />
                  
                  <Row negative label={
                    r.actividadUGPP === "Costos Reales (Declarados con Soportes)"
                      ? "(-) Costos Reales (UGPP = DIAN)"
                      : r.actividadUGPP && PRESUNCION_COSTOS_UGPP[r.actividadUGPP] !== undefined
                        ? `(-) Costos Presuntos UGPP (${formatCOP(r.ingresoBrutoAnual)} × ${(PRESUNCION_COSTOS_UGPP[r.actividadUGPP] * 100).toFixed(2)}%)`
                        : "(-) Costos Presuntos UGPP"
                  } value={`− ${formatCOP((r.costosUGPPMes || 0) * 12)}`} />
                  
                  <div style={{ padding: "10px 0", borderBottom: "1px solid var(--border-color)", borderTop: "1px solid var(--border-color)", margin: "10px 0" }}>
                    <Row bold label="Ingreso Neto para SS Anual" value={formatCOP(r.ingresoNetoSSMes! * 12)} />
                    <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: -4 }}>Dinero sobre el cual se calcula la base de cotización</div>
                  </div>

                  {r.tieneCapacidadDePago === false ? (
                    <div style={{ margin: "12px 0", padding: "10px 14px", borderRadius: 8, background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", color: "#f59e0b", fontSize: "0.75rem" }}>
                      ⚠️ <strong>Sin Capacidad de Pago:</strong> Tus ingresos netos son inferiores a 1 SMMLV ({formatCOP(C.SMMLV * 12)} anuales). No estás obligado a cotizar a seguridad social.
                    </div>
                  ) : (
                    <div style={{ margin: "12px 0", padding: "10px 14px", borderRadius: 8, background: "rgba(52, 211, 153, 0.1)", border: "1px solid rgba(52, 211, 153, 0.3)", color: "#34d399", fontSize: "0.75rem" }}>
                      ✅ <strong>Con Capacidad de Pago:</strong> Tus ingresos netos superan 1 SMMLV ({formatCOP(C.SMMLV * 12)} anuales). Es obligatorio cotizar sobre el IBC calculado.
                    </div>
                  )}
                  
                  <div style={{ paddingTop: 4 }}>
                    <Row label="(×) Factor de cotización (40%)" value={`IBC Sugerido: ${formatCOP(Math.max(0, r.ingresoNetoSSMes! * 0.40) * 12)}`} />
                  </div>
                  
                  {r.usandoIBCMinimo && (
                    <div style={{ background: "rgba(251,146,60,0.1)", color: "#fb923c", padding: "8px 12px", borderRadius: 6, fontSize: "0.75rem", margin: "12px 0 4px" }}>
                      ⚠️ <strong>Ajuste al Piso Legal:</strong> El IBC no puede ser menor a 1 Salario Mínimo ({formatCOP(C.SMMLV * 12)} anual).
                    </div>
                  )}
                  {!r.usandoIBCMinimo && r.ibcMes >= C.SMMLV * 25 && (
                    <div style={{ background: "rgba(251,146,60,0.1)", color: "#fb923c", padding: "8px 12px", borderRadius: 6, fontSize: "0.75rem", margin: "12px 0 4px" }}>
                      ⚠️ <strong>Ajuste al Techo Legal:</strong> El IBC se topó al máximo de 25 Salarios Mínimos.
                    </div>
                  )}

                  <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-body)", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border-color)" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>Base de Cotización Final (IBC Anual)</div>
                      {r.usandoIBCMinimo && (
                        <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: 2, marginBottom: 2 }}>
                          Desglose: 12 meses × {formatCOP(C.SMMLV)} (Salario Mínimo Vigente).
                        </div>
                      )}
                      <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Valor definitivo para Salud y Pensión</div>
                    </div>
                    <div data-testid="ibc-valor-visual" style={{ fontWeight: 800, fontSize: "1.05rem", fontFamily: "JetBrains Mono, monospace", color: "var(--text-primary)" }}>
                      {formatCOP(r.ibcAnual!)}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* 1. DESGLOSE DEL INGRESO BRUTO */}
                  <Row label="Salario Base"
                    value={formatCOP(r.salarioMensual * 12)}
                    sub={`Mensual: ${formatCOP(r.salarioMensual)}`}
                    valueColor="#06b6d4" />
                  {r.totalDevengadoMes !== undefined && (r.totalDevengadoMes - r.salarioMensual) > 0 && (
                    <Row label="(+) Ingresos No Salariales / Bonos"
                      value={formatCOP((r.totalDevengadoMes - r.salarioMensual) * 12)}
                      sub={`Mensual: ${formatCOP(r.totalDevengadoMes - r.salarioMensual)}`} />
                  )}
                  {r.calificaAuxilio && (
                    <Row dim label="(+) Auxilio Transporte"
                      value={formatCOP(r.auxilioTransporteMensual * 12)}
                      sub={`Mensual: ${formatCOP(r.auxilioTransporteMensual)}`} />
                  )}
                  <Row bold label="(=) INGRESO BRUTO TOTAL"
                    value={formatCOP(r.ingresoBrutoAnual)}
                    sub={`Mensual: ${formatCOP(r.ingresoBrutoAnual / 12)}`} />

                  {/* 2. REFACTORIZACIÓN DE LA SECCIÓN "DEPURACIÓN UGPP" para Asalariados */}
                  {r.totalDevengadoMes !== undefined && (
                    <div style={{ margin: "16px 0 8px", padding: "20px 16px 16px", borderRadius: 12, background: "rgba(148, 163, 184, 0.05)", border: "1px dashed rgba(148, 163, 184, 0.3)", position: "relative" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 12 }}>DEPURACIÓN UGPP (Ley 1393)</div>
                      
                       <Row label="Renglón A: Ingreso Total (Salario + Bonos)" 
                        value={formatCOP(r.totalDevengadoMes! * 12)}
                        sub={`Mensual: ${formatCOP(r.totalDevengadoMes!)}`} />
                      
                      <Row label="Renglón B: Límite Legal del 40% (Art. 1 Ley 1393)" 
                        value={formatCOP(r.limite40Ley1393! * 12)}
                        sub={`Mensual: ${formatCOP(r.limite40Ley1393!)}`} />
                      
                      <Row label="Renglón C: Ingresos No Salariales / Bonos" 
                        value={formatCOP((r.ingresosNoSalarialesMensual || 0) * 12)}
                        sub={`Mensual: ${formatCOP(r.ingresosNoSalarialesMensual || 0)}`} />
                      
                      <div>
                        <Row label="Renglón D: (+) Exceso Sujeto a Aportes" 
                          value={formatCOP(r.excesoLey1393! * 12)}
                          sub={`Mensual: ${formatCOP(r.excesoLey1393!)}`}
                          valueColor={r.excesoLey1393! > 0 ? "var(--accent-rose)" : "var(--accent-emerald)"} />
                        <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: -4, marginBottom: 8 }}>
                          Renglón C - Renglón B. Si es negativo, es $0
                        </div>
                      </div>
                      
                      <div style={{ margin: "10px 0", borderTop: "1px solid var(--border-color)", paddingTop: 10 }}>
                        <Row bold label="Renglón E: (=) Base de Cotización (IBC)" 
                          value={formatCOP(r.ibcMes! * 12)}
                          sub={`Mensual: ${formatCOP(r.ibcMes!)}`} />
                        <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: -4 }}>
                          Salario Base + Exceso. Sobre este valor se calculan Salud y Pensión.
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── DESCUENTOS DE LEY Y DEDUCCIONES ── */}
          <div style={{ padding: 32, borderRadius: 20, background: "rgba(148, 163, 184, 0.06)", border: "1px solid rgba(148, 163, 184, 0.15)" }}>
            <SectionHead title="DESCUENTOS DE LEY Y DEDUCCIONES" color="#94a3b8" />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>

              {/* SS deductions → rose/red */}
              {r.isIndependiente && r.ibcMes !== undefined ? (
                <>
                  <Row negative label={`(-) Aporte Salud (12.5% de IBC: ${formatCOP(r.ibcMes! * 12)})`}
                    value={`- ${formatCOP(r.descuentoSaludAnual)}`} />
                  <Row negative label={`(-) Aporte Pensión (16% de IBC: ${formatCOP(r.ibcMes! * 12)})`}
                    value={`- ${formatCOP(r.descuentoPensionAnual)}`} />
                  <Row dim label="Subtotal PILA (28.5% sobre IBC)"
                    value={`- ${formatCOP(r.descuentoSaludAnual + r.descuentoPensionAnual)}`} />
                </>
              ) : (
                <>
                  <Row negative label={`(-) Aporte Salud (4% de IBC: ${formatCOP((r.ibcMes || 0) * 12)})`}
                    value={`- ${formatCOP(r.descuentoSaludAnual)}`} />
                  <Row negative label={`(-) Aporte Pensión (4% de IBC: ${formatCOP((r.ibcMes || 0) * 12)})`}
                    value={`- ${formatCOP(r.descuentoPensionAnual)}`} />
                  {r.calificaAuxilio && (
                    <Row negative label="(-) Auxilio de Transporte (INCRGO)"
                      value={`- ${formatCOP(r.auxilioTransporteMensual * 12)}`} />
                  )}
                </>
              )}

              {/* Renta Exenta → amber */}
              {aplicaTabla383 !== false && (
                <>
                  <Row label={`Renta Exenta 25% (Art. 206 #10)${r.isIndependiente ? " ⓘ Excluyente con costos y gastos" : ""}`}
                    value={`- ${formatCOP(r.rentaExentaAnual)}`}
                    valueColor="#f59e0b"
                    sub={r.topeRentaExentaActivo
                      ? `Tope 790 UVT activo (${formatCOP(r.topeRentaExentaAnual)})`
                      : formatUVT(r.rentaExentaAnual / C.UVT)} />

                  {/* Bloque pedagógico: Auditoría de Base Renta Exenta Anual */}
                  <div style={{ padding: "12px", borderRadius: "8px", background: "rgba(245, 158, 11, 0.03)", border: "1px solid rgba(245, 158, 11, 0.1)", marginTop: "4px", marginBottom: "4px", fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                    <div style={{ fontWeight: 700, marginBottom: "6px", color: "#f59e0b" }}>⚙️ Auditoría de Base Renta Exenta (Anual):</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                      <div style={{ opacity: 0.85 }}>• Ingreso Bruto Anual: <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(r.ingresoBrutoAnual)}</span></div>
                      <div style={{ opacity: 0.85 }}>(–) Aportes PILA Obligatorios (Salud + Pensión): <span style={{ fontFamily: "JetBrains Mono, monospace", color: "var(--accent-rose)" }}>- {formatCOP(r.descuentoSaludAnual + r.descuentoPensionAnual)}</span></div>
                      {r.calificaAuxilio && (
                        <div style={{ opacity: 0.85 }}>(–) Auxilio de Transporte (INCRGO): <span style={{ fontFamily: "JetBrains Mono, monospace", color: "var(--accent-rose)" }}>- {formatCOP(r.auxilioTransporteMensual * 12)}</span></div>
                      )}
                      <div style={{ borderTop: "1px dashed rgba(245, 158, 11, 0.2)", margin: "4px 0" }} />
                      <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>(=) Renta Líquida Base: <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(r.ingresoNetoAnual)}</span></div>
                      <div>(–) Dependientes Art. 387: <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(r.deduccionArt387Anual || 0)}</span></div>
                      <div>(–) Medicina Prepagada: <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(r.medicinaPrepagadaAnual || 0)}</span></div>
                      <div>(–) Intereses Vivienda: <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(r.interesesViviendaAnual || 0)}</span></div>
                      <div>(–) Aportes AFC / FPV: <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(r.aportesVoluntariosAnual || 0)}</span></div>
                      <div style={{ borderTop: "1px solid rgba(245,158,11,0.2)", marginTop: "4px", paddingTop: "4px", fontWeight: 600 }}>
                        (=) Base Depurada: <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{formatCOP(Math.max(0, r.ingresoNetoAnual - (r.deduccionArt387Anual || 0) - (r.medicinaPrepagadaAnual || 0) - (r.interesesViviendaAnual || 0) - (r.aportesVoluntariosAnual || 0)))}</span>
                      </div>
                      <div>(×) 25% de Ley = <span style={{ fontFamily: "JetBrains Mono, monospace", color: "#f59e0b" }}>{formatCOP(r.rentaExentaAnual)}</span> {r.topeRentaExentaActivo ? <span style={{ color: "#fb923c" }}>(Topado a 790 UVT)</span> : ""}</div>
                    </div>
                  </div>
                </>
              )}

              {/* Art. 387 → amber */}
              {r.tieneArt387 && (
                <Row label={`Deducción Dependientes (${r.numDependientes}) Art. 387`}
                  value={`- ${formatCOP(r.deduccionArt387Anual)}`}
                  valueColor="#f59e0b"
                  sub={r.topeArt387Activo
                    ? `Tope 384 UVT activo (${formatCOP(r.topeArt387Anual)})`
                    : `10% ingreso bruto`} />
              )}

              <Row label="(-) Medicina Prepagada / Seguros"
                value={`- ${formatCOP(r.medicinaPrepagadaAnual)}`}
                valueColor="#f59e0b"
                dim={r.medicinaPrepagadaAnual === 0} />

              <Row label="(-) Intereses de Vivienda"
                value={`- ${formatCOP(r.interesesViviendaAnual)}`}
                valueColor="#f59e0b"
                dim={r.interesesViviendaAnual === 0} />

              {/* Límite 40% progress bar */}
              {aplicaTabla383 !== false && (
                <div style={{ margin: "16px 0", padding: "16px 20px", borderRadius: 12,
                  background: "rgba(148,163,184,0.05)", border: "1px solid rgba(148,163,184,0.15)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>LÍMITE 40% / 1.340 UVT</span>
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
                      <span>⚠️</span> Techo alcanzado. Deducciones limitadas a {formatCOP(r.techoDeduccionFinalAnual)}
                    </div>
                  )}
                </div>
              )}

              {/* Art. 336 → orange */}
              {r.tieneArt336 && (
                <Row label={`Deducción Especial Art. 336 (${r.numDependientes} dep.)`}
                  value={`- ${formatCOP(r.deduccionArt336Anual)}`}
                  valueColor="#fb923c"
                  sub={`${r.deduccionArt336AnualUVT} UVT anuales`} />
              )}

              {/* TOTAL → cyan (accent) */}
              {/* 1. RENDERIZADO DE COSTOS DIAN */}
              {r.isIndependiente && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      {r.actividadUGPP === "Costos Reales (Declarados con Soportes)"
                        ? "(-) Costos Reales DIAN (con soporte)"
                        : "(-) Costos DIAN (Presuntivos = $0)"}
                    </span>
                    {r.actividadUGPP !== "Costos Reales (Declarados con Soportes)" && (
                      <div style={{ fontSize: "0.69rem", color: "#f59e0b", marginTop: 3, lineHeight: 1.4 }}>
                        ⚠️ Los costos presuntos <strong>solo aplican para la UGPP</strong>. Ante la DIAN son <strong>$0</strong> sin soportes.
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.9rem", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "var(--accent-rose)" }}>
                      - {formatCOP((r.costosDeduciblesMes || 0) * 12)}
                    </span>
                  </div>
                </div>
              )}

              {/* 2. EL GRAN TOTAL DE DEDUCCIONES */}
              {(() => {
                const costosTotales = r.isIndependiente ? (r.costosDeduciblesMes || 0) * 12 : 0;
                const auxTranspAnual = r.calificaAuxilio ? r.auxilioTransporteMensual * 12 : 0;
                const granTotalDeducciones = r.descuentoSaludAnual + r.descuentoPensionAnual + auxTranspAnual + costosTotales + r.rentaExentaAnual + (r.tieneArt387 ? r.deduccionArt387Anual : 0) + (r.tieneArt336 ? r.deduccionArt336Anual : 0);
                
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "16px 0", marginTop: 8, borderTop: "2px solid var(--accent-rose)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>(=) GRAN TOTAL DEDUCCIONES</span>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "1.1rem", fontWeight: 800, fontFamily: "JetBrains Mono, monospace", color: "var(--accent-rose)" }}>
                          - {formatCOP(granTotalDeducciones)}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      (Suma de PILA + Costos + Exenciones E.T. que se restan del Ingreso Bruto)
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* ── BASE E IMPUESTO ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Base Gravable → green */}
            <div style={{ padding: 32, borderRadius: 20, background: "rgba(52, 211, 153, 0.06)", border: "1px solid rgba(52, 211, 153, 0.15)" }}>
              <SectionHead title="BASE GRAVABLE ANUAL" color="#34d399" />
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Ingreso Bruto</span>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", color: "var(--accent-emerald)" }}>{formatCOP(r.ingresoBrutoAnual)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                  <span style={{ color: "var(--text-secondary)" }}>(-) Gran Total Deducciones</span>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", color: "var(--accent-rose)" }}>- {formatCOP(r.descuentoSaludAnual + r.descuentoPensionAnual + (r.calificaAuxilio ? r.auxilioTransporteMensual * 12 : 0) + (r.isIndependiente ? (r.costosDeduciblesMes || 0) * 12 : 0) + r.rentaExentaAnual + (r.tieneArt387 ? r.deduccionArt387Anual : 0) + (r.tieneArt336 ? r.deduccionArt336Anual : 0))}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1rem", fontWeight: 700, borderTop: "1.5px solid rgba(52, 211, 153, 0.3)", paddingTop: 12, marginTop: 4 }}>
                  <span style={{ color: "var(--text-primary)" }}>(=) Base Gravable Final</span>
                  <div style={{ textAlign: "right" }}>
                    <span data-testid="base-uvt-anual" style={{ fontFamily: "JetBrains Mono, monospace", color: "var(--accent-emerald)" }}>{formatCOP(r.baseGravableAnual)}</span>
                    <span style={{ display: "block", fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 500 }}>
                      {formatUVT(r.baseGravableAnualUVT)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Impuesto → green */}
            <div style={{ padding: 32, borderRadius: 20, background: "rgba(52, 211, 153, 0.06)", border: "1px solid rgba(52, 211, 153, 0.15)" }}>
              <SectionHead title="IMPUESTO ESTIMADO ANUAL" color="#34d399" />
              <Row dim label="Tramo marginal"
                value={`${(tramo.marginal * 100).toFixed(0)}%`}
                sub={`Base: ${r.baseGravableAnualUVT.toFixed(1)} UVT`} />

              {/* Desglose de Tabla Progresiva (Caja Blanca) */}
              <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(52, 211, 153, 0.1)" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 8, fontWeight: 600 }}>
                  Desglose de Tabla (Art. 241):
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: 4 }}>
                  <div>• Base Gravable en UVT: <span style={{ fontFamily: "JetBrains Mono, monospace", color: "var(--text-secondary)" }}>{r.baseGravableAnualUVT.toFixed(2)}</span> UVT</div>
                  <div>• Tramo Aplicable: <span style={{ color: "var(--text-secondary)" }}>&gt; {tramo.desde} a {tramo.hasta === Infinity ? "más" : tramo.hasta}</span> UVT (Tarifa Marginal: <span style={{ color: "var(--text-secondary)" }}>{(tramo.marginal * 100).toFixed(0)}%</span>)</div>
                  <div>• Fórmula Legal: <span style={{ color: "var(--text-secondary)" }}>(Base UVT - {tramo.baseUVT}) × {(tramo.marginal * 100).toFixed(0)}% + {tramo.cuotaFija}</span></div>
                  <div>• Cálculo: <span style={{ color: "var(--text-secondary)" }}>({r.baseGravableAnualUVT.toFixed(2)} - {tramo.baseUVT}) × {(tramo.marginal * 100).toFixed(0)}% + {tramo.cuotaFija} = {((r.baseGravableAnualUVT - tramo.baseUVT) * tramo.marginal + tramo.cuotaFija).toFixed(2)}</span> UVT</div>
                  <div>• Conversión a Pesos: <span style={{ fontFamily: "JetBrains Mono, monospace", color: "#34d399" }}>{((r.baseGravableAnualUVT - tramo.baseUVT) * tramo.marginal + tramo.cuotaFija).toFixed(2)} UVT × ${C.UVT.toLocaleString("es-CO")} = {formatCOP(r.impuestoAnual)}</span></div>
                </div>
              </div>

              <div style={{ marginTop: 16, padding: 24, borderRadius: 16,
                background: "linear-gradient(135deg,rgba(52,211,153,0.1),rgba(52,211,153,0.04))",
                border: "1.5px solid rgba(52,211,153,0.25)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#34d399", letterSpacing: "0.05em" }}>
                  IMPUESTO ANUAL ESTIMADO
                </div>
                <div style={{ fontSize: "2.4rem", fontWeight: 800, fontFamily: "JetBrains Mono, monospace", color: "#34d399" }}>
                  {formatCOP(r.impuestoAnual)}
                </div>
              </div>

              {/* Advertencia ICA Anual */}
              <div style={{
                marginTop: "16px",
                padding: "16px",
                borderRadius: "12px",
                backgroundColor: "rgba(245, 158, 11, 0.05)",
                border: "1px dashed rgba(245, 158, 11, 0.3)",
                display: "flex",
                flexDirection: "column",
                gap: "8px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#f59e0b", fontWeight: 600, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px" }}>
                    🏛️ Impuesto Municipal (ICA) No Incluido
                  </span>
                  <span style={{ color: "#f59e0b", fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>
                    ~ {formatCOP(r.ingresoBrutoAnual * 0.01)} / año
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  El ICA se cobra sobre tu <strong>Ingreso Bruto total</strong> sin importar tus costos o deducciones. La tarifa exacta depende del municipio donde prestes el servicio. La cifra mostrada asume un estándar conservador del 1% (10 por mil).
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
