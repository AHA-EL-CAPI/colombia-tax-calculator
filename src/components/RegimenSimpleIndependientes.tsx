"use client";

import { useMemo, useState } from "react";
import { 
  formatCOP, 
  TARIFAS_RST, 
  PRESUNCION_COSTOS_UGPP,
  calcularRetencionIndependiente,
  calcularRST,
  type AnioGravable,
  type ActividadIndependiente
} from "@/lib/tax-calculator";

interface RegimenSimpleIndependientesProps {
  anio: AnioGravable;
  uvt: number;
  smmlv: number;
}

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

export function RegimenSimpleIndependientes({ anio, uvt, smmlv }: RegimenSimpleIndependientesProps) {
  const [ingresoMensual, setIngresoMensual] = useState<number>(5000000);
  const [actividadUGPP, setActividadUGPP] = useState<ActividadIndependiente>("M. Actividades profesionales, científicas y técnicas");
  const [porcentajeElectronico, setPorcentajeElectronico] = useState<number>(100);
  const [pensionPatronalMensual, setPensionPatronalMensual] = useState<number>(0);

  const ingresoAnual = ingresoMensual * 12;
  const porcentajeUGPP = PRESUNCION_COSTOS_UGPP[actividadUGPP] || 0.6288;
  const costosPresuntos = ingresoAnual * porcentajeUGPP;
  const ingresoNetoUgpp = ingresoAnual - costosPresuntos;
  const ibcAnual = Math.max(ingresoNetoUgpp * 0.40, smmlv * 12);
  const salud = ibcAnual * 0.125;
  // Art. 904: la base del SIMPLE son los ingresos brutos; los aportes propios a seguridad social no la reducen
  const baseGravableRST = ingresoAnual;

  const grupoRST = MAPEO_UGPP_A_RST[actividadUGPP] || "2";
  const confRST = TARIFAS_RST[grupoRST];
  const esExpendioComidas = actividadUGPP === "I. Alojamiento y servicios de comida";

  const rst = calcularRST(ingresoAnual, grupoRST, uvt, smmlv, {
    aportesPensionPatronalesAnual: pensionPatronalMensual * 12,
    ingresosElectronicosAnual: ingresoAnual * (Math.min(100, Math.max(0, porcentajeElectronico)) / 100),
    esExpendioComidas,
  });
  const tarifaRST = rst?.tarifa ?? 0;
  const impuestoBrutoRST = rst?.impuestoBruto ?? 0;
  const descuentoPension = rst?.descuentoPension ?? 0;
  const descuentoElectronico = rst?.descuentoElectronico ?? 0;
  const impuestoConsumo = rst?.impuestoConsumo ?? 0;
  const impuestoNeto = rst?.impuestoNeto ?? 0;

  const resultadoOrdinario = useMemo(() => {
    return calcularRetencionIndependiente(
      ingresoMensual,
      actividadUGPP,
      true, // aplicaTabla383
      0, // tarifaRetencionPlana
      anio,
      0, // numDependientes
      0, // costosRealesCop
      0, // afc
      0, // medicinaPrepagada
      0, // interesesVivienda
      0, // gmf
      0 // comprasFactura
    );
  }, [ingresoMensual, actividadUGPP, anio]);

  const impuestoOrdinarioAnual = resultadoOrdinario.impuestoAnual;
  const icaEstimadoOrdinario = ingresoAnual * 0.00966;
  const impuestoOrdinarioTotal = impuestoOrdinarioAnual + icaEstimadoOrdinario;

  const ahorro = impuestoOrdinarioTotal - impuestoNeto;
  const esMejorSimple = ahorro > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      
      {/* ── BLOQUE A: Inputs de Entrada ────────────────────────────── */}
      <div style={{ 
        background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 16, padding: 20
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", display: "block", marginBottom: 8 }}>
              Ingreso Bruto Mensual
            </label>
            <input 
              type="number"
              value={ingresoMensual}
              onChange={(e) => setIngresoMensual(Number(e.target.value))}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                background: "var(--bg-input)",
                color: "var(--text-primary)",
                fontSize: "0.9rem"
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", display: "block", marginBottom: 8 }}>
              Actividad Económica (Costos Presuntos UGPP)
            </label>
            <select 
              value={actividadUGPP}
              onChange={(e) => setActividadUGPP(e.target.value as ActividadIndependiente)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                background: "var(--bg-input, #1e293b)",
                color: "var(--text-primary, #f8fafc)",
                fontSize: "0.9rem"
              }}
            >
              {Object.keys(PRESUNCION_COSTOS_UGPP).map((key) => (
                <option 
                  key={key} 
                  value={key}
                  style={{
                    backgroundColor: "var(--bg-card, #0f172a)", // Fondo oscuro forzado para las opciones
                    color: "var(--text-primary, #f1f5f9)"       // Texto claro forzado
                  }}
                >
                  {key}
                </option>
              ))}
            </select>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 4 }}>
              ↳ Automáticamente asignado al RST: Grupo {grupoRST} - {confRST.nombre}
            </div>
          </div>
          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", display: "block", marginBottom: 8 }}>
              % de ingresos recibidos por tarjetas o medios electrónicos
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={porcentajeElectronico}
              onChange={(e) => setPorcentajeElectronico(Number(e.target.value))}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-primary)", fontSize: "0.9rem" }}
            />
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 4 }}>
              ↳ Da derecho al descuento del 0,5% (Art. 912 E.T.), con certificado de la entidad financiera.
            </div>
          </div>
          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", display: "block", marginBottom: 8 }}>
              Aportes a pensión de tus empleados a tu cargo (mensual)
            </label>
            <input
              type="number"
              min={0}
              value={pensionPatronalMensual}
              onChange={(e) => setPensionPatronalMensual(Number(e.target.value))}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-input)", color: "var(--text-primary)", fontSize: "0.9rem" }}
            />
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 4 }}>
              ↳ Solo el aporte patronal (12%) por trabajadores con contrato laboral es descontable (Art. 903 par. 4). Tu propia cotización no lo es.
            </div>
          </div>
        </div>
      </div>

      {/* ── BLOQUE B: Proyección Top-Down RST ──────────────────────── */}
      <div style={{ 
        background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 16, overflow: "hidden" 
      }}>
        <div style={{ background: "linear-gradient(135deg, rgba(147,51,234,0.1), rgba(126,34,206,0.05))", padding: 24, textAlign: "center", borderBottom: "1px solid rgba(147,51,234,0.3)" }}>
          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
            Impuesto Total a Pagar (RST)
          </div>
          <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--accent-purple)", fontFamily: "var(--font-jetbrains), monospace", marginBottom: 8 }}>
            {formatCOP(impuestoNeto)} <span style={{ fontSize: "1rem" }}>/año</span>
          </div>
          <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            Impuesto consolidado (Incluye ICA).
          </div>
        </div>
        
        <div style={{ padding: "20px" }}>
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>
            Demostración Top-Down
          </div>
          
          {/* Paso 1 */}
          <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 1: Ingreso Bruto Anual</div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "4px 0" }}>Honorarios totales facturados en el año.</p>
            <strong style={{ fontSize: "1rem", fontFamily: "var(--font-jetbrains), monospace", color: "var(--text-primary)" }}>{formatCOP(ingresoAnual)}</strong>
          </div>

          {/* Paso 2 */}
          <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 2: Seguridad Social (informativo)</div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "4px 0" }}>Tus aportes a salud y pensión se pagan aparte sobre el IBC (ingreso neto depurado por costos UGPP). No reducen la base del RST, que son los ingresos brutos (Art. 904 E.T.).</p>
            {/* Caja de desglose del IBC */}
            <div style={{
              margin: "8px 0 12px 16px",
              padding: "8px 12px",
              borderLeft: "2px solid var(--border-color, #334155)",
              backgroundColor: "var(--bg-elevated, rgba(255,255,255,0.02))",
              fontSize: "0.85rem",
              display: "flex",
              flexDirection: "column",
              gap: "4px"
            }}>
              <span style={{ color: "var(--text-secondary)" }}>Ingresos Brutos: {formatCOP(ingresoAnual)}</span>
              <span style={{ color: "var(--text-secondary)" }}>(-) Costos Presuntos ({(porcentajeUGPP * 100).toFixed(0)}%): {formatCOP(costosPresuntos)}</span>
              <span style={{ color: "var(--text-secondary)" }}>(=) Ingreso Neto: {formatCOP(ingresoNetoUgpp)}</span>
              <span style={{ color: "var(--text-secondary)" }}>(*) 40% s/ Neto: {formatCOP(ingresoNetoUgpp * 0.4)}</span>
              
              {ibcAnual === (smmlv * 12) ? (
                <span style={{ color: "var(--accent-yellow)", fontSize: "0.8rem" }}>
                  ⚠️ El IBC calculado es menor al mínimo legal. Se ajusta al piso de 12 SMMLV: {formatCOP(smmlv * 12)}
                </span>
              ) : (
                <span style={{ color: "var(--text-secondary)" }}>(=) IBC Aplicado: {formatCOP(ibcAnual)}</span>
              )}
            </div>

            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginLeft: 12 }}>
              ↳ Aporte a Salud (12.5%): {formatCOP(salud)}
            </div>
            <strong style={{ fontSize: "1rem", fontFamily: "var(--font-jetbrains), monospace", color: "var(--text-secondary)" }}>{formatCOP(salud)}</strong>
          </div>

          {/* Paso 3 */}
          <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 3: (=) Base Gravable RST</div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "4px 0" }}>Dinero sobre el cual se calculará la tarifa de tu grupo.</p>
            <strong style={{ fontSize: "1rem", fontFamily: "var(--font-jetbrains), monospace", color: "var(--text-primary)" }}>(=) {formatCOP(baseGravableRST)}</strong>
          </div>

          {/* Paso 4 */}
          <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 4: Impuesto Simple Bruto</div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "4px 0" }}>Tarifa de tabla según tu grupo y base ({(tarifaRST * 100).toFixed(1)}% para esta franja).</p>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginLeft: 12 }}>
              ↳ Cálculo: {formatCOP(baseGravableRST)} × {(tarifaRST * 100).toFixed(1)}%
            </div>
            <strong style={{ fontSize: "1rem", fontFamily: "var(--font-jetbrains), monospace", color: "var(--text-primary)" }}>{formatCOP(impuestoBrutoRST)}</strong>
          </div>

          {/* Paso 5 */}
          <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 5: (-) Descuento por Aportes Patronales a Pensión</div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "4px 0" }}>Solo el aporte a pensión a cargo del empleador por sus trabajadores se descuenta del impuesto (Art. 903 par. 4 E.T., Oficio DIAN 15505 de 2026). No cubre la parte del ICA.</p>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginLeft: 12 }}>
              ↳ Aportes patronales del año: {formatCOP(pensionPatronalMensual * 12)}
            </div>
            <strong style={{ fontSize: "1rem", fontFamily: "var(--font-jetbrains), monospace", color: "var(--accent-red)" }}>(-) {formatCOP(descuentoPension)}</strong>
          </div>

          {/* Paso 6 */}
          <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 6: (-) Descuento por Pagos Electrónicos</div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "4px 0" }}>0,5% de los ingresos recibidos por tarjetas u otros medios electrónicos (Art. 912 E.T.).</p>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginLeft: 12 }}>
              ↳ Cálculo: {formatCOP(ingresoAnual * Math.min(100, Math.max(0, porcentajeElectronico)) / 100)} × 0.5%
            </div>
            <strong style={{ fontSize: "1rem", fontFamily: "var(--font-jetbrains), monospace", color: "var(--accent-red)" }}>(-) {formatCOP(descuentoElectronico)}</strong>
          </div>

          {/* Paso 6.5 */}
          {esExpendioComidas && (
            <div style={{ padding: "12px 0", borderBottom: "1px solid var(--border-color)" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>Paso 6.5: (+) Impuesto Nacional al Consumo</div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "4px 0" }}>Expendio de comidas y bebidas (8%, Art. 908 par. 1 E.T.).</p>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginLeft: 12 }}>
                ↳ Cálculo: {formatCOP(ingresoAnual)} × 8%
              </div>
              <strong style={{ fontSize: "1rem", fontFamily: "var(--font-jetbrains), monospace", color: "var(--accent-red)" }}>(+) {formatCOP(impuestoConsumo)}</strong>
            </div>
          )}

          {/* Paso 7 */}
          <div style={{ padding: "12px 0", borderTop: "2px solid var(--accent-purple)", marginTop: "4px" }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--accent-purple)" }}>Paso 7: (=) Impuesto Total a Pagar (RST)</div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "4px 0" }}>Impuesto consolidado (Incluye ICA).</p>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginLeft: 12 }}>
              ↳ Ecuación: {formatCOP(impuestoBrutoRST)} - {formatCOP(descuentoPension)} - {formatCOP(descuentoElectronico)} {esExpendioComidas ? `+ ${formatCOP(impuestoConsumo)}` : ""}
            </div>
            <strong style={{ fontSize: "1.1rem", fontFamily: "var(--font-jetbrains), monospace", color: "var(--accent-purple)" }}>(=) {formatCOP(impuestoNeto)}</strong>
          </div>

        </div>
      </div>

      {/* ── BLOQUE C: El Duelo ─────────────────────────────────────── */}
      <div style={{ 
        background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 16, padding: 20
      }}>
        <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: 16, textAlign: "center" }}>
          ⚔️ EL DUELO: ORDINARIO VS. SIMPLE
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          {/* Columna Ordinario */}
          <div style={{ 
            background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 16
          }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8, textAlign: "center" }}>
              Régimen Ordinario
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-jetbrains), monospace", textAlign: "center", marginBottom: 8 }}>
              {formatCOP(impuestoOrdinarioTotal)}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Impuesto Renta:</span>
                <span>{formatCOP(impuestoOrdinarioAnual)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>ICA Estimado (0.966%):</span>
                <span>{formatCOP(icaEstimadoOrdinario)}</span>
              </div>
            </div>
          </div>

          {/* Columna Simple */}
          <div style={{ 
            background: "rgba(147,51,234,0.05)", border: "1px solid rgba(147,51,234,0.3)", borderRadius: 12, padding: 16
          }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent-purple)", marginBottom: 8, textAlign: "center" }}>
              Régimen Simple
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent-purple)", fontFamily: "var(--font-jetbrains), monospace", textAlign: "center", marginBottom: 8 }}>
              {formatCOP(impuestoNeto)}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Impuesto Unificado:</span>
                <span>{formatCOP(impuestoNeto)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>(Incluye ICA):</span>
                <span>Sí</span>
              </div>
            </div>
          </div>
        </div>

        {/* Veredicto Banner */}
        <div style={{ 
          marginTop: 20,
          padding: 16,
          borderRadius: 12,
          background: esMejorSimple ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
          border: `1px solid ${esMejorSimple ? "var(--accent-emerald)" : "var(--accent-amber)"}`,
          textAlign: "center"
        }}>
          <div style={{ fontSize: "1rem", fontWeight: 700, color: esMejorSimple ? "var(--accent-emerald)" : "var(--accent-amber)" }}>
            🏆 Veredicto: {esMejorSimple ? "El Régimen Simple es mejor" : "El Régimen Ordinario es mejor"}
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 4 }}>
            {esMejorSimple 
              ? `Te ahorras ${formatCOP(ahorro)} al año pasándote al Simple.`
              : `Te ahorras ${formatCOP(-ahorro)} al año quedándote en el Ordinario.`}
          </div>
        </div>
      </div>

      {/* ── BLOQUE D: Referencias Legales ─────────────────────────── */}
      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))", gap: 16 }}>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Art. 903 al 916 E.T.</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Creación y tarifas del Régimen Simple.</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Art. 904 E.T.</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Base gravable del RST: totalidad de los ingresos brutos.</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Art. 912 E.T.</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Descuento del 0,5% por ingresos recibidos por medios electrónicos.</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Sentencia C-540/23</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Revivió las tarifas del grupo de profesiones liberales hasta 100.000 UVT.</div>
        </div>
      </div>

    </div>
  );
}
