"use client";
import { ResultadoCalculo, formatCOP, formatUVT } from "@/lib/tax-calculator";
interface Props {
  resultado: ResultadoCalculo;
  ahorroPorAportesVoluntarios: number;
}

export function SeccionDiagnosticoAhorro({ resultado: r, ahorroPorAportesVoluntarios }: Props) {
  const tieneDep = r.numDependientes > 0;

  if (r.isImpuestoCero) {
    return (
      <div className="card animate-fade-up">
        <div style={{ textAlign:"center", padding:"8px 0 4px" }}>
          <div style={{ fontSize:"2.2rem", marginBottom:10 }}>🟢</div>
          <div style={{ fontWeight:800, fontSize:"1rem", color:"var(--accent-emerald)", marginBottom:10 }}>
            Situación Tributaria Óptima
          </div>
          <p style={{ fontSize:"0.8rem", color:"var(--text-secondary)", lineHeight:1.7, maxWidth:440, margin:"0 auto 14px" }}>
            Para tu ingreso actual de{" "}
            <strong style={{ color:"var(--text-primary)", fontFamily:"JetBrains Mono,monospace" }}>
              {formatCOP(r.salarioMensual)}/mes
            </strong>
            , tu retención es de <strong style={{ color:"var(--accent-emerald)" }}>$0</strong>.
            Tu base gravable ({formatUVT(r.baseGravableAnualUVT)}) está por debajo de
            los 1.090 UVT mínimos de la tabla Art. 241.
          </p>

          {tieneDep && (
            <div style={{ padding:"10px 14px", borderRadius:10, marginBottom:14,
              background:"rgba(245,158,11,0.07)", border:"1px solid rgba(245,158,11,0.2)",
              fontSize:"0.77rem", color:"#f59e0b", textAlign:"left" }}>
              <strong>👨‍👩‍👧 Tus {r.numDependientes} dependiente(s) contribuyen</strong> a mantener
              esa base baja:{" "}
              <strong>Art. 387</strong> redujo {formatCOP(r.deduccionArt387Anual)}/año dentro del 40%, y{" "}
              <strong>Art. 336</strong> restó {formatCOP(r.deduccionArt336Anual)}/año adicionales
              ({r.deduccionArt336AnualUVT} UVT) fuera del límite global.
            </div>
          )}

          {r.aportesVoluntariosMensual > 0 ? (
            <div style={{ padding:"12px 14px", borderRadius:10, marginBottom:14,
              background:"rgba(6,182,212,0.06)", border:"1px solid rgba(6,182,212,0.18)", textAlign: "left" }}>
              <div style={{ fontWeight:700, fontSize:"0.78rem", color:"#06b6d4", marginBottom:8 }}>
                💰 Impacto de tus Aportes Voluntarios
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <div style={{ padding:"8px 10px", borderRadius:8,
                  background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ fontSize:"0.64rem", color:"var(--text-muted)", fontWeight:700, marginBottom:3 }}>
                    APORTES MES
                  </div>
                  <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.8rem",
                    fontWeight:700, color:"var(--text-primary)" }}>
                    {formatCOP(r.aportesVoluntariosMensual)}/mes
                  </div>
                  <div style={{ fontSize:"0.67rem", color:"var(--text-muted)", marginTop:2 }}>
                    {formatCOP(r.aportesVoluntariosAnual)}/año
                  </div>
                </div>
                <div style={{ padding:"8px 10px", borderRadius:8,
                  background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.15)" }}>
                  <div style={{ fontSize:"0.64rem", color:"#22c55e", fontWeight:700, marginBottom:3 }}>
                    AHORRO GENERADO
                  </div>
                  <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.8rem",
                    fontWeight:700, color:"#22c55e" }}>
                    {formatCOP(ahorroPorAportesVoluntarios)}/año
                  </div>
                  <div style={{ fontSize:"0.67rem", color:"var(--text-muted)", marginTop:2 }}>
                    {formatCOP(ahorroPorAportesVoluntarios / 12)}/mes
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize:"0.75rem", color:"var(--text-muted)", lineHeight:1.6 }}>
              No requieres estrategias de AFC ni pensiones voluntarias en este momento.
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Caso con impuesto > 0 ──────────────────────────────────
  const marginalPct = `${(r.tramoMarginal * 100).toFixed(0)}%`;
  const cupoMes     = r.cupoDisponibleMes;
  const cupoAnual   = r.cupoDisponibleAnual;
  const ahorroMes   = r.ahorroTributarioMensual;
  const ahorroAnual = r.ahorroTributarioAnual;
  const impuestoOriginalAnual = r.impuestoAnual;
  const impuestoOptimizadoAnual = r.impuestoOptimizadoAnual;

  return (
    <div className="card animate-fade-up">
      {/* Encabezado */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
        <div style={{ width:36, height:36, borderRadius:10,
          background:"linear-gradient(135deg,rgba(245,158,11,0.15),rgba(245,158,11,0.05))",
          border:"1px solid rgba(245,158,11,0.2)",
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div>
          <div style={{ fontWeight:700, fontSize:"0.92rem", color:"var(--text-primary)" }}>
            Diagnóstico de Ahorro Fiscal
          </div>
          <div style={{ fontSize:"0.68rem", color:"var(--text-muted)", fontWeight:600, letterSpacing:"0.06em" }}>
            TRAMO MARGINAL {marginalPct} · VIGENCIA {r.anio}
          </div>
        </div>
      </div>

      {/* Chip tramo */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
        <span style={{ padding:"4px 12px", borderRadius:20,
          background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.25)",
          fontSize:"0.7rem", fontWeight:700, color:"#f59e0b" }}>
          Tramo marginal: {marginalPct}
        </span>
        <span style={{ padding:"4px 12px", borderRadius:20,
          background:"rgba(6,182,212,0.08)", border:"1px solid rgba(6,182,212,0.2)",
          fontSize:"0.7rem", fontWeight:700, color:"#06b6d4" }}>
          Base: {formatUVT(r.baseGravableAnualUVT)}
        </span>
        {tieneDep && (
          <span style={{ padding:"4px 12px", borderRadius:20,
            background:"rgba(251,146,60,0.08)", border:"1px solid rgba(251,146,60,0.2)",
            fontSize:"0.7rem", fontWeight:700, color:"#fb923c" }}>
            👨‍👩‍👧 {r.numDependientes} dependiente{r.numDependientes>1?"s":""}
          </span>
        )}
      </div>

      {/* Bloque dependientes activo */}
      {tieneDep && (
        <div style={{ padding:"12px 14px", borderRadius:10, marginBottom:14,
          background:"rgba(251,146,60,0.06)", border:"1px solid rgba(251,146,60,0.18)" }}>
          <div style={{ fontWeight:700, fontSize:"0.78rem", color:"#fb923c", marginBottom:8 }}>
            📋 Beneficios por Dependientes Aplicados
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <div style={{ padding:"8px 10px", borderRadius:8,
              background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.15)" }}>
              <div style={{ fontSize:"0.64rem", color:"#f59e0b", fontWeight:700, marginBottom:3 }}>
                ART. 387 (Dentro 40%)
              </div>
              <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.8rem",
                fontWeight:700, color:"var(--text-primary)" }}>
                {formatCOP(r.deduccionArt387Mes)}/mes
              </div>
              <div style={{ fontSize:"0.67rem", color:"var(--text-muted)", marginTop:2 }}>
                {formatCOP(r.deduccionArt387Anual)}/año
                {r.topeArt387Activo && " · ⚠ topado"}
              </div>
            </div>
            <div style={{ padding:"8px 10px", borderRadius:8,
              background:"rgba(251,146,60,0.08)", border:"1px solid rgba(251,146,60,0.15)" }}>
              <div style={{ fontSize:"0.64rem", color:"#fb923c", fontWeight:700, marginBottom:3 }}>
                ART. 336 (Fuera 40%)
              </div>
              <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.8rem",
                fontWeight:700, color:"var(--text-primary)" }}>
                {formatCOP(r.deduccionArt336Mes)}/mes
              </div>
              <div style={{ fontSize:"0.67rem", color:"var(--text-muted)", marginTop:2 }}>
                {formatCOP(r.deduccionArt336Anual)}/año · {r.deduccionArt336AnualUVT} UVT
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Diagnóstico Legal de Optimización */}
      <div style={{ padding:"14px", borderRadius:12,
        background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", marginTop: 14 }}>
        <div style={{ fontWeight:700, fontSize:"0.85rem", color:"#06b6d4", marginBottom:10 }}>
          💡 Diagnóstico Legal de Optimización (AFC / Pensiones Voluntarias)
        </div>

        {r.aportesVoluntariosMensual > 0 && (
          <div style={{ padding:"12px 14px", borderRadius:10, marginBottom:14,
            background:"rgba(6,182,212,0.06)", border:"1px solid rgba(6,182,212,0.18)" }}>
            <div style={{ fontWeight:700, fontSize:"0.78rem", color:"#06b6d4", marginBottom:8 }}>
              💰 Impacto de tus Aportes Voluntarios
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <div style={{ padding:"8px 10px", borderRadius:8,
                background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize:"0.64rem", color:"var(--text-muted)", fontWeight:700, marginBottom:3 }}>
                  APORTES MES
                </div>
                <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.8rem",
                  fontWeight:700, color:"var(--text-primary)" }}>
                  {formatCOP(r.aportesVoluntariosMensual)}/mes
                </div>
                <div style={{ fontSize:"0.67rem", color:"var(--text-muted)", marginTop:2 }}>
                  {formatCOP(r.aportesVoluntariosAnual)}/año
                </div>
              </div>
              <div style={{ padding:"8px 10px", borderRadius:8,
                background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.15)" }}>
                <div style={{ fontSize:"0.64rem", color:"#22c55e", fontWeight:700, marginBottom:3 }}>
                  AHORRO GENERADO
                </div>
                <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.8rem",
                  fontWeight:700, color:"#22c55e" }}>
                  {formatCOP(ahorroPorAportesVoluntarios)}/año
                </div>
                <div style={{ fontSize:"0.67rem", color:"var(--text-muted)", marginTop:2 }}>
                  {formatCOP(ahorroPorAportesVoluntarios / 12)}/mes
                </div>
              </div>
            </div>
          </div>
        )}
        
        {cupoAnual > 0 ? (
          <>
            <p style={{ fontSize:"0.78rem", color:"var(--text-secondary)", lineHeight:1.7, margin:"0 0 12px" }}>
              De acuerdo al Art. 336 del E.T., tus deducciones tienen un doble candado: máximo el 40% de tu ingreso neto o 1.340 UVT al año.
              Tu límite legal estricto permite aportar hasta <strong style={{ color:"var(--text-primary)", fontFamily:"JetBrains Mono,monospace" }}>{formatCOP(cupoMes)} / mes</strong> ({formatCOP(cupoAnual)} / año) a cuentas AFC o Pensiones Voluntarias sin pasarte de la ley.
              <br /><br />
              <em>Nota: Multiplicar el cupo por la tarifa marginal ({marginalPct}) genera una sobreestimación del ahorro al ignorar la progresividad de la tabla (Art. 241). Este simulador calcula el DELTA exacto liquidando el impuesto con y sin el aporte.</em>
              <br /><br />
              Aprovechar tu cupo legal máximo te ahorraría exactamente:
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:12, marginBottom:12 }}>
              {/* Bloque 1: El Escenario Actual */}
              <div style={{ padding:"14px", borderRadius:10,
                background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)",
                textAlign:"center" }}>
                <div style={{ fontSize:"0.65rem", color:"var(--text-muted)", fontWeight:700, marginBottom:4 }}>Sin Optimizar (Impuesto Original)</div>
                <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.95rem",
                  fontWeight:700, color:"var(--text-primary)" }}>{formatCOP(impuestoOriginalAnual)}</div>
                <div style={{ fontSize:"0.6rem", color:"var(--text-muted)", marginTop:4 }}>Impuesto de renta proyectado al año</div>
              </div>

              {/* Bloque 2: Escenario Optimizado */}
              <div style={{ padding:"14px", borderRadius:10,
                background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.15)",
                textAlign:"center", position: "relative" }}>
                <div style={{ fontSize:"0.65rem", color:"#22c55e", fontWeight:700, marginBottom:4 }}>Aportando el Tope Legal</div>
                <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"0.95rem",
                  fontWeight:700, color:"var(--text-primary)" }}>{formatCOP(impuestoOptimizadoAnual)}</div>
                <div style={{ fontSize:"0.6rem", color:"var(--text-muted)", marginTop:4 }}>Nuevo impuesto proyectado</div>
                {impuestoOptimizadoAnual === 0 && (
                  <div style={{ position:"absolute", top:-8, right:-8, background:"#22c55e", color:"#fff", fontSize:"0.55rem", fontWeight:700, padding:"2px 6px", borderRadius:10, textTransform:"uppercase" }}>
                    ¡Impuesto $0!
                  </div>
                )}
              </div>
            </div>

            {/* Bloque 3: El Gran Total */}
            <div style={{ padding:"16px", borderRadius:10,
              background:"linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.05))", border:"1px solid rgba(6,182,212,0.3)",
              textAlign:"center" }}>
              <div style={{ fontSize:"0.75rem", color:"#06b6d4", fontWeight:700, marginBottom:4 }}>🔥 TU AHORRO TRIBUTARIO NETO</div>
              <div style={{ fontFamily:"JetBrains Mono,monospace", fontSize:"1.3rem",
                fontWeight:800, color:"#06b6d4" }}>{formatCOP(ahorroAnual)} / año</div>
              <div style={{ fontSize:"0.7rem", color:"var(--text-secondary)", marginTop:4 }}>
                Equivale a dejar de pagar <strong>{formatCOP(ahorroMes)}</strong> cada mes a la DIAN.
              </div>
            </div>
          </>
        ) : (
          <p style={{ fontSize:"0.78rem", color:"#ef4444", lineHeight:1.7, margin: 0 }}>
            🛑 Límite Legal Alcanzado: Ya has copado tu límite del 40% (o 1.340 UVT) con tu renta exenta y otras deducciones. La ley no te permite obtener beneficios fiscales adicionales por aportes a AFC.
          </p>
        )}
      </div>
    </div>
  );
}
