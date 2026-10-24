"use client";
import { useState, useCallback, type ReactNode } from "react";
import { DependientesInput } from "@/components/DependientesInput";
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

// ── Tipo de Vinculación ──────────────────────────────────────────
type TipoVinculacion = "asalariados" | "independientes" | "cedular" | "magico-asalariados" | "magico-independientes" | "simple-independientes";

// Íconos de línea (estilo Feather) para las categorías
const ICONOS: Record<string, ReactNode> = {
  asalariados: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
    </svg>
  ),
  independientes: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  cedular: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
};

// Tres categorías principales; cada una agrupa sus modos de cálculo
type Categoria = "asalariados" | "independientes" | "cedular";

const CATEGORIAS: { id: Categoria; label: string; modos: { id: TipoVinculacion; label: string }[] }[] = [
  {
    id: "asalariados",
    label: "Asalariados",
    modos: [
      { id: "asalariados", label: "Retención mensual" },
      { id: "magico-asalariados", label: "Salario mágico" },
    ],
  },
  {
    id: "independientes",
    label: "Independientes",
    modos: [
      { id: "independientes", label: "Retención mensual" },
      { id: "simple-independientes", label: "Régimen Simple" },
      { id: "magico-independientes", label: "Salario mágico" },
    ],
  },
  {
    id: "cedular",
    label: "Declaración anual",
    modos: [{ id: "cedular", label: "Declaración anual" }],
  },
];

const NOTA_POR_TIPO: Record<TipoVinculacion, string> = {
  "asalariados": "Para personas con contrato laboral vigente en Colombia (rentas de trabajo, Art. 383 E.T.).",
  "magico-asalariados": "Encuentra el salario bruto que necesitas para recibir un neto mensual objetivo.",
  "independientes": "Para contratistas y prestadores de servicios con honorarios o cuentas de cobro.",
  "simple-independientes": "Compara el Régimen Simple de Tributación (Art. 903 E.T.) con el régimen ordinario.",
  "magico-independientes": "Encuentra cuánto facturar para recibir un neto mensual objetivo como independiente.",
  "cedular": "Simula tu declaración de renta anual por cédulas (Art. 330 y ss. E.T.).",
};

function categoriaDe(tipo: TipoVinculacion): Categoria {
  return CATEGORIAS.find((c) => c.modos.some((m) => m.id === tipo))!.id;
}

