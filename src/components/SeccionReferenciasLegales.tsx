"use client";

interface Referencia {
  articulo: string;
  titulo: string;
  descripcion: string;
  color: string;
  bg: string;
  border: string;
}

const REFERENCIAS: Referencia[] = [
  {
    articulo: "Art. 383",
    titulo: "Retención en la Fuente",
    descripcion: "Establece las tarifas de retención en la fuente para pagos laborales. La retención mensual se calcula proyectando el pago anual y aplicando la tabla del Art. 241.",
    color: "#06b6d4",
    bg: "rgba(6,182,212,0.06)",
    border: "rgba(6,182,212,0.18)",
  },
  {
    articulo: "Art. 241",
    titulo: "Tarifa para Personas Naturales (Renta Anual)",
    descripcion: "Define la tabla progresiva anual en UVT: 0%, 19%, 28%, 33%, 35%, 37% y 39%. Aplica a la renta líquida gravable de personas naturales residentes.",
    color: "#34d399",
    bg: "rgba(52,211,153,0.06)",
    border: "rgba(52,211,153,0.18)",
  },
  {
    articulo: "Art. 206 #10",
    titulo: "Renta Exenta del 25% (Laboral)",
    descripcion: "El 25% del ingreso neto (salario − seguridad social) es renta exenta, hasta un tope de 790 UVT anuales ($41,375,460 en 2026 / $39,341,210 en 2025).",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.06)",
    border: "rgba(167,139,250,0.18)",
  },
  {
    articulo: "Art. 387",
    titulo: "Deducción por Dependientes (Dentro del 40%)",
    descripcion: "Si el trabajador tiene personas a cargo, puede deducir el 10% del ingreso bruto mensual, con tope de 32 UVT/mes (384 UVT/año). Esta deducción sí entra en el control del límite global del 40%.",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.06)",
    border: "rgba(245,158,11,0.18)",
  },
  {
    articulo: "Art. 336",
    titulo: "Deducción Especial 72 UVT/Dependiente (Fuera del 40%)",
    descripcion: "Introducida por la Ley 2277 de 2022. Por cada dependiente (máximo 4), se restan 72 UVT anuales de la base gravable después de aplicar el tope del 40%. No computa en dicho límite.",
    color: "#fb923c",
    bg: "rgba(251,146,60,0.06)",
    border: "rgba(251,146,60,0.18)",
  },
];

export function SeccionReferenciasLegales({ anio }: { anio: number }) {
  return (
    <section
      aria-label="Sustento Legal y Referencias"
      style={{ maxWidth: 1180, margin: "48px auto 0", padding: "0 24px" }}
    >
      {/* Cabecera */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "rgba(148,163,184,0.08)",
          border: "1px solid rgba(148,163,184,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text-primary)" }}>
            Sustento Legal y Referencias
          </div>
          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em" }}>
            ESTATUTO TRIBUTARIO COLOMBIA · VIGENCIA {anio}
          </div>
        </div>
      </div>

      {/* Cards de artículos */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: 12,
        marginBottom: 24,
      }}>
        {REFERENCIAS.map((r) => (
          <div key={r.articulo} style={{
            padding: "14px 16px",
            borderRadius: 12,
            background: r.bg,
            border: `1.5px solid ${r.border}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{
                padding: "2px 10px", borderRadius: 6,
                background: `${r.color}18`,
                border: `1px solid ${r.color}33`,
                fontSize: "0.7rem", fontWeight: 800,
                letterSpacing: "0.06em", color: r.color,
                fontFamily: "JetBrains Mono, monospace",
              }}>{r.articulo} E.T.</span>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {r.titulo}
              </span>
            </div>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.65, margin: 0 }}>
              {r.descripcion}
            </p>
          </div>
        ))}
      </div>

      {/* Límite 40% explicado */}
      <div style={{
        padding: "14px 18px", borderRadius: 12, marginBottom: 20,
        background: "rgba(148,163,184,0.05)",
        border: "1px solid rgba(148,163,184,0.15)",
        fontSize: "0.77rem", color: "var(--text-secondary)", lineHeight: 1.7,
      }}>
        <strong style={{ color: "var(--text-primary)" }}>📐 Límite Global del 40% (Art. 336 párr. 3):</strong>{" "}
        La suma de la renta exenta del 25% <em>más</em> las deducciones que incluyan el Art. 387 no puede
        exceder el <strong>40% del ingreso neto</strong>, ni superar <strong>1.340 UVT anuales</strong>.
        Las deducciones del Art. 336 (72 UVT/dependiente) se aplican <em>después</em> de este techo y son adicionales.
      </div>

      {/* Disclaimer */}
      <div style={{
        padding: "12px 16px", borderRadius: 10,
        background: "rgba(30,41,59,0.4)",
        border: "1px solid rgba(71,85,105,0.3)",
        textAlign: "center",
      }}>
        <p style={{
          fontSize: "0.72rem",
          color: "#64748b", // Slate-500
          margin: 0, lineHeight: 1.65,
        }}>
          ⚖️ <strong style={{ color: "#94a3b8" }}>Simulador con fines pedagógicos.</strong>{" "}
          Los cálculos para {anio - 1}/{anio} no sustituyen la asesoría de un contador profesional.
          Consulta siempre al DIAN o a un profesional certificado antes de tomar decisiones tributarias.
          Referencias normativas: Estatuto Tributario (D. 624/1989) y Ley 2277 de 2022.
        </p>
      </div>
    </section>
  );
}
