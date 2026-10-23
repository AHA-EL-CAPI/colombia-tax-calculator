"use client";
import { useState, useCallback } from "react";
import { DependientesInput } from "@/components/DependientesInput";

// ── Tipo de Vinculación ──────────────────────────────────────────
type TipoVinculacion = "asalariados" | "independientes" | "cedular" | "magico-asalariados" | "magico-independientes" | "simple-independientes";

const TABS_VINCULACION: { id: TipoVinculacion; label: string; icon: string }[] = [
  { id: "asalariados",    label: "Asalariados",    icon: "🏢" },
  { id: "independientes", label: "Independientes",  icon: "💼" },
  { id: "cedular",        label: "Declaración Anual", icon: "📑" },
  { id: "simple-independientes", label: "Régimen Simple", icon: "🏪" },
  { id: "magico-asalariados", label: "Mágico Asalariados", icon: "✨" },
  { id: "magico-independientes", label: "Mágico Independientes", icon: "🪄" },
];

// ── Componente: Segmented Control de Vinculación ─────────────────
function VinculacionSelector({
  tipo,
  onChange,
}: {
  tipo: TipoVinculacion;
  onChange: (t: TipoVinculacion) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Tipo de vinculación laboral"
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        padding: "4px",
        borderRadius: 14,
        background: "#0f172a",          // Slate-900 – alto contraste
        border: "1.5px solid #1e293b",  // Slate-800
        gap: 2,
      }}
    >
      {TABS_VINCULACION.map(({ id, label, icon }) => {
        const active = id === tipo;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 22px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 700,
              letterSpacing: "0.01em",
              transition: "background 0.22s ease, color 0.22s ease, box-shadow 0.22s ease",
              background: active
                ? "linear-gradient(135deg, rgba(52,211,153,0.22), rgba(52,211,153,0.1))"
                : "transparent",
              color: active ? "#34d399" : "#64748b",  // Emerald-400 activo, Slate-400 inactivo
              boxShadow: active
                ? "inset 0 0 0 1.5px rgba(52,211,153,0.45), 0 0 14px rgba(52,211,153,0.12)"
                : "none",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: "1rem" }}>{icon}</span>
            {label}
          </button>
        );
      })}
    </div>
  );
}


import {
  calcularRetencion,
  calcularRetencionIndependiente,
  formatCOP,
  CONSTANTES_POR_ANIO,
  PRESUNCION_COSTOS_UGPP,
  type ActividadIndependiente,
  type AnioGravable,
} from "@/lib/tax-calculator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SeccionProyeccionAnual } from "@/components/SeccionProyeccionAnual";
import { SeccionResumenLey } from "@/components/SeccionResumenLey";
import { SeccionDiagnosticoAhorro } from "@/components/SeccionDiagnosticoAhorro";
import { SeccionReferenciasLegales } from "@/components/SeccionReferenciasLegales";
import { SalarioMagicoAsalariados } from "@/components/SalarioMagicoAsalariados";
import { SalarioMagicoIndependientes } from "@/components/SalarioMagicoIndependientes";
import { RegimenSimpleIndependientes } from "@/components/RegimenSimpleIndependientes";
import { DeclaracionCedular } from "@/components/DeclaracionCedular";
import CompareBrokers from "@/components/CompareBrokers";

// ── Year selector tabs ───────────────────────────────────────────
const ANIOS: AnioGravable[] = [2025, 2026];

function YearSelector({
  anio,
  onChange,
}: {
  anio: AnioGravable;
  onChange: (a: AnioGravable) => void;
}) {
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "4px",
      borderRadius: 12,
      background: "var(--bg-card)",
      border: "1.5px solid var(--border-color)",
    }}>
      {ANIOS.map((a) => {
        const active = a === anio;
        return (
          <button
            key={a}
            onClick={() => onChange(a)}
            aria-pressed={active}
            style={{
              padding: "7px 20px",
              borderRadius: 9,
              border: "none",
              cursor: "pointer",
              fontSize: "0.82rem",
              fontWeight: 700,
              fontFamily: "JetBrains Mono, monospace",
              letterSpacing: "0.04em",
              transition: "all 0.18s ease",
              background: active
                ? "linear-gradient(135deg, #06b6d4, #34d399)"
                : "transparent",
              color: active ? "#0f172a" : "var(--text-muted)",
              boxShadow: active ? "0 0 12px rgba(6,182,212,0.35)" : "none",
            }}
          >
            {a}
          </button>
        );
      })}
    </div>
  );
}