// ── Componente: Selector de categoría y modo ─────────────────────
function VinculacionSelector({
  tipo,
  onChange,
}: {
  tipo: TipoVinculacion;
  onChange: (t: TipoVinculacion) => void;
}) {
  const categoria = categoriaDe(tipo);
  const modos = CATEGORIAS.find((c) => c.id === categoria)!.modos;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div role="tablist" aria-label="Tipo de cálculo" className="segmented">
        {CATEGORIAS.map(({ id, label, modos }) => (
          <button
            key={id}
            role="tab"
            aria-selected={id === categoria}
            className="segmented-btn"
            onClick={() => id !== categoria && onChange(modos[0].id)}
          >
            {ICONOS[id]}
            {label}
          </button>
        ))}
      </div>
      {modos.length > 1 && (
        <div role="tablist" aria-label="Modo de cálculo" className="segmented segmented-sm">
          {modos.map(({ id, label }) => (
            <button
              key={id}
              role="tab"
              aria-selected={id === tipo}
              className="segmented-btn"
              onClick={() => onChange(id)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}



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
    <div className="segmented" role="group" aria-label="Año gravable">
      {ANIOS.map((a) => (
        <button
          key={a}
          onClick={() => onChange(a)}
          aria-pressed={a === anio}
          className="segmented-btn year-btn"
        >
          {a}
        </button>
      ))}
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

// ── Bloque plegable para el cálculo detallado ────────────────────
function DetalleCalculo({ titulo, subtitulo, children }: { titulo: string; subtitulo: string; children: ReactNode }) {
  return (
    <details className="detail-block">
      <summary>
        <div>
          {titulo}
          <small>{subtitulo}</small>
        </div>
        <svg className="chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </summary>
      <div className="detail-body">{children}</div>
    </details>
  );
}

// ── Pie de página ────────────────────────────────────────────────
function SiteFooter({ anio }: { anio: AnioGravable }) {
  const C = CONSTANTES_POR_ANIO[anio];
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <h4>Aviso legal</h4>
          <p>
            Simulador con fines educativos. Los resultados son estimaciones y no reemplazan la asesoría de un
            contador público ni la normativa oficial de la DIAN. Verifica tu caso antes de tomar decisiones tributarias.
          </p>
        </div>
        <div>
          <h4>Fuentes normativas</h4>
          <p>
            Estatuto Tributario (Decreto 624 de 1989), Arts. 206, 241, 336, 383, 387 y 592; Ley 2277 de 2022;
            Ley 1393 de 2010.{" "}
            <a href="https://normograma.dian.gov.co/dian/compilacion/docs/estatuto_tributario.htm" target="_blank" rel="noreferrer">
              Estatuto Tributario en la DIAN
            </a>
          </p>
        </div>
        <div>
          <h4>Valores de referencia {anio}</h4>
          <p>
            UVT: {formatCOP(C.UVT)}
            <br />
            SMMLV: {formatCOP(C.SMMLV)}
            <br />
            Auxilio de transporte: {formatCOP(C.AUX_TRANSPORTE)}
          </p>
        </div>
      </div>
      <div className="site-footer-bottom">
        Vigencia fiscal {anio} · Valores actualizados a octubre de 2026
      </div>
    </footer>
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
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)", paddingBottom: 40 }}>

      {/* ══ HEADER ══════════════════════════════════════════════════ */}
      <header className="site-header">
        <div className="site-header-inner">
          <div className="brand">
            <div className="brand-logo" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="brand-title">Calculadora Tributaria</div>
              <div className="brand-subtitle">Colombia · Estatuto Tributario · {anio}</div>
            </div>
          </div>
          <div className="header-actions">
            {activeTab === "taxes" && <YearSelector anio={anio} onChange={handleAnioChange} />}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── TABS DE NAVEGACIÓN ── */}
      <div style={{ display: "flex", justifyContent: "center", padding: "28px 16px 0" }}>
        <div role="tablist" aria-label="Herramienta" className="segmented">
          <button role="tab" aria-selected={activeTab === "taxes"} className="segmented-btn" onClick={() => setActiveTab("taxes")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <line x1="8" y1="6" x2="16" y2="6" />
              <line x1="8" y1="11" x2="8" y2="11.01" /><line x1="12" y1="11" x2="12" y2="11.01" /><line x1="16" y1="11" x2="16" y2="11.01" />
              <line x1="8" y1="15" x2="8" y2="15.01" /><line x1="12" y1="15" x2="12" y2="15.01" /><line x1="16" y1="15" x2="16" y2="15.01" />
            </svg>
            Calculadora de impuestos
          </button>
          <button role="tab" aria-selected={activeTab === "invest"} className="segmented-btn" onClick={() => setActiveTab("invest")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            Comparador de brokers
          </button>
        </div>
      </div>

      {activeTab === 'taxes' ? (
        <>
          {/* ══ HERO ═══════════════════════════════════════════════════ */}
          <div style={{ padding: "36px 16px 0", textAlign: "center" }}>
            <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.3rem)", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2, marginBottom: 12, letterSpacing: "-0.02em" }}>
              Calculadora de Retención en la Fuente{" "}
              <span style={{ color: "var(--accent-emerald)" }}>{anio}</span>
            </h1>
            <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", maxWidth: 560, margin: "0 auto", lineHeight: 1.65 }}>
              Calcula tu impuesto en base anual (norma DIAN) y mira el impacto real en tu pago
              mensual, incluyendo AFC y pensiones voluntarias.
            </p>

            {/* ── Categoría y modo de cálculo ── */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 28 }}>
              <VinculacionSelector tipo={tipoVinculacion} onChange={setTipoVinculacion} />
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0, maxWidth: 520 }}>
                {NOTA_POR_TIPO[tipoVinculacion]}
              </p>
            </div>
          </div>

      {/* ══ MAIN CONTENT ═══════════════════════════════════════════ */}
      <main style={{ maxWidth: 1180, margin: "32px auto 0", padding: "0 16px" }}>

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
            {/* ── Formulario + resumen fijo ──────────────────────────── */}
            <div className="calc-layout">
              <div className="card animate-fade-up">

                <div key={tipoVinculacion} className="animate-fade-up">
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <span className="section-badge badge-emerald">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      {tipoVinculacion === "asalariados" ? `Salario base mensual · ${anio}` : `Ingresos brutos mensuales · ${anio}`}
                    </span>
                  </div>
                  <div style={{ position: "relative", marginBottom: 16 }}>
                    <span style={{
                      position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
                      fontFamily: "var(--font-jetbrains), monospace", fontWeight: 700,
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
                          aria-pressed={salarioBase === value}
                          className="chip"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}

                  {tipoVinculacion === "asalariados" && (
                    <div style={{ marginTop: 20 }}>
                      <label className="field-label">
                        + Ingresos No Salariales Mensual
                      </label>
                      <div style={{ position: "relative", marginBottom: 6 }}>
                        <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-jetbrains), monospace", fontWeight: 700, color: "var(--text-muted)", fontSize: "1rem" }}>$</span>
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
                      <div className="field-hint">
                        Pagos que no constituyen salario (bonificaciones, auxilios habituales u ocasionales) sujetos a la regla del 40% (Ley 1393 de 2010).
                      </div>
                    </div>
                  )}

                  {tipoVinculacion === "independientes" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <div>
                        <label className="field-label">
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
                          <label className="field-label">
                            Costos Reales Mensuales
                          </label>
                          <div style={{ position: "relative" }}>
                            <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-jetbrains), monospace", fontWeight: 700, color: "var(--text-muted)", fontSize: "1rem" }}>$</span>
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
                        <label className="field-label">
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
                  <div className="field-section">
                    <DependientesInput
                      value={numDependientes}
                      onChange={setNumDependientes}
                    />
                  </div>

                  {/* ── Aportes Voluntarios ── */}
                  <div className="field-section">
                    <label className="field-label">
                      Aportes Voluntarios (AFC / Pensiones) — Mensual
                    </label>
                    <div style={{ position: "relative", marginBottom: 6 }}>
                      <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-jetbrains), monospace", fontWeight: 700, color: "var(--text-muted)", fontSize: "1rem" }}>$</span>
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
                    <div className="field-hint">
                      Invierte en cuentas AFC o Fondos de Pensión Voluntaria (Art. 126-4 E.T.) para reducir tu base gravable.
                    </div>
                  </div>

                  {/* ── Deducciones Anuales Adicionales (Colapsable) ── */}
                  <div className="field-section">
                    <details style={{ width: "100%" }}>
                      <summary className="field-label" style={{ cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 0 }}>
                        <span>Deducciones anuales adicionales (GMF y factura electrónica)</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </summary>
                      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 16 }}>
                        {/* GMF */}
                        <div>
                          <label className="field-label">
                            GMF (4x1000) — Anual
                          </label>
                          <div style={{ position: "relative", marginBottom: 6 }}>
                            <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-jetbrains), monospace", fontWeight: 700, color: "var(--text-muted)", fontSize: "1rem" }}>$</span>
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
                          <div className="field-hint">
                            Deducción del 50% del Gravamen a los Movimientos Financieros pagado en el año.
                          </div>
                        </div>

                        {/* Factura Electrónica */}
                        <div>
                          <label className="field-label">
                            Compras con Factura Electrónica — Anual
                          </label>
                          <div style={{ position: "relative", marginBottom: 6 }}>
                            <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-jetbrains), monospace", fontWeight: 700, color: "var(--text-muted)", fontSize: "1rem" }}>$</span>
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
                          <div className="field-hint">
                            Deducción del 1% de compras soportadas con factura electrónica (Art. 336 E.T.). Tope: 240 UVT/año.
                          </div>
                        </div>
                      </div>
                    </details>
                  </div>

                  {/* ── Medicina Prepagada ── */}
                  <div className="field-section">
                    <label className="field-label">
                      Medicina Prepagada / Seguros de Salud — Mensual
                    </label>
                    <div style={{ position: "relative", marginBottom: 6 }}>
                      <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-jetbrains), monospace", fontWeight: 700, color: "var(--text-muted)", fontSize: "1rem" }}>$</span>
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
                    <div className="field-hint">
                      Deducción por pagos a medicina prepagada o seguros de salud (Art. 387 E.T.). Tope: 16 UVT/mes.
                    </div>
                  </div>

                  {/* ── Intereses de Vivienda ── */}
                  <div className="field-section">
                    <label className="field-label">
                      Intereses de Vivienda / Leasing — Mensual
                    </label>
                    <div style={{ position: "relative", marginBottom: 6 }}>
                      <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-jetbrains), monospace", fontWeight: 700, color: "var(--text-muted)", fontSize: "1rem" }}>$</span>
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
                    <div className="field-hint">
                      Deducción por intereses de vivienda o costo financiero del leasing habitacional (Art. 387 E.T.). Tope: 100 UVT/mes.
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Resumen fijo de resultados ─────────────────────────── */}
              <aside className="summary-panel animate-fade-up" aria-live="polite">
                <div className="label">Tu resultado · {anio}</div>

                <div className="summary-hero">
                  <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                    Retención mensual estimada
                  </div>
                  <div className="big-number">{formatCOP(resultado.impuestoMes)}</div>
                </div>

                <div>
                  <div className="summary-row">
                    <span>Impuesto anual estimado</span>
                    <span>{formatCOP(resultado.impuestoAnual)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Tarifa efectiva</span>
                    <span>
                      {resultado.ingresoBrutoAnual > 0
                        ? `${((resultado.impuestoAnual / resultado.ingresoBrutoAnual) * 100).toFixed(2)}%`
                        : "0%"}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>Tarifa marginal</span>
                    <span>{(resultado.tramoMarginal * 100).toFixed(0)}%</span>
                  </div>
                  <div className="summary-row">
                    <span>Base gravable anual</span>
                    <span>{resultado.baseGravableAnualUVT.toFixed(2)} UVT</span>
                  </div>
                  {tipoVinculacion === "asalariados" && (
                    <div className="summary-row">
                      <span>Auxilio de transporte</span>
                      <span>{resultado.calificaAuxilio ? `+${formatCOP(resultado.auxilioTransporteMensual)}/mes` : "No aplica"}</span>
                    </div>
                  )}
                  {ahorroPorAportesVoluntarios > 0 && (
                    <div className="summary-row">
                      <span>Ahorro por AFC / pensión voluntaria</span>
                      <span style={{ color: "var(--accent-emerald)" }}>{formatCOP(ahorroPorAportesVoluntarios)}/año</span>
                    </div>
                  )}
                </div>

                {(resultado.topeRentaExentaActivo || resultado.topeTecho40Activo) && (
                  <div className="status-pill status-warn">
                    <div>
                      <strong>Topes legales alcanzados</strong>
                      {resultado.topeRentaExentaActivo && "La renta exenta del 25% llegó a su tope (Art. 206 num. 10). "}
                      {resultado.topeTecho40Activo && "Tus deducciones llegaron al límite del 40% / 1.340 UVT (Art. 336)."}
                    </div>
                  </div>
                )}

                {salarioBase > 0 && (
                  <div className={`status-pill ${obligadoDeclarar ? "status-warn" : "status-ok"}`}>
                    <div>
                      <strong>
                        {obligadoDeclarar ? `Debes declarar renta por el año ${anio}` : `No estás obligado a declarar por ingresos (${anio})`}
                      </strong>
                      Ingreso bruto anual de {formatCOP(resultado.ingresoBrutoAnual)} frente al umbral de 1.400 UVT
                      ({formatCOP(UMBRAL_DECLARAR_COP)}, ≈ {formatCOP(UMBRAL_MENSUAL_COP)}/mes · Art. 592 E.T.).
                    </div>
                  </div>
                )}
              </aside>
            </div>

            {/* ══ DIAGNÓSTICO DE AHORRO (visible) ═══════════════════ */}
            <div className="animate-fade-up" style={{ marginTop: 24 }}>
              <SeccionDiagnosticoAhorro resultado={resultado} ahorroPorAportesVoluntarios={ahorroPorAportesVoluntarios} />
            </div>

            {/* ══ CÁLCULO DETALLADO (plegable) ══════════════════════ */}
            <DetalleCalculo
              titulo={`Ver cálculo anual paso a paso (${anio})`}
              subtitulo="Ingresos, aportes, renta exenta, límite del 40% y tabla del Art. 241 E.T."
            >
              <SeccionProyeccionAnual resultado={resultado} aplicaTabla383={aplicaTabla383} />
            </DetalleCalculo>
            <DetalleCalculo
              titulo="Ver retención mensual paso a paso"
              subtitulo="Cálculo anual dividido entre 12 y tabla del Art. 383 E.T."
            >
              <SeccionResumenLey resultado={resultado} aplicaTabla383={aplicaTabla383} />
            </DetalleCalculo>
          </>
        )}
      </main>

      {/* ══ REFERENCIAS LEGALES ════════════════════════════════════ */}
      <SeccionReferenciasLegales anio={anio} />
        </>
      ) : (
        <div className="animate-fade-up" style={{ padding: "28px 16px 0" }}>
          <CompareBrokers />
        </div>
      )}

      <SiteFooter anio={anio} />
    </div>
  );
}