// ── Quick-select salaries (recalculated per year) ────────────────
function getSalariosRapidos(anio: AnioGravable) {
  const C = CONSTANTES_POR_ANIO[anio];
  return [
    { label: "2 SMMLV", value: 2 * C.SMMLV },
    { label: "5 SMMLV", value: 5 * C.SMMLV },
    { label: "$8M",     value: 8_000_000 },
    { label: "$12M",    value: 12_000_000 },
    { label: "$20M",    value: 20_000_000 },
    { label: "$30M",    value: 30_000_000 },
  ];
}

// ── Section divider ──────────────────────────────────────────────
function SectionDivider({
  topLabel,
  bottomLabel,
  topColor,
  bottomColor,
}: {
  topLabel: string;
  bottomLabel: string;
  topColor: string;
  bottomColor: string;
}) {
  return (
    <div style={{ position: "relative", margin: "36px 0", display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
        padding: "6px 14px", borderRadius: 20,
        background: "var(--bg-card)",
        border: `1.5px solid ${topColor}33`,
        fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em",
        textTransform: "uppercase", color: topColor,
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="18 15 12 9 6 15" />
        </svg>
        {topLabel}
      </div>

      <div style={{ flex: 1, position: "relative", height: 1, background: `linear-gradient(90deg, ${topColor}33, ${bottomColor}33)` }}>
        <div style={{
          position: "absolute", left: "50%", top: "50%",
          transform: "translate(-50%, -50%)",
          padding: "5px 14px", borderRadius: 20,
          background: "var(--bg-primary)",
          border: "1px solid var(--border-color)",
          fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em",
          textTransform: "uppercase", color: "var(--text-muted)",
          whiteSpace: "nowrap",
        }}>
          ÷ 12 meses
        </div>
      </div>

      <div style={{
        display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
        padding: "6px 14px", borderRadius: 20,
        background: "var(--bg-card)",
        border: `1.5px solid ${bottomColor}33`,
        fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em",
        textTransform: "uppercase", color: bottomColor,
      }}>
        {bottomLabel}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  );
}


export default function CalculadoraPage() {
  const [activeTab, setActiveTab] = useState<'taxes' | 'invest'>('taxes');
  const [salarioRaw, setSalarioRaw] = useState<string>("5000000");
  const [tipoVinculacion, setTipoVinculacion] = useState<TipoVinculacion>("asalariados");
  const [anio, setAnio] = useState<AnioGravable>(2026);
  const [numDependientes, setNumDependientes] = useState<number>(0);

  // Independientes state
  const [actividad, setActividad] = useState<ActividadIndependiente>("Presunción Media");
  const [aplicaTabla383, setAplicaTabla383] = useState<boolean>(true);
  const [costosRealesRaw, setCostosRealesRaw] = useState<string>("");
  const [aportesVoluntariosRaw, setAportesVoluntariosRaw] = useState<string>("");
  const [medicinaPrepagadaRaw, setMedicinaPrepagadaRaw] = useState<string>("");
  const [interesesViviendaRaw, setInteresesViviendaRaw] = useState<string>("");
  const [ingresosNoSalarialesRaw, setIngresosNoSalarialesRaw] = useState<string>("");
  
  // Nuevas deducciones anuales
  const [deduccionGMFAnualRaw, setDeduccionGMFAnualRaw] = useState<string>("");
  const [deduccionFacturaAnualRaw, setDeduccionFacturaAnualRaw] = useState<string>("");

  const salarioBase = Math.max(0, parseInt(salarioRaw.replace(/[^0-9]/g, ""), 10) || 0);
  const rawCostos = Math.max(0, parseInt(costosRealesRaw.replace(/[^0-9]/g, ""), 10) || 0);
  // Validar que los costos reales no superen los ingresos brutos
  const costosRealesCop = Math.min(rawCostos, salarioBase);
  const aportesVoluntariosCop = Math.max(0, parseInt(aportesVoluntariosRaw.replace(/[^0-9]/g, ""), 10) || 0);
  const medicinaPrepagadaCop = Math.max(0, parseInt(medicinaPrepagadaRaw.replace(/[^0-9]/g, ""), 10) || 0);
  const interesesViviendaCop = Math.max(0, parseInt(interesesViviendaRaw.replace(/[^0-9]/g, ""), 10) || 0);
  const ingresosNoSalarialesCop = Math.max(0, parseInt(ingresosNoSalarialesRaw.replace(/[^0-9]/g, ""), 10) || 0);
  const deduccionGMFAnualCop = Math.max(0, parseInt(deduccionGMFAnualRaw.replace(/[^0-9]/g, ""), 10) || 0);
  const deduccionFacturaAnualCop = Math.max(0, parseInt(deduccionFacturaAnualRaw.replace(/[^0-9]/g, ""), 10) || 0);

  const resultado = tipoVinculacion === "asalariados"
    ? calcularRetencion(salarioBase, anio, numDependientes, aportesVoluntariosCop, medicinaPrepagadaCop, interesesViviendaCop, deduccionGMFAnualCop, deduccionFacturaAnualCop, ingresosNoSalarialesCop)
    : calcularRetencionIndependiente(salarioBase, actividad, aplicaTabla383, 0.11, anio, numDependientes, costosRealesCop, aportesVoluntariosCop, medicinaPrepagadaCop, interesesViviendaCop, deduccionGMFAnualCop, deduccionFacturaAnualCop);

  const resultadoSinVoluntarios = tipoVinculacion === "asalariados"
    ? calcularRetencion(salarioBase, anio, numDependientes, 0, medicinaPrepagadaCop, interesesViviendaCop, deduccionGMFAnualCop, deduccionFacturaAnualCop, ingresosNoSalarialesCop)
    : calcularRetencionIndependiente(salarioBase, actividad, aplicaTabla383, 0.11, anio, numDependientes, costosRealesCop, 0, medicinaPrepagadaCop, interesesViviendaCop, deduccionGMFAnualCop, deduccionFacturaAnualCop);

  const ahorroPorAportesVoluntarios = Math.max(0, resultadoSinVoluntarios.impuestoAnual - resultado.impuestoAnual);

  const { obligadoDeclarar } = resultado;

  const C = CONSTANTES_POR_ANIO[anio];
  const UMBRAL_DECLARAR_COP = C.UMBRAL_DECLARAR_UVT * C.UVT;
  // Salario mensual que corresponde exactamente al umbral anual
  const UMBRAL_MENSUAL_COP = Math.round(UMBRAL_DECLARAR_COP / 12);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    setSalarioRaw(raw);
  }, []);

  const handleAnioChange = useCallback((a: AnioGravable) => {
    setAnio(a);
  }, []);

  const displayValue = salarioBase > 0 ? salarioBase.toLocaleString("es-CO") : "";
  const salariosRapidos = getSalariosRapidos(anio);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)", paddingBottom: 80 }}>

      {/* ══ HEADER ══════════════════════════════════════════════════ */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        backgroundColor: "rgba(15, 23, 42, 0.88)",
        borderBottom: "1px solid var(--border-color)",
        padding: "0 24px",
      }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Logo */}
            <div style={{
              width: 38, height: 38, borderRadius: 11,
              background: "linear-gradient(135deg, #06b6d4, #34d399)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 18px rgba(6,182,212,0.35)",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.96rem", color: "var(--text-primary)", lineHeight: 1.2 }}>
                Retención en la Fuente
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", lineHeight: 1 }}>
                Art. 241 E.T. · Colombia {anio} · Metodología Anual-First
              </div>
            </div>
          </div>
          {/* Year selector in header + theme toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <YearSelector anio={anio} onChange={handleAnioChange} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── TABS DE NAVEGACIÓN ── */}
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 32, paddingLeft: 24, paddingRight: 24 }}>
        <div style={{
          display: "flex",
          background: "var(--bg-card)",
          borderRadius: 20,
          padding: 6,
          border: "1px solid var(--border-color)",
          gap: 6
        }}>
          <button
            onClick={() => setActiveTab('taxes')}
            style={{
              padding: "10px 24px",
              borderRadius: 14,
              fontWeight: 700,
              fontSize: "0.9rem",
              transition: "all 0.2s ease",
              background: activeTab === 'taxes' ? "linear-gradient(135deg, rgba(6,182,212,0.15), rgba(52,211,153,0.1))" : "transparent",
              color: activeTab === 'taxes' ? "var(--accent-emerald)" : "var(--text-muted)",
              border: activeTab === 'taxes' ? "1px solid rgba(52,211,153,0.3)" : "1px solid transparent",
              cursor: "pointer",
            }}
          >
            🏛️ Calculadora de Impuestos
          </button>
          <button
            onClick={() => setActiveTab('invest')}
            style={{
              padding: "10px 24px",
              borderRadius: 14,
              fontWeight: 700,
              fontSize: "0.9rem",
              transition: "all 0.2s ease",
              background: activeTab === 'invest' ? "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(147,51,234,0.1))" : "transparent",
              color: activeTab === 'invest' ? "#60a5fa" : "var(--text-muted)",
              border: activeTab === 'invest' ? "1px solid rgba(96,165,250,0.3)" : "1px solid transparent",
              cursor: "pointer",
            }}
          >
            📈 Comparador Brokers
          </button>
        </div>
      </div>

      {activeTab === 'taxes' ? (
        <>
          {/* ══ HERO ═══════════════════════════════════════════════════ */}
          <div style={{ padding: "44px 24px 0", textAlign: "center" }}>
        {/* Live badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "6px 16px", borderRadius: 20,
          background: "rgba(6,182,212,0.08)",
          border: "1px solid rgba(6,182,212,0.2)", marginBottom: 18,
        }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#06b6d4" }} className="animate-pulse-glow" />
          <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#06b6d4" }}>
            Cálculo en tiempo real
          </span>
        </div>
        <h1 style={{ fontSize: "clamp(1.7rem, 4vw, 2.5rem)", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2, marginBottom: 12 }}>
          Calculadora de Retención
          <br />
          <span style={{ background: "linear-gradient(90deg, #06b6d4, #34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            en la Fuente {anio}
          </span>
        </h1>
        <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
          Calcula tu impuesto en base anual (norma DIAN) y observa el impacto real mensual
          en tu nómina — incluyendo AFC y pensiones voluntarias.
        </p>

        {/* ── Tipo de Vinculación: Segmented Control ── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 28, marginBottom: 0 }}>
          <VinculacionSelector tipo={tipoVinculacion} onChange={setTipoVinculacion} />
          {/* Nota aclaratoria */}
          <p style={{
            fontSize: "0.72rem",
            color: "#64748b",   // Slate-400
            margin: 0,
            letterSpacing: "0.01em",
          }}>
            Cálculos válidos para personas con contrato laboral vigente en Colombia (Rentas de Trabajo).
          </p>
        </div>

        {/* ── Year selector ── */}
        <div style={{
          display: "flex", justifyContent: "center", marginTop: 20, marginBottom: 4, gap: 12,
        }}>
          <YearSelector anio={anio} onChange={handleAnioChange} />
        </div>

        {/* UVT reference chip for selected year */}
        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 10 }}>
          UVT {anio}:{" "}
          <span style={{ color: "var(--accent-cyan)", fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>
            ${C.UVT.toLocaleString("es-CO")}
          </span>
          {" · "}SMMLV:{" "}
          <span style={{ color: "var(--accent-emerald)", fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>
            ${C.SMMLV.toLocaleString("es-CO")}
          </span>
          {" · "}Aux. Transporte:{" "}
          <span style={{ color: "var(--accent-amber)", fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>
            ${C.AUX_TRANSPORTE.toLocaleString("es-CO")}
          </span>
        </div>
      </div>

      {/* ══ MAIN CONTENT ═══════════════════════════════════════════ */}
      <main style={{ maxWidth: 1180, margin: "36px auto 0", padding: "0 24px" }}>

        {tipoVinculacion === "magico-asalariados" && (
          <div className="animate-fade-up">
            <div style={{ background: "var(--bg-card)", padding: 20, borderRadius: 16, border: "1px solid var(--border-color)", marginBottom: 24 }}>
              <DependientesInput value={numDependientes} onChange={setNumDependientes} />
            </div>
            <SalarioMagicoAsalariados 
              anio={anio} 
              numDependientes={numDependientes} 
              medicinaPrepagadaCop={medicinaPrepagadaCop}
              interesesViviendaCop={interesesViviendaCop}
            />
          </div>
        )}

        {tipoVinculacion === "magico-independientes" && (
          <div className="animate-fade-up">
            <SalarioMagicoIndependientes
              anio={anio}
              numDependientes={numDependientes}
              setNumDependientes={setNumDependientes}
              actividad={actividad}
              setActividad={setActividad}
              aplicaTabla383={aplicaTabla383}
              setAplicaTabla383={setAplicaTabla383}
              costosRealesCop={costosRealesCop}
              setCostosRealesRaw={setCostosRealesRaw}
              medicinaPrepagadaCop={medicinaPrepagadaCop}
              interesesViviendaCop={interesesViviendaCop}
            />
          </div>
        )}

        {tipoVinculacion === "simple-independientes" && (
          <div className="animate-fade-up">
            <RegimenSimpleIndependientes
              anio={anio}
              uvt={C.UVT}
              smmlv={C.SMMLV}
            />
          </div>
        )}

        {tipoVinculacion === "cedular" && (
          <div className="animate-fade-up">
            <DeclaracionCedular anio={anio} />
          </div>
        )}

        {(tipoVinculacion === "asalariados" || tipoVinculacion === "independientes") && (
          <>
            {/* ── INPUT CARD (full-width) ────────────────────────────── */}
            <div className="card animate-fade-up" style={{ animationDelay: "0s", marginBottom: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24, alignItems: "start" }}>

                {/* Left: Input + Quick Select */}
                <div key={tipoVinculacion} className="animate-fade-up">
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <span className="section-badge badge-emerald">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      {tipoVinculacion === "asalariados" ? `Salario Base Mensual — Año Gravable ${anio}` : `Ingresos Brutos Mensuales — Año Gravable ${anio}`}
                    </span>
                  </div>
                  <div style={{ position: "relative", marginBottom: 16 }}>
                    <span style={{
                      position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
                      fontFamily: "JetBrains Mono, monospace", fontWeight: 700,
                      color: "var(--accent-emerald)", fontSize: "1.1rem",
                    }}>$</span>
                    <input
                      type="text"
                      id="salario-mensual"
                      name="salario-mensual"
                      inputMode="numeric"
                      className="tax-input"
                      style={{ paddingLeft: 34, fontSize: "1.15rem" }}
                      value={displayValue}
                      onChange={handleInputChange}
                      placeholder="0"
                      aria-label={tipoVinculacion === "asalariados" ? `Salario base mensual en pesos colombianos para año gravable ${anio}` : `Ingresos brutos mensuales`}
                    />
                  </div>

                  {tipoVinculacion === "asalariados" && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {salariosRapidos.map(({ label, value }) => (
                        <button
                          key={label}
                          onClick={() => setSalarioRaw(String(value))}
                          style={{
                            padding: "7px 14px", borderRadius: 8,
                            border: `1.5px solid ${salarioBase === value ? "var(--accent-emerald)" : "var(--border-color)"}`,
                            background: salarioBase === value ? "var(--glow-emerald)" : "transparent",
                            color: salarioBase === value ? "var(--accent-emerald)" : "var(--text-secondary)",
                            fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                            transition: "all 0.18s ease",
                            fontFamily: "JetBrains Mono, monospace",
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}

                  {tipoVinculacion === "asalariados" && (
                    <div style={{ marginTop: 20 }}>
                      <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 6 }}>
                        + Ingresos No Salariales Mensual
                      </label>
                      <div style={{ position: "relative", marginBottom: 6 }}>
                        <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: "var(--text-muted)", fontSize: "1rem" }}>$</span>
                        <input
                          type="text"
                          id="ingresos-no-salariales"
                          value={ingresosNoSalarialesCop > 0 ? ingresosNoSalarialesCop.toLocaleString("es-CO") : ""}
                          onChange={(e) => setIngresosNoSalarialesRaw(e.target.value.replace(/[^0-9]/g, ""))}
                          className="tax-input"
                          style={{ paddingLeft: 34, fontSize: "1rem" }}
                          placeholder="0"
                        />
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                        Pagos que no constituyen salario (bonificaciones, auxilios habituales u ocasionales) sujetos a la regla del 40% (Ley 1393 de 2010).
                      </div>
                    </div>
                  )}

                  {tipoVinculacion === "independientes" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div>
                        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 6 }}>
                          Actividad Económica (Costos Presuntos)
                        </label>
                        <select
                          id="actividad-select"
                          value={actividad}
                          onChange={(e) => setActividad(e.target.value as ActividadIndependiente)}
                          style={{
                            width: "100%", padding: "10px 14px", borderRadius: 8,
                            background: "var(--bg-primary)", color: "var(--text-primary)",
                            border: "1.5px solid var(--border-color)",
                            fontSize: "0.85rem"
                          }}
                        >
                          {Object.keys(PRESUNCION_COSTOS_UGPP).map((act) => (
                            <option key={act} value={act}>{act}</option>
                          ))}
                        </select>
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
                              id="costos-reales"
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
                            <input type="radio" id="aplica-383" name="metodo-ret" checked={aplicaTabla383} onChange={() => setAplicaTabla383(true)} />
                            Tabla Art. 383
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: "var(--text-primary)", cursor: "pointer" }}>
                            <input type="radio" id="tarifa-plana" name="metodo-ret" checked={!aplicaTabla383} onChange={() => setAplicaTabla383(false)} />
                            Tarifa Plana (11%)
                          </label>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.5, background: "rgba(255,255,255,0.03)", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border-color)" }}>
                          {aplicaTabla383 ? (
                            <><strong>Tabla Art. 383:</strong> Opción progresiva. Úsala si certificas que no contrataste a 2 o más personas por 90 días (Parágrafo 2, Art. 383 E.T.).</>
                          ) : (
                            <><strong>Tarifa Plana (11%):</strong> Tarifa fija estándar para honorarios y servicios cuando no se cumplen los requisitos para aplicar la tabla progresiva.</>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Stepper dependientes ── */}
                  <div style={{ marginTop: 20, paddingTop: 16,
                    borderTop: "1px solid var(--border-color)" }}>
                    <DependientesInput
                      value={numDependientes}
                      onChange={setNumDependientes}
                    />
                  </div>

                  {/* ── Aportes Voluntarios ── */}
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border-color)" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 6 }}>
                      Aportes Voluntarios (AFC / Pensiones) — Mensual
                    </label>
                    <div style={{ position: "relative", marginBottom: 6 }}>
                      <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: "var(--text-muted)", fontSize: "1rem" }}>$</span>
                      <input
                        type="text"
                        id="aportes-voluntarios"
                        value={aportesVoluntariosCop > 0 ? aportesVoluntariosCop.toLocaleString("es-CO") : ""}
                        onChange={(e) => setAportesVoluntariosRaw(e.target.value.replace(/[^0-9]/g, ""))}
                        className="tax-input"
                        style={{ paddingLeft: 34, fontSize: "1rem" }}
                        placeholder="0"
                      />
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                      Invierte en cuentas AFC o Fondos de Pensión Voluntaria (Art. 126-4 E.T.) para reducir tu base gravable.
                    </div>
                  </div>

                  {/* ── Deducciones Anuales Adicionales (Colapsable) ── */}
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border-color)" }}>
                    <details style={{ width: "100%" }}>
                      <summary style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span>Deducciones Anuales Adicionales</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </summary>
                      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 16 }}>
                        {/* GMF */}
                        <div>
                          <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 6 }}>
                            GMF (4x1000) — Anual
                          </label>
                          <div style={{ position: "relative", marginBottom: 6 }}>
                            <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: "var(--text-muted)", fontSize: "1rem" }}>$</span>
                            <input
                              type="text"
                              id="deduccion-gmf"
                              value={deduccionGMFAnualCop > 0 ? deduccionGMFAnualCop.toLocaleString("es-CO") : ""}
                              onChange={(e) => setDeduccionGMFAnualRaw(e.target.value.replace(/[^0-9]/g, ""))}
                              className="tax-input"
                              style={{ paddingLeft: 34, fontSize: "1rem" }}
                              placeholder="0"
                            />
                          </div>
                          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                            Deducción del 50% del Gravamen a los Movimientos Financieros pagado en el año.
                          </div>
                        </div>

                        {/* Factura Electrónica */}
                        <div>
                          <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 6 }}>
                            Compras con Factura Electrónica — Anual
                          </label>
                          <div style={{ position: "relative", marginBottom: 6 }}>
                            <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: "var(--text-muted)", fontSize: "1rem" }}>$</span>
                            <input
                              type="text"
                              id="deduccion-factura"
                              value={deduccionFacturaAnualCop > 0 ? deduccionFacturaAnualCop.toLocaleString("es-CO") : ""}
                              onChange={(e) => setDeduccionFacturaAnualRaw(e.target.value.replace(/[^0-9]/g, ""))}
                              className="tax-input"
                              style={{ paddingLeft: 34, fontSize: "1rem" }}
                              placeholder="0"
                            />
                          </div>
                          <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                            Deducción del 1% de compras soportadas con factura electrónica (Art. 336 E.T.). Tope: 240 UVT/año.
                          </div>
                        </div>
                      </div>
                    </details>
                  </div>

                  {/* ── Medicina Prepagada ── */}
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border-color)" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 6 }}>
                      Medicina Prepagada / Seguros de Salud — Mensual
                    </label>
                    <div style={{ position: "relative", marginBottom: 6 }}>
                      <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: "var(--text-muted)", fontSize: "1rem" }}>$</span>
                      <input
                        type="text"
                        id="medicina-prepagada"
                        value={medicinaPrepagadaCop > 0 ? medicinaPrepagadaCop.toLocaleString("es-CO") : ""}
                        onChange={(e) => setMedicinaPrepagadaRaw(e.target.value.replace(/[^0-9]/g, ""))}
                        className="tax-input"
                        style={{ paddingLeft: 34, fontSize: "1rem" }}
                        placeholder="0"
                      />
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                      Deducción por pagos a medicina prepagada o seguros de salud (Art. 387 E.T.). Tope: 16 UVT/mes.
                    </div>
                  </div>

                  {/* ── Intereses de Vivienda ── */}
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border-color)" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 6 }}>
                      Intereses de Vivienda / Leasing — Mensual
                    </label>
                    <div style={{ position: "relative", marginBottom: 6 }}>
                      <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: "var(--text-muted)", fontSize: "1rem" }}>$</span>
                      <input
                        type="text"
                        id="intereses-vivienda"
                        value={interesesViviendaCop > 0 ? interesesViviendaCop.toLocaleString("es-CO") : ""}
                        onChange={(e) => setInteresesViviendaRaw(e.target.value.replace(/[^0-9]/g, ""))}
                        className="tax-input"
                        style={{ paddingLeft: 34, fontSize: "1rem" }}
                        placeholder="0"
                      />
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                      Deducción por intereses de vivienda o costo financiero del leasing habitacional (Art. 387 E.T.). Tope: 100 UVT/mes.
                    </div>
                  </div>
                </div>

                {/* Right: Indicadores rápidos */}
                <div style={{ minWidth: 220, padding: "14px 16px", borderRadius: 12, background: "var(--bg-primary)", border: "1px solid var(--border-color)" }}>
                  <div className="label" style={{ marginBottom: 10 }}>Indicadores Rápidos</div>
                  {[
                    {
                      label: "Aux. Transporte",
                      value: resultado.calificaAuxilio ? `+${formatCOP(resultado.auxilioTransporteMensual)}/mes` : "No aplica",
                      color: resultado.calificaAuxilio ? "var(--accent-amber)" : "var(--text-muted)",
                    },
                    {
                      label: "Tramo Marginal",
                      value: `${(resultado.tramoMarginal * 100).toFixed(0)}%`,
                      color: resultado.tramoMarginal === 0 ? "var(--accent-emerald)"
                        : resultado.tramoMarginal >= 0.33 ? "var(--accent-rose)"
                        : "var(--accent-amber)",
                    },
                    {
                      label: "Base (UVT/año)",
                      value: `${resultado.baseGravableAnualUVT.toFixed(2)} UVT`,
                      color: "#06b6d4",
                    },
                    {
                      label: "Tope Exenta 25%",
                      value: resultado.topeRentaExentaActivo ? "⚠️ Activo" : "No aplica",
                      color: resultado.topeRentaExentaActivo ? "var(--accent-amber)" : "var(--text-muted)",
                    },
                    {
                      label: "Tope 40%",
                      value: resultado.topeTecho40Activo ? "⚠️ Activo" : "No aplica",
                      color: resultado.topeTecho40Activo ? "var(--accent-amber)" : "var(--text-muted)",
                    },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border-color)", fontSize: "0.76rem" }}>
                      <span style={{ color: "var(--text-muted)" }}>{label}</span>
                      <span style={{ color, fontWeight: 700, fontFamily: "JetBrains Mono, monospace", fontSize: "0.72rem" }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ══ BANNER: OBLIGACIÓN DE DECLARAR ═══════════════════ */}
            {salarioBase > 0 && (
              <div
                className="animate-fade-up"
                style={{
                  animationDelay: "0.06s",
                  margin: "20px 0 8px",
                  padding: "16px 20px",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  background: obligadoDeclarar
                    ? "rgba(6,182,212,0.07)"
                    : "rgba(52,211,153,0.07)",
                  border: `1.5px solid ${obligadoDeclarar
                    ? "rgba(6,182,212,0.22)"
                    : "rgba(52,211,153,0.22)"}`,
                }}
              >
                <div style={{ fontSize: "1.4rem", lineHeight: 1 }}>
                  {obligadoDeclarar ? "📋" : "✅"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    color: obligadoDeclarar ? "var(--accent-cyan)" : "var(--accent-emerald)",
                    marginBottom: 4,
                  }}>
                    {obligadoDeclarar
                      ? `Estás obligado a presentar declaración de renta ${anio}`
                      : `No estás obligado a presentar declaración de renta por ingresos (${anio})`}
                  </div>
                  <div style={{ fontSize: "0.77rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    {obligadoDeclarar ? (
                      <>
                        Tu ingreso bruto anual de{" "}
                        <strong style={{ color: "var(--text-primary)", fontFamily: "JetBrains Mono, monospace" }}>
                          {formatCOP(resultado.ingresoBrutoAnual)}
                        </strong>{" "}
                        supera el umbral de{" "}
                        <strong>1.400 UVT = {formatCOP(UMBRAL_DECLARAR_COP)}</strong>{" "}
                        (≈ {formatCOP(UMBRAL_MENSUAL_COP)}/mes · Art. 592 E.T.). Debes presentar declaración de renta anual.
                      </>
                    ) : (
                      <>
                        Tus ingresos anuales de{" "}
                        <strong style={{ color: "var(--text-primary)", fontFamily: "JetBrains Mono, monospace" }}>
                          {formatCOP(resultado.ingresoBrutoAnual)}
                        </strong>{" "}
                        son menores a{" "}
                        <strong>1.400 UVT = {formatCOP(UMBRAL_DECLARAR_COP)}</strong>{" "}
                        (≈ {formatCOP(UMBRAL_MENSUAL_COP)}/mes · Art. 592 E.T.). No estás en la obligación de declarar.
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ══ SECCIÓN SUPERIOR: PROYECCIÓN ANUAL ═════════════════ */}
            <div className="label" style={{ color: "#06b6d4", margin: "32px 0 12px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 3, height: 16, borderRadius: 2, background: "#06b6d4" }} />
              Sección A — Proyección Anual {anio}
            </div>
            <div className="results-grid-annual animate-fade-up" style={{ animationDelay: "0.08s" }}>
              <SeccionProyeccionAnual resultado={resultado} aplicaTabla383={aplicaTabla383} />
            </div>

            {/* ══ DIVISOR + SECCIÓN MENSUAL ═ */}
            <SectionDivider
              topLabel={`Resumen Fiscal ${anio}`}
              bottomLabel="Impacto Mensual"
              topColor="#06b6d4"
              bottomColor="#34d399"
            />

            <div className="label" style={{ color: "var(--accent-emerald)", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 3, height: 16, borderRadius: 2, background: "var(--accent-emerald)" }} />
              Sección B — Desglose Mensual (Anual ÷ 12)
            </div>
            <div className="results-grid-monthly animate-fade-up" style={{ animationDelay: "0.12s" }}>
              <SeccionResumenLey resultado={resultado} aplicaTabla383={aplicaTabla383} />
              <SeccionDiagnosticoAhorro resultado={resultado} ahorroPorAportesVoluntarios={ahorroPorAportesVoluntarios} />
            </div>
          </>
        )}

        {/* ══ FOOTER NOTE ═════════════════════════════════════════ */}
        <div style={{ marginTop: 40, textAlign: "center" }}>
          <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.7 }}>
            Calculadora con fines educativos · Vigencia fiscal {anio} ·
            UVT: ${C.UVT.toLocaleString("es-CO")} · SMMLV: ${C.SMMLV.toLocaleString("es-CO")} · Aux. Transporte: ${C.AUX_TRANSPORTE.toLocaleString("es-CO")}
            <br />
            Basada en Arts. 241, 336, 383, 387 E.T.
          </p>
        </div>
      </main>

      {/* ══ REFERENCIAS LEGALES ════════════════════════════════════ */}
      <SeccionReferenciasLegales anio={anio} />
        </>
      ) : (
        <div className="animate-fade-up">
          <CompareBrokers />
        </div>
      )}
    </div>
  );
}
