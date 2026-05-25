"use client";

import React, { useState, useMemo } from "react";
import { AnioGravable, CONSTANTES_2025, CONSTANTES_2026, TABLA_ART_241, PRESUNCION_COSTOS_UGPP, calcularFSP } from "@/lib/tax-calculator";
import { DependientesInput } from "./DependientesInput";

const formatCOP = (val: number) => 
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(val);

const formatCOPInput = (val: number) => {
  return val === 0 ? "" : `$ ${val.toLocaleString("es-CO")}`;
};

const handleMoneyChange = (valStr: string) => {
  const numStr = valStr.replace(/[^0-9]/g, "");
  return numStr ? parseInt(numStr, 10) : 0;
};

const BENCHMARKS = {
  RENTABILIDAD_HISTORICA_SP500: 0.10, // 10% anual en USD
  RENTABILIDAD_HISTORICA_CDT: 0.09, // 9% anual en COP
  RENTABILIDAD_HISTORICA_FPV: 0.07, // 7% anual en COP (conservador)
};

function MoneyInput({ value, onChange, label, id }: { value: number; onChange: (v: number) => void; label: string; id: string }) {
  return (
    <div className="input-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        value={formatCOPInput(value)}
        onChange={(e) => onChange(handleMoneyChange(e.target.value))}
        placeholder="$ 0"
      />
    </div>
  );
}


export function DeclaracionCedular({ anio }: { anio: AnioGravable }) {
  const C = anio === 2025 ? CONSTANTES_2025 : CONSTANTES_2026;

  // ── 1. MODELO DE DATOS ───────────────────────────────────────
  const [rentasTrabajo, setRentasTrabajo] = useState({ bruto: 0, retenciones: 0 });
  const [honorarios, setHonorarios] = useState({ 
    bruto: 0, 
    costosReales: 0, 
    retenciones: 0, 
    usaPresuntos: true, 
    actividad: "M. Actividades profesionales, científicas y técnicas" 
  });
  const [capital, setCapital] = useState({ 
    bruto: 0, 
    costosReales: 0, 
    retenciones: 0, 
    usaPresuntos: true 
  });
  const [noLaborales, setNoLaborales] = useState({ 
    bruto: 0, 
    costosReales: 0, 
    retenciones: 0, 
    usaPresuntos: true, 
    actividad: "G. Comercio al por mayor y al por menor, reparación de vehículos..." 
  });
  
  const [deducciones, setDeducciones] = useState({ afc: 0, prepagada: 0, interesesVivienda: 0, factura: 0 });
  const [rentabilidadEsperada, setRentabilidadEsperada] = useState(10); // 10% por defecto
  const [numDependientes, setNumDependientes] = useState(0);
  
  const [gananciasOcasionales, setGananciasOcasionales] = useState<Array<{ tipo: string, utilidad: number, esBVC: boolean, tiempo: number }>>([]);
  const [nuevoActivo, setNuevoActivo] = useState({ tipo: "", utilidad: 0, esBVC: false, tiempo: 0 });

  // ── 2. LÓGICA DEL MOTOR ──────────────────────────────────────
  const calculos = useMemo(() => {
    // Helper for IBC limits
    const calculateIBC = (netoMes: number) => {
      let ibcMes = netoMes * 0.40;
      let adjusted = false;
      let type = "";

      if (netoMes < C.SMMLV) {
        ibcMes = 0;
      } else {
        if (ibcMes < C.SMMLV) {
          ibcMes = C.SMMLV;
          adjusted = true;
          type = "piso";
        } else if (ibcMes > 25 * C.SMMLV) {
          ibcMes = 25 * C.SMMLV;
          adjusted = true;
          type = "techo";
        }
      }
      return { ibcMes, adjusted, type };
    };

    // A. Rentas de Trabajo (Laboral)
    const saludLaboralMes = rentasTrabajo.bruto * 0.04;
    const pensionLaboralMes = rentasTrabajo.bruto * 0.04;
    const fspLaboralMes = calcularFSP(rentasTrabajo.bruto, C.SMMLV);
    const INCR_LaboralMes = saludLaboralMes + pensionLaboralMes + fspLaboralMes;
    const netoLaboralMes = Math.max(0, rentasTrabajo.bruto - INCR_LaboralMes);

    const saludLaboralAnual = saludLaboralMes * 12;
    const pensionLaboralAnual = pensionLaboralMes * 12;
    const fspLaboralAnual = fspLaboralMes * 12;
    const INCR_LaboralAnual = INCR_LaboralMes * 12;
    const netoLaboralAnual = netoLaboralMes * 12;

    // ─── B. Rentas de Trabajo (Honorarios) ───
    // UGPP: presuntos o reales (para IBC/Seguridad Social)
    const costosUGPPHonorariosMes = honorarios.usaPresuntos
      ? honorarios.bruto * (PRESUNCION_COSTOS_UGPP[honorarios.actividad] || 0)
      : honorarios.costosReales;
    // DIAN: SOLO costos reales soportados (Art. 107 E.T.) — presuntos = $0
    const costosDIANHonorariosMes = honorarios.usaPresuntos ? 0 : honorarios.costosReales;

    const netoUGPPHonorariosMes = Math.max(0, honorarios.bruto - costosUGPPHonorariosMes);
    const { ibcMes: ibcHonorariosMes, adjusted: ibcAdjustedHonorarios, type: ibcTypeHonorarios } = calculateIBC(netoUGPPHonorariosMes);

    const saludHonorariosMes = ibcHonorariosMes * 0.125;
    const pensionHonorariosMes = ibcHonorariosMes * 0.16;
    const fspHonorariosMes = ibcHonorariosMes > 0 ? calcularFSP(ibcHonorariosMes, C.SMMLV) : 0;
    const INCR_HonorariosMes = saludHonorariosMes + pensionHonorariosMes + fspHonorariosMes;
    // netoHonorariosMes: para DIAN, resta costos DIAN (no presuntos) y aportes SS
    const netoHonorariosMes = Math.max(0, honorarios.bruto - costosDIANHonorariosMes - INCR_HonorariosMes);

    const costosUGPPHonorariosAnual = costosUGPPHonorariosMes * 12;
    const costosDIANHonorariosAnual = costosDIANHonorariosMes * 12;
    const netoUGPPHonorariosAnual = netoUGPPHonorariosMes * 12;
    const ibcHonorariosAnual = ibcHonorariosMes * 12;
    const saludHonorariosAnual = saludHonorariosMes * 12;
    const pensionHonorariosAnual = pensionHonorariosMes * 12;
    const fspHonorariosAnual = fspHonorariosMes * 12;
    const INCR_HonorariosAnual = INCR_HonorariosMes * 12;
    const netoHonorariosAnual = netoHonorariosMes * 12;

    // ─── C. Rentas de Capital ───
    const costosUGPPCapitalMes = capital.usaPresuntos
      ? capital.bruto * 0.2808
      : capital.costosReales;
    const costosDIANCapitalMes = capital.usaPresuntos ? 0 : capital.costosReales;

    const netoUGPPCapitalMes = Math.max(0, capital.bruto - costosUGPPCapitalMes);
    const { ibcMes: ibcCapitalMes, adjusted: ibcAdjustedCapital, type: ibcTypeCapital } = calculateIBC(netoUGPPCapitalMes);

    const saludCapitalMes = ibcCapitalMes * 0.125;
    const pensionCapitalMes = ibcCapitalMes * 0.16;
    const fspCapitalMes = ibcCapitalMes > 0 ? calcularFSP(ibcCapitalMes, C.SMMLV) : 0;
    const INCR_CapitalMes = saludCapitalMes + pensionCapitalMes + fspCapitalMes;
    const netoCapitalMes = Math.max(0, capital.bruto - costosDIANCapitalMes - INCR_CapitalMes);

    const costosUGPPCapitalAnual = costosUGPPCapitalMes * 12;
    const costosDIANCapitalAnual = costosDIANCapitalMes * 12;
    const netoUGPPCapitalAnual = netoUGPPCapitalMes * 12;
    const ibcCapitalAnual = ibcCapitalMes * 12;
    const saludCapitalAnual = saludCapitalMes * 12;
    const pensionCapitalAnual = pensionCapitalMes * 12;
    const fspCapitalAnual = fspCapitalMes * 12;
    const INCR_CapitalAnual = INCR_CapitalMes * 12;
    const netoCapitalAnual = netoCapitalMes * 12;

    // ─── D. Rentas No Laborales ───
    const costosUGPPNoLaboralesMes = noLaborales.usaPresuntos
      ? noLaborales.bruto * (PRESUNCION_COSTOS_UGPP[noLaborales.actividad] || 0)
      : noLaborales.costosReales;
    const costosDIANNoLaboralesMes = noLaborales.usaPresuntos ? 0 : noLaborales.costosReales;

    const netoUGPPNoLaboralesMes = Math.max(0, noLaborales.bruto - costosUGPPNoLaboralesMes);
    const { ibcMes: ibcNoLaboralesMes, adjusted: ibcAdjustedNoLaborales, type: ibcTypeNoLaborales } = calculateIBC(netoUGPPNoLaboralesMes);

    const saludNoLaboralesMes = ibcNoLaboralesMes * 0.125;
    const pensionNoLaboralesMes = ibcNoLaboralesMes * 0.16;
    const fspNoLaboralesMes = ibcNoLaboralesMes > 0 ? calcularFSP(ibcNoLaboralesMes, C.SMMLV) : 0;
    const INCR_NoLaboralesMes = saludNoLaboralesMes + pensionNoLaboralesMes + fspNoLaboralesMes;
    const netoNoLaboralesMes = Math.max(0, noLaborales.bruto - costosDIANNoLaboralesMes - INCR_NoLaboralesMes);

    const costosUGPPNoLaboralesAnual = costosUGPPNoLaboralesMes * 12;
    const costosDIANNoLaboralesAnual = costosDIANNoLaboralesMes * 12;
    const netoUGPPNoLaboralesAnual = netoUGPPNoLaboralesMes * 12;
    const ibcNoLaboralesAnual = ibcNoLaboralesMes * 12;
    const saludNoLaboralesAnual = saludNoLaboralesMes * 12;
    const pensionNoLaboralesAnual = pensionNoLaboralesMes * 12;
    const fspNoLaboralesAnual = fspNoLaboralesMes * 12;
    const INCR_NoLaboralesAnual = INCR_NoLaboralesMes * 12;
    const netoNoLaboralesAnual = netoNoLaboralesMes * 12;

    // Totales Cédula General (Anual)
    const ingresosBrutosTotales = (rentasTrabajo.bruto + honorarios.bruto + capital.bruto + noLaborales.bruto) * 12;
    const incrTotales = INCR_LaboralAnual + INCR_HonorariosAnual + INCR_CapitalAnual + INCR_NoLaboralesAnual;
    const rentaLiquidaTotal = netoLaboralAnual + netoHonorariosAnual + netoCapitalAnual + netoNoLaboralesAnual;

    // Deducciones
    const deduccionPrepagadaAnual = Math.min(deducciones.prepagada * 12, 16 * 12 * C.UVT);
    const deduccionViviendaAnual = Math.min(deducciones.interesesVivienda * 12, 100 * 12 * C.UVT);
    const aportesAFCAnual = deducciones.afc * 12;

    // Dependientes (Art. 387) - Tope 32 UVT/mes -> 384 UVT/año
    const brutoParaDependientes = rentasTrabajo.bruto + (honorarios.usaPresuntos ? honorarios.bruto : 0);
    const deduccionDependientes387Bruta = numDependientes > 0 ? (brutoParaDependientes * 12) * 0.10 : 0;
    const deduccionDependientes387Anual = Math.min(deduccionDependientes387Bruta, 384 * C.UVT);

    // Deducción por compras con factura electrónica (1% de compras, máx 240 UVT anuales - Art. 336 E.T.)
    const deduccionFacturaAnual = Math.min(deducciones.factura * 0.01, 240 * C.UVT);

    // Base depurada exclusiva para la renta de trabajo
    const netoHonorariosExentos = honorarios.usaPresuntos ? (honorarios.bruto * 12) - (saludHonorariosAnual + pensionHonorariosAnual) : 0;
    const baseRentaExenta = netoLaboralAnual + netoHonorariosExentos - deduccionDependientes387Anual - deduccionPrepagadaAnual - deduccionViviendaAnual - aportesAFCAnual;

    // Si las deducciones superan el ingreso, la base es 0
    const rentaExentaLaboralBruta = Math.max(0, baseRentaExenta) * 0.25;

    // Tope legal del 25% (790 UVT anuales)
    const rentaExentaLaboralAnual = Math.min(rentaExentaLaboralBruta, 790 * C.UVT);

    const deduccionesSujetasAnual = rentaExentaLaboralAnual + deduccionDependientes387Anual + deduccionPrepagadaAnual + deduccionViviendaAnual + aportesAFCAnual;

    const limite40Anual = rentaLiquidaTotal * 0.40;
    const limite1340UVT = 1340 * C.UVT;
    const limiteMaximoDeducciones = Math.min(limite40Anual, limite1340UVT);

    const deduccionesLimitadasAnual = Math.min(deduccionesSujetasAnual, limiteMaximoDeducciones);
    
    // Deducciones fuera de tope
    const deduccionDependientes336Anual = numDependientes * 72 * C.UVT; // 72 UVT anuales por dep (Art. 336)
    
    const baseGravable = Math.max(0, rentaLiquidaTotal - deduccionesLimitadasAnual - deduccionDependientes336Anual - deduccionFacturaAnual);
    const baseGravableUVT = baseGravable / C.UVT;

    // Cupo Disponible para Optimización
    const deduccionesPreviasAnual = deduccionDependientes387Anual + deduccionPrepagadaAnual + deduccionViviendaAnual;
    const ingresoNetoDIANAnual = netoLaboralAnual + (honorarios.usaPresuntos ? netoHonorariosAnual : 0);
    
    let cupoOptimoAFCAnual = 0;
    if (honorarios.usaPresuntos) {
      const re = 0.25;
      const limiteReal = Math.min(limite40Anual, limite1340UVT);
      const candidato = (limiteReal - re * ingresoNetoDIANAnual - (1 - re) * deduccionesPreviasAnual) / (1 - re);
      cupoOptimoAFCAnual = Math.max(0, candidato);
    } else {
      cupoOptimoAFCAnual = Math.max(0, Math.min(limite40Anual, limite1340UVT) - deduccionesLimitadasAnual);
    }

    // Tabla Art 241
    let impuestoCedulaGeneralUVT = 0;
    let tramoMarginal = 0;
    
    for (const t of TABLA_ART_241) {
      if (baseGravableUVT >= t.desde && baseGravableUVT < t.hasta) {
        impuestoCedulaGeneralUVT = t.cuotaFija + (baseGravableUVT - t.baseUVT) * t.marginal;
        tramoMarginal = t.marginal;
        break;
      }
    }
    if (baseGravableUVT >= TABLA_ART_241[TABLA_ART_241.length - 1].hasta) {
      const u = TABLA_ART_241[TABLA_ART_241.length - 1];
      impuestoCedulaGeneralUVT = u.cuotaFija + (baseGravableUVT - u.baseUVT) * u.marginal;
      tramoMarginal = u.marginal;
    }
    
    const impuestoCedulaGeneral = impuestoCedulaGeneralUVT * C.UVT;

    // Simulador de Ahorro Neto Riguroso: Re-calcula la base final asumiendo que se agota el límite máximo permitido por la ley
    const baseOptimizada = Math.max(0, rentaLiquidaTotal - limiteMaximoDeducciones - deduccionDependientes336Anual - deduccionFacturaAnual);
    const baseOptimizadaUVT = baseOptimizada / C.UVT;
    let impuestoOptimizadoUVT = 0;
    
    for (const t of TABLA_ART_241) {
      if (baseOptimizadaUVT >= t.desde && baseOptimizadaUVT < t.hasta) {
        impuestoOptimizadoUVT = t.cuotaFija + (baseOptimizadaUVT - t.baseUVT) * t.marginal;
        break;
      }
    }
    if (baseOptimizadaUVT >= TABLA_ART_241[TABLA_ART_241.length - 1].hasta) {
      const u = TABLA_ART_241[TABLA_ART_241.length - 1];
      impuestoOptimizadoUVT = u.cuotaFija + (baseOptimizadaUVT - u.baseUVT) * u.marginal;
    }
    const impuestoOptimizado = impuestoOptimizadoUVT * C.UVT;
    const ahorroNeto = impuestoCedulaGeneral - impuestoOptimizado;

    // Cálculos de Asesoría Cuantitativa
    const rentabilidadBreakevenAnual = Math.pow(Math.pow(1 + BENCHMARKS.RENTABILIDAD_HISTORICA_FPV, 10) / (1 - tramoMarginal), 1/10) - 1;
    const costoNetoDeuda = 0.12 * (1 - tramoMarginal); // Asumiendo 12% nominal

    // Ganancias Ocasionales
    let impuestoGananciasOcasionales = 0;
    gananciasOcasionales.forEach(g => {
      if (g.tiempo > 2 && !g.esBVC) {
        impuestoGananciasOcasionales += g.utilidad * 0.15;
      }
    });

    const impuestoTotal = impuestoCedulaGeneral + impuestoGananciasOcasionales;
    const retencionesTotalesAnual = (rentasTrabajo.retenciones + honorarios.retenciones + capital.retenciones + noLaborales.retenciones) * 12;
    const saldoFinal = impuestoTotal - retencionesTotalesAnual;

    const costosTotalesUGPPAnual = costosUGPPHonorariosAnual + costosUGPPCapitalAnual + costosUGPPNoLaboralesAnual;
    const costosTotalesDIANAnual = costosDIANHonorariosAnual + costosDIANCapitalAnual + costosDIANNoLaboralesAnual;

    return {
      ingresosBrutosTotales,
      incrTotales,
      rentaLiquidaTotal,
      deduccionesSujetas: deduccionesSujetasAnual,
      deduccionesLimitadas: deduccionesLimitadasAnual,
      deduccionDependientes336: deduccionDependientes336Anual,
      baseGravable,
      impuestoCedulaGeneral,
      impuestoGananciasOcasionales,
      impuestoTotal,
      retencionesTotales: retencionesTotalesAnual,
      saldoFinal,
      tramoMarginal,
      cupoDisponible: cupoOptimoAFCAnual,
      impuestoOptimizado,
      ahorroNeto,
      rentaExentaLaboralAnual,
      rentabilidadBreakevenAnual,
      costoNetoDeuda,
      deduccionDependientes387Anual,
      deduccionPrepagadaAnual,
      deduccionViviendaAnual,
      aportesAFCAnual,
      costosTotalesUGPPAnual,
      costosTotalesDIANAnual,
      limite40Anual,
      // Desgloses para UI
      honorarios: {
        // UGPP (para IBC / Seguridad Social)
        costosUGPPMes: costosUGPPHonorariosMes, costosUGPPAnual: costosUGPPHonorariosAnual,
        netoUGPPMes: netoUGPPHonorariosMes, netoUGPPAnual: netoUGPPHonorariosAnual,
        ibcMes: ibcHonorariosMes, ibcAnual: ibcHonorariosAnual,
        saludMes: saludHonorariosMes, saludAnual: saludHonorariosAnual,
        pensionMes: pensionHonorariosMes, pensionAnual: pensionHonorariosAnual,
        fspMes: fspHonorariosMes, fspAnual: fspHonorariosAnual,
        ibcAdjusted: ibcAdjustedHonorarios, ibcType: ibcTypeHonorarios,
        // DIAN (para base gravable renta)
        costosDIANMes: costosDIANHonorariosMes, costosDIANAnual: costosDIANHonorariosAnual,
        usaPresuntos: honorarios.usaPresuntos,
      },
      capital: {
        costosUGPPMes: costosUGPPCapitalMes, costosUGPPAnual: costosUGPPCapitalAnual,
        netoUGPPMes: netoUGPPCapitalMes, netoUGPPAnual: netoUGPPCapitalAnual,
        ibcMes: ibcCapitalMes, ibcAnual: ibcCapitalAnual,
        saludMes: saludCapitalMes, saludAnual: saludCapitalAnual,
        pensionMes: pensionCapitalMes, pensionAnual: pensionCapitalAnual,
        fspMes: fspCapitalMes, fspAnual: fspCapitalAnual,
        ibcAdjusted: ibcAdjustedCapital, ibcType: ibcTypeCapital,
        costosDIANMes: costosDIANCapitalMes, costosDIANAnual: costosDIANCapitalAnual,
        usaPresuntos: capital.usaPresuntos,
      },
      noLaborales: {
        costosUGPPMes: costosUGPPNoLaboralesMes, costosUGPPAnual: costosUGPPNoLaboralesAnual,
        netoUGPPNoLaboralesMes: netoUGPPNoLaboralesMes, netoUGPPAnual: netoUGPPNoLaboralesAnual,
        ibcMes: ibcNoLaboralesMes, ibcAnual: ibcNoLaboralesAnual,
        saludMes: saludNoLaboralesMes, saludAnual: saludNoLaboralesAnual,
        pensionMes: pensionNoLaboralesMes, pensionAnual: pensionNoLaboralesAnual,
        fspMes: fspNoLaboralesMes, fspAnual: fspNoLaboralesAnual,
        ibcAdjusted: ibcAdjustedNoLaborales, ibcType: ibcTypeNoLaborales,
        costosDIANMes: costosDIANNoLaboralesMes, costosDIANAnual: costosDIANNoLaboralesAnual,
        usaPresuntos: noLaborales.usaPresuntos,
      },
      laboral: { 
        saludMes: saludLaboralMes, pensionMes: pensionLaboralMes, fspMes: fspLaboralMes,
        saludAnual: saludLaboralAnual, pensionAnual: pensionLaboralAnual, fspAnual: fspLaboralAnual 
      }
    };
  }, [rentasTrabajo, honorarios, capital, noLaborales, deducciones, numDependientes, gananciasOcasionales, C]);

  // Componentes auxiliares movidos fuera para evitar pérdida de foco


  return (
    <div className="declaracion-container">
      <style>{`
        .declaracion-container {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          color: #f8fafc;
          font-family: system-ui, -apple-system, sans-serif;
        }
        @media (max-width: 1024px) {
          .declaracion-container {
            grid-template-columns: 1fr;
          }
        }
        .section-box {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 16px;
        }
        .accordion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          font-size: 1.1rem;
          font-weight: 700;
          color: #38bdf8;
        }
        .tip-text {
          font-size: 0.85rem;
          color: #94a3b8;
          margin-top: 4px;
          font-style: italic;
        }
        .input-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 12px;
        }
        .input-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .input-field label {
          font-size: 0.85rem;
          color: #94a3b8;
        }
        .input-field input, .input-field select {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 10px;
          color: #f8fafc;
          font-size: 0.95rem;
        }
        .sidebar {
          position: sticky;
          top: 20px;
          height: fit-content;
          background: #0f172a;
          border: 1.5px solid #334155;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }
        .result-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 0.9rem;
        }
        .result-value {
          font-weight: 700;
        }
        .total-box {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #334155;
          text-align: center;
        }
        .total-value {
          font-size: 1.5rem;
          font-weight: 800;
          margin-top: 8px;
        }
        .btn-add {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          margin-top: 12px;
        }
        .toggle-group {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-top: 10px;
        }
        .toggle-btn {
          background: #334155;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          color: #94a3b8;
          font-size: 0.85rem;
          transition: all 0.2s;
        }
        .toggle-btn.active {
          background: #06b6d4;
          color: white;
        }
        .desglose-box {
          background: #1e293b;
          border-radius: 8px;
          padding: 12px;
          margin-top: 12px;
          font-size: 0.85rem;
          color: #cbd5e1;
        }
        .desglose-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .optimization-box {
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid #06b6d4;
          border-radius: 8px;
          padding: 16px;
          margin-top: 16px;
        }
      `}</style>

      {/* ── COLUMNA PRINCIPAL (FORMULARIOS) ──────────────────────── */}
      <div className="main-content">
        
        <h2 style={{ color: "#f8fafc", marginBottom: "20px", fontSize: "1.5rem", fontWeight: 800 }}>Cédula General</h2>

        {/* A. Rentas de Trabajo (Laboral) */}
        <details className="section-box" open>
          <summary className="accordion-header">
            <span>A. Rentas de Trabajo (Contrato Laboral)</span>
            <span>👇</span>
          </summary>
          <div className="tip-text">Incluye salarios, primas, cesantías y bonificaciones derivadas de un contrato laboral formal.</div>
          
          <div className="input-group">
            <MoneyInput 
              id="trabajo-bruto"
              label="Ingresos Brutos Mensuales"
              value={rentasTrabajo.bruto}
              onChange={(v) => setRentasTrabajo({ ...rentasTrabajo, bruto: v })}
            />
            <MoneyInput 
              id="trabajo-retenciones"
              label="Retenciones Mensuales"
              value={rentasTrabajo.retenciones}
              onChange={(v) => setRentasTrabajo({ ...rentasTrabajo, retenciones: v })}
            />
          </div>

          <div className="desglose-box" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "6px" }}>
            <div style={{ fontWeight: 700, color: "#38bdf8" }}>Concepto</div>
            <div style={{ fontWeight: 700, color: "#38bdf8", textAlign: "right" }}>Mensual</div>
            <div style={{ fontWeight: 700, color: "#38bdf8", textAlign: "right" }}>Anual</div>
            
            <div>Ingreso Bruto:</div>
            <div style={{ textAlign: "right" }}>{formatCOP(rentasTrabajo.bruto)}</div>
            <div style={{ textAlign: "right" }}>{formatCOP(rentasTrabajo.bruto * 12)}</div>
            
            <div style={{ color: "#f87171" }}>(-) Salud (4%):</div>
            <div style={{ textAlign: "right", color: "#f87171" }}>{formatCOP(calculos.laboral.saludMes)}</div>
            <div style={{ textAlign: "right", color: "#f87171" }}>{formatCOP(calculos.laboral.saludAnual)}</div>
            
            <div style={{ color: "#f87171" }}>(-) Pensión (4%):</div>
            <div style={{ textAlign: "right", color: "#f87171" }}>{formatCOP(calculos.laboral.pensionMes)}</div>
            <div style={{ textAlign: "right", color: "#f87171" }}>{formatCOP(calculos.laboral.pensionAnual)}</div>

            {calculos.laboral.fspMes > 0 && (
              <>
                <div style={{ color: "#f87171" }}>(-) FSP ({((calculos.laboral.fspMes / rentasTrabajo.bruto) * 100).toFixed(1)}% s/ IBC):</div>
                <div style={{ textAlign: "right", color: "#f87171" }}>{formatCOP(calculos.laboral.fspMes)}</div>
                <div style={{ textAlign: "right", color: "#f87171" }}>{formatCOP(calculos.laboral.fspAnual)}</div>
              </>
            )}
            
            <div style={{ borderTop: "1px solid #334155", paddingTop: "4px", fontWeight: 700 }}>(=) Neto:</div>
            <div style={{ textAlign: "right", borderTop: "1px solid #334155", paddingTop: "4px", fontWeight: 700 }}>{formatCOP(rentasTrabajo.bruto - calculos.laboral.saludMes - calculos.laboral.pensionMes - calculos.laboral.fspMes)}</div>
            <div style={{ textAlign: "right", borderTop: "1px solid #334155", paddingTop: "4px", fontWeight: 700 }}>{formatCOP((rentasTrabajo.bruto - calculos.laboral.saludMes - calculos.laboral.pensionMes - calculos.laboral.fspMes) * 12)}</div>
          </div>
        </details>

        {/* B. Rentas de Trabajo (Honorarios) */}
        <details className="section-box">
          <summary className="accordion-header">
            <span>B. Rentas de Trabajo (Prestación de Servicios / Honorarios)</span>
            <span>👇</span>
          </summary>
          <div className="tip-text">Ingresos como trabajador independiente donde predomina tu esfuerzo intelectual.</div>

          <div className="input-group">
            <MoneyInput 
              id="honorarios-bruto"
              label="Ingresos Brutos Mensuales"
              value={honorarios.bruto}
              onChange={(v) => setHonorarios({ ...honorarios, bruto: v })}
            />
            <MoneyInput 
              id="honorarios-retenciones"
              label="Retenciones Practicadas Mensuales"
              value={honorarios.retenciones}
              onChange={(v) => setHonorarios({ ...honorarios, retenciones: v })}
            />
          </div>

          <div className="toggle-group">
            <button 
              className={`toggle-btn ${honorarios.usaPresuntos ? "active" : ""}`}
              onClick={() => setHonorarios({ ...honorarios, usaPresuntos: true })}
            >Usar Costos Presuntos</button>
            <button 
              className={`toggle-btn ${!honorarios.usaPresuntos ? "active" : ""}`}
              onClick={() => setHonorarios({ ...honorarios, usaPresuntos: false })}
            >Usar Costos Reales</button>
          </div>

          {honorarios.usaPresuntos ? (
            <div className="input-field" style={{ marginTop: "12px" }}>
              <label>Actividad Económica (UGPP)</label>
              <select 
                value={honorarios.actividad}
                onChange={(e) => setHonorarios({ ...honorarios, actividad: e.target.value })}
              >
                {Object.keys(PRESUNCION_COSTOS_UGPP)
                  .filter(k => !k.toLowerCase().includes("rentistas de capital"))
                  .map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
              </select>
            </div>
          ) : (
            <div style={{ marginTop: "12px" }}>
              <MoneyInput 
                id="honorarios-costos"
                label="Costos Reales Mensuales"
                value={honorarios.costosReales}
                onChange={(v) => setHonorarios({ ...honorarios, costosReales: v })}
              />
            </div>
          )}

          {/* DIAN Compliance Banner */}
          {honorarios.usaPresuntos && honorarios.bruto > 0 && (
            <div style={{ marginTop: "12px", padding: "10px 14px", backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: "8px", color: "#fca5a5", fontSize: "0.82rem", lineHeight: 1.5 }}>
              🚨 <strong>Alerta Cumplimiento DIAN (Art. 107 E.T.):</strong> Los costos presuntos UGPP <em>no son deducibles</em> en la declaración de renta. Para esta sección la Base Gravable DIAN se calcula sin deducción de costos. Si tienes costos reales soportados (facturas, contratos), selecciona <strong>«Usar Costos Reales»</strong>.
            </div>
          )}

          <div className="desglose-box" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "6px" }}>
            <div style={{ fontWeight: 700, color: "#38bdf8" }}>Concepto</div>
            <div style={{ fontWeight: 700, color: "#38bdf8", textAlign: "right" }}>Mensual</div>
            <div style={{ fontWeight: 700, color: "#38bdf8", textAlign: "right" }}>Anual</div>
            
            <div>Ingreso Bruto:</div>
            <div style={{ textAlign: "right" }}>{formatCOP(honorarios.bruto)}</div>
            <div style={{ textAlign: "right" }}>{formatCOP(honorarios.bruto * 12)}</div>
            
            <div style={{ color: "#64748b", fontStyle: "italic" }}>(-) Costos UGPP (SS):</div>
            <div style={{ textAlign: "right", color: "#64748b" }}>{formatCOP(calculos.honorarios.costosUGPPMes)}</div>
            <div style={{ textAlign: "right", color: "#64748b" }}>{formatCOP(calculos.honorarios.costosUGPPAnual)}</div>
            
            <div style={{ borderTop: "1px solid #334155", paddingTop: "4px" }}>(=) Ingreso Neto UGPP:</div>
            <div style={{ textAlign: "right", borderTop: "1px solid #334155", paddingTop: "4px" }}>{formatCOP(calculos.honorarios.netoUGPPMes)}</div>
            <div style={{ textAlign: "right", borderTop: "1px solid #334155", paddingTop: "4px" }}>{formatCOP(calculos.honorarios.netoUGPPAnual)}</div>
            
            <div style={{ color: "#f87171" }}>(-) Costos DIAN (Reales):</div>
            <div style={{ textAlign: "right", color: "#f87171" }}>{formatCOP(calculos.honorarios.costosDIANMes)}</div>
            <div style={{ textAlign: "right", color: "#f87171" }}>{formatCOP(calculos.honorarios.costosDIANAnual)}</div>
            
            {/* Alertas de IBC */}
            {calculos.honorarios.netoUGPPMes < C.SMMLV && (
              <div style={{ gridColumn: "span 3", padding: "10px", backgroundColor: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "8px", color: "#f59e0b", fontSize: "0.8rem", marginTop: "8px" }}>
                ⚠️ <strong>Sin Capacidad de Pago:</strong> Ingreso neto inferior a 1 SMMLV ({formatCOP(C.SMMLV)} mensual / {formatCOP(C.SMMLV * 12)} anual). No estás obligado a cotizar a seguridad social.
              </div>
            )}
            {calculos.honorarios.netoUGPPMes >= C.SMMLV && calculos.honorarios.ibcAdjusted && calculos.honorarios.ibcType === "piso" && (
              <div style={{ gridColumn: "span 3", padding: "10px", backgroundColor: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "8px", color: "#f59e0b", fontSize: "0.8rem", marginTop: "8px" }}>
                ⚠️ <strong>Ajuste al Piso:</strong> El IBC (40%) era menor al mínimo legal. Se ajustó a 1 SMMLV ({formatCOP(C.SMMLV)} mensual / {formatCOP(C.SMMLV * 12)} anual).
              </div>
            )}
            {calculos.honorarios.ibcAdjusted && calculos.honorarios.ibcType === "techo" && (
              <div style={{ gridColumn: "span 3", padding: "10px", backgroundColor: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "8px", color: "#f59e0b", fontSize: "0.8rem", marginTop: "8px" }}>
                ⚠️ <strong>Ajuste al Techo:</strong> El IBC superó el límite máximo legal. Se ajustó a 25 SMMLV ({formatCOP(C.SMMLV * 25)} mensual / {formatCOP(C.SMMLV * 25 * 12)} anual).
              </div>
            )}
            
            <div>IBC (40%): {calculos.honorarios.ibcAdjusted && <span title={`Ajustado por ${calculos.honorarios.ibcType}`}>⚠️</span>}</div>
            <div style={{ textAlign: "right" }}>{formatCOP(calculos.honorarios.ibcMes)}</div>
            <div style={{ textAlign: "right" }}>{formatCOP(calculos.honorarios.ibcAnual)}</div>
            
            <div style={{ color: "#f87171" }}>(-) Salud (12.5%):</div>
            <div style={{ textAlign: "right", color: "#f87171" }}>{formatCOP(calculos.honorarios.saludMes)}</div>
            <div style={{ textAlign: "right", color: "#f87171" }}>{formatCOP(calculos.honorarios.saludAnual)}</div>
            
            <div style={{ color: "#f87171" }}>(-) Pensión (16%):</div>
            <div style={{ textAlign: "right", color: "#f87171" }}>{formatCOP(calculos.honorarios.pensionMes)}</div>
            <div style={{ textAlign: "right", color: "#f87171" }}>{formatCOP(calculos.honorarios.pensionAnual)}</div>

            {calculos.honorarios.fspMes > 0 && (
              <>
                <div style={{ color: "#f87171" }}>(-) FSP ({((calculos.honorarios.fspMes / calculos.honorarios.ibcMes) * 100).toFixed(1)}% s/ IBC):</div>
                <div style={{ textAlign: "right", color: "#f87171" }}>{formatCOP(calculos.honorarios.fspMes)}</div>
                <div style={{ textAlign: "right", color: "#f87171" }}>{formatCOP(calculos.honorarios.fspAnual)}</div>
              </>
            )}
            
            <div style={{ borderTop: "1px solid #334155", paddingTop: "4px", fontWeight: 700, color: "#34d399" }}>(=) Neto DIAN (Renta):</div>
            <div style={{ textAlign: "right", borderTop: "1px solid #334155", paddingTop: "4px", fontWeight: 700, color: "#34d399" }}>{formatCOP(honorarios.bruto - calculos.honorarios.costosDIANMes - calculos.honorarios.saludMes - calculos.honorarios.pensionMes - calculos.honorarios.fspMes)}</div>
            <div style={{ textAlign: "right", borderTop: "1px solid #334155", paddingTop: "4px", fontWeight: 700, color: "#34d399" }}>{formatCOP((honorarios.bruto - calculos.honorarios.costosDIANMes - calculos.honorarios.saludMes - calculos.honorarios.pensionMes - calculos.honorarios.fspMes) * 12)}</div>
          </div>
        </details>

        {/* C. Rentas de Capital */}
        <details className="section-box">
          <summary className="accordion-header">
            <span>C. Rentas de Capital</span>
            <span>👇</span>
          </summary>
          <div className="tip-text">Ingresos por arrendamientos, regalías o rendimientos financieros.</div>

          <div className="input-group">
            <MoneyInput 
              id="capital-bruto"
              label="Ingresos Brutos Mensuales"
              value={capital.bruto}
              onChange={(v) => setCapital({ ...capital, bruto: v })}
            />
            <MoneyInput 
              id="capital-retenciones"
              label="Retenciones Practicadas Mensuales"
              value={capital.retenciones}
              onChange={(v) => setCapital({ ...capital, retenciones: v })}
            />
          </div>

          <div className="toggle-group">
            <button 
              className={`toggle-btn ${capital.usaPresuntos ? "active" : ""}`}
              onClick={() => setCapital({ ...capital, usaPresuntos: true })}
            >Usar Costos Presuntos</button>
            <button 
              className={`toggle-btn ${!capital.usaPresuntos ? "active" : ""}`}
              onClick={() => setCapital({ ...capital, usaPresuntos: false })}
            >Usar Costos Reales</button>
          </div>

          {capital.usaPresuntos ? (
            <div className="tip-text" style={{ marginTop: "8px" }}>Se aplica la presunción del 28.08% para rentistas de capital.</div>
          ) : (
            <div style={{ marginTop: "12px" }}>
              <MoneyInput 
                id="capital-costos"
                label="Costos Reales Mensuales"
                value={capital.costosReales}
                onChange={(v) => setCapital({ ...capital, costosReales: v })}
              />
            </div>
          )}

          {/* DIAN Compliance Banner */}
          {capital.usaPresuntos && capital.bruto > 0 && (
            <div style={{ marginTop: "12px", padding: "10px 14px", backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: "8px", color: "#fca5a5", fontSize: "0.82rem", lineHeight: 1.5 }}>
              🚨 <strong>Alerta Cumplimiento DIAN (Art. 107 E.T.):</strong> La presunción del 28.08% de rentistas de capital es exclusiva para el IBC de seguridad social. Para la declaración de renta, la deducción de costos es <strong>$0</strong> salvo que tengas costos reales soportados.
            </div>
          )}

          <div className="desglose-box" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "6px" }}>
            <div style={{ fontWeight: 700, color: "#38bdf8" }}>Concepto</div>
            <div style={{ fontWeight: 700, color: "#38bdf8", textAlign: "right" }}>Mensual</div>
            <div style={{ fontWeight: 700, color: "#38bdf8", textAlign: "right" }}>Anual</div>
            
            <div>Ingreso Bruto:</div>
            <div style={{ textAlign: "right" }}>{formatCOP(capital.bruto)}</div>
            <div style={{ textAlign: "right" }}>{formatCOP(capital.bruto * 12)}</div>
            
            <div style={{ color: "#64748b", fontStyle: "italic" }}>(-) Costos UGPP (SS):</div>
            <div style={{ textAlign: "right", color: "#64748b" }}>{formatCOP(calculos.capital.costosUGPPMes)}</div>
            <div style={{ textAlign: "right", color: "#64748b" }}>{formatCOP(calculos.capital.costosUGPPAnual)}</div>
            
            <div style={{ borderTop: "1px solid #334155", paddingTop: "4px" }}>(=) Ingreso Neto UGPP:</div>
            <div style={{ textAlign: "right", borderTop: "1px solid #334155", paddingTop: "4px" }}>{formatCOP(calculos.capital.netoUGPPMes)}</div>
            <div style={{ textAlign: "right", borderTop: "1px solid #334155", paddingTop: "4px" }}>{formatCOP(calculos.capital.netoUGPPAnual)}</div>
            
            <div style={{ color: "#f87171" }}>(-) Costos DIAN (Reales):</div>
            <div style={{ textAlign: "right", color: "#f87171" }}>{formatCOP(calculos.capital.costosDIANMes)}</div>
            <div style={{ textAlign: "right", color: "#f87171" }}>{formatCOP(calculos.capital.costosDIANAnual)}</div>
            
            {/* Alertas de IBC */}
            {calculos.capital.netoUGPPMes < C.SMMLV && (
              <div style={{ gridColumn: "span 3", padding: "10px", backgroundColor: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "8px", color: "#f59e0b", fontSize: "0.8rem", marginTop: "8px" }}>
                ⚠️ <strong>Sin Capacidad de Pago:</strong> Ingreso neto inferior a 1 SMMLV ({formatCOP(C.SMMLV)} mensual / {formatCOP(C.SMMLV * 12)} anual). No estás obligado a cotizar a seguridad social.
              </div>
            )}
            {calculos.capital.netoUGPPMes >= C.SMMLV && calculos.capital.ibcAdjusted && calculos.capital.ibcType === "piso" && (
              <div style={{ gridColumn: "span 3", padding: "10px", backgroundColor: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "8px", color: "#f59e0b", fontSize: "0.8rem", marginTop: "8px" }}>
                ⚠️ <strong>Ajuste al Piso:</strong> El IBC (40%) era menor al mínimo legal. Se ajustó a 1 SMMLV ({formatCOP(C.SMMLV)} mensual / {formatCOP(C.SMMLV * 12)} anual).
              </div>
            )}
            {calculos.capital.ibcAdjusted && calculos.capital.ibcType === "techo" && (
              <div style={{ gridColumn: "span 3", padding: "10px", backgroundColor: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "8px", color: "#f59e0b", fontSize: "0.8rem", marginTop: "8px" }}>
                ⚠️ <strong>Ajuste al Techo:</strong> El IBC superó el límite máximo legal. Se ajustó a 25 SMMLV ({formatCOP(C.SMMLV * 25)} mensual / {formatCOP(C.SMMLV * 25 * 12)} anual).
              </div>
            )}
            
            <div>IBC (40%): {calculos.capital.ibcAdjusted && <span title={`Ajustado por ${calculos.capital.ibcType}`}>⚠️</span>}</div>
            <div style={{ textAlign: "right" }}>{formatCOP(calculos.capital.ibcMes)}</div>
            <div style={{ textAlign: "right" }}>{formatCOP(calculos.capital.ibcAnual)}</div>
            
            <div style={{ color: "#f87171" }}>(-) Salud (12.5%):</div>
            <div style={{ textAlign: "right", color: "#f87171" }}>{formatCOP(calculos.capital.saludMes)}</div>
            <div style={{ textAlign: "right", color: "#f87171" }}>{formatCOP(calculos.capital.saludAnual)}</div>
            
            <div style={{ color: "#f87171" }}>(-) Pensión (16%):</div>
            <div style={{ textAlign: "right", color: "#f87171" }}>{formatCOP(calculos.capital.pensionMes)}</div>
            <div style={{ textAlign: "right", color: "#f87171" }}>{formatCOP(calculos.capital.pensionAnual)}</div>

            {calculos.capital.fspMes > 0 && (
              <>
                <div style={{ color: "#f87171" }}>(-) FSP ({((calculos.capital.fspMes / calculos.capital.ibcMes) * 100).toFixed(1)}% s/ IBC):</div>
                <div style={{ textAlign: "right", color: "#f87171" }}>{formatCOP(calculos.capital.fspMes)}</div>
                <div style={{ textAlign: "right", color: "#f87171" }}>{formatCOP(calculos.capital.fspAnual)}</div>
              </>
            )}
            
            <div style={{ borderTop: "1px solid #334155", paddingTop: "4px", fontWeight: 700, color: "#34d399" }}>(=) Neto DIAN (Renta):</div>
            <div style={{ textAlign: "right", borderTop: "1px solid #334155", paddingTop: "4px", fontWeight: 700, color: "#34d399" }}>{formatCOP(capital.bruto - calculos.capital.costosDIANMes - calculos.capital.saludMes - calculos.capital.pensionMes - calculos.capital.fspMes)}</div>
            <div style={{ textAlign: "right", borderTop: "1px solid #334155", paddingTop: "4px", fontWeight: 700, color: "#34d399" }}>{formatCOP((capital.bruto - calculos.capital.costosDIANMes - calculos.capital.saludMes - calculos.capital.pensionMes - calculos.capital.fspMes) * 12)}</div>
          </div>
        </details>

        {/* D. Rentas No Laborales */}
        <details className="section-box">
          <summary className="accordion-header">
            <span>D. Rentas No Laborales</span>
            <span>👇</span>
          </summary>
          <div className="tip-text">Ingresos comerciales, venta de bienes, agricultura o actividades donde predomina el factor material.</div>

          <div className="input-group">
            <MoneyInput 
              id="nolaborales-bruto"
              label="Ingresos Brutos Mensuales"
              value={noLaborales.bruto}
              onChange={(v) => setNoLaborales({ ...noLaborales, bruto: v })}
            />
            <MoneyInput 
              id="nolaborales-retenciones"
              label="Retenciones Practicadas Mensuales"
              value={noLaborales.retenciones}
              onChange={(v) => setNoLaborales({ ...noLaborales, retenciones: v })}
            />
          </div>

          <div className="toggle-group">
            <button 
              className={`toggle-btn ${noLaborales.usaPresuntos ? "active" : ""}`}
              onClick={() => setNoLaborales({ ...noLaborales, usaPresuntos: true })}
            >Usar Costos Presuntos</button>
            <button 
              className={`toggle-btn ${!noLaborales.usaPresuntos ? "active" : ""}`}
              onClick={() => setNoLaborales({ ...noLaborales, usaPresuntos: false })}
            >Usar Costos Reales</button>
          </div>

          {noLaborales.usaPresuntos ? (
            <div className="input-field" style={{ marginTop: "12px" }}>
              <label>Actividad Económica (UGPP)</label>
              <select 
                value={noLaborales.actividad}
                onChange={(e) => setNoLaborales({ ...noLaborales, actividad: e.target.value })}
              >
                {Object.keys(PRESUNCION_COSTOS_UGPP)
                  .filter(k => k !== "Rentistas de Capital incluidos dividendos y participaciones")
                  .map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
              </select>
            </div>
          ) : (
            <div style={{ marginTop: "12px" }}>
              <MoneyInput 
                id="nolaborales-costos"
                label="Costos Reales Mensuales"
                value={noLaborales.costosReales}
                onChange={(v) => setNoLaborales({ ...noLaborales, costosReales: v })}
              />
            </div>
          )}

          {/* DIAN Compliance Banner */}
          {noLaborales.usaPresuntos && noLaborales.bruto > 0 && (
            <div style={{ marginTop: "12px", padding: "10px 14px", backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: "8px", color: "#fca5a5", fontSize: "0.82rem", lineHeight: 1.5 }}>
              🚨 <strong>Alerta Cumplimiento DIAN (Art. 107 E.T.):</strong> Los costos presuntos UGPP no son deducibles en renta. Si no tienes costos reales soportados con facturas o documentos equivalentes, la deducción DIAN es <strong>$0</strong>. Selecciona <strong>«Usar Costos Reales»</strong> si los tienes.
            </div>
          )}

          <div className="desglose-box" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "6px" }}>
            <div style={{ fontWeight: 700, color: "#38bdf8" }}>Concepto</div>
            <div style={{ fontWeight: 700, color: "#38bdf8", textAlign: "right" }}>Mensual</div>
            <div style={{ fontWeight: 700, color: "#38bdf8", textAlign: "right" }}>Anual</div>
            
            <div>Ingreso Bruto:</div>
            <div style={{ textAlign: "right" }}>{formatCOP(noLaborales.bruto)}</div>
            <div style={{ textAlign: "right" }}>{formatCOP(noLaborales.bruto * 12)}</div>
            
            <div style={{ color: "#64748b", fontStyle: "italic" }}>(-) Costos UGPP (SS):</div>
            <div style={{ textAlign: "right", color: "#64748b" }}>{formatCOP(calculos.noLaborales.costosUGPPMes)}</div>
            <div style={{ textAlign: "right", color: "#64748b" }}>{formatCOP(calculos.noLaborales.costosUGPPAnual)}</div>
            
            <div style={{ borderTop: "1px solid #334155", paddingTop: "4px" }}>(=) Ingreso Neto UGPP:</div>
            <div style={{ textAlign: "right", borderTop: "1px solid #334155", paddingTop: "4px" }}>{formatCOP(calculos.noLaborales.netoUGPPNoLaboralesMes)}</div>
            <div style={{ textAlign: "right", borderTop: "1px solid #334155", paddingTop: "4px" }}>{formatCOP(calculos.noLaborales.netoUGPPAnual)}</div>
            
            <div style={{ color: "#f87171" }}>(-) Costos DIAN (Reales):</div>
            <div style={{ textAlign: "right", color: "#f87171" }}>{formatCOP(calculos.noLaborales.costosDIANMes)}</div>
            <div style={{ textAlign: "right", color: "#f87171" }}>{formatCOP(calculos.noLaborales.costosDIANAnual)}</div>
            
            {/* Alertas de IBC */}
            {calculos.noLaborales.netoUGPPNoLaboralesMes < C.SMMLV && (
              <div style={{ gridColumn: "span 3", padding: "10px", backgroundColor: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "8px", color: "#f59e0b", fontSize: "0.8rem", marginTop: "8px" }}>
                ⚠️ <strong>Sin Capacidad de Pago:</strong> Ingreso neto inferior a 1 SMMLV ({formatCOP(C.SMMLV)} mensual / {formatCOP(C.SMMLV * 12)} anual). No estás obligado a cotizar a seguridad social.
              </div>
            )}
            {calculos.noLaborales.netoUGPPNoLaboralesMes >= C.SMMLV && calculos.noLaborales.ibcAdjusted && calculos.noLaborales.ibcType === "piso" && (
              <div style={{ gridColumn: "span 3", padding: "10px", backgroundColor: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "8px", color: "#f59e0b", fontSize: "0.8rem", marginTop: "8px" }}>
                ⚠️ <strong>Ajuste al Piso:</strong> El IBC (40%) era menor al mínimo legal. Se ajustó a 1 SMMLV ({formatCOP(C.SMMLV)} mensual / {formatCOP(C.SMMLV * 12)} anual).
              </div>
            )}
            {calculos.noLaborales.ibcAdjusted && calculos.noLaborales.ibcType === "techo" && (
              <div style={{ gridColumn: "span 3", padding: "10px", backgroundColor: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "8px", color: "#f59e0b", fontSize: "0.8rem", marginTop: "8px" }}>
                ⚠️ <strong>Ajuste al Techo:</strong> El IBC superó el límite máximo legal. Se ajustó a 25 SMMLV ({formatCOP(C.SMMLV * 25)} mensual / {formatCOP(C.SMMLV * 25 * 12)} anual).
              </div>
            )}
            
            <div>IBC (40%): {calculos.noLaborales.ibcAdjusted && <span title={`Ajustado por ${calculos.noLaborales.ibcType}`}>⚠️</span>}</div>
            <div style={{ textAlign: "right" }}>{formatCOP(calculos.noLaborales.ibcMes)}</div>
            <div style={{ textAlign: "right" }}>{formatCOP(calculos.noLaborales.ibcAnual)}</div>
            
            <div style={{ color: "#f87171" }}>(-) Salud (12.5%):</div>
            <div style={{ textAlign: "right", color: "#f87171" }}>{formatCOP(calculos.noLaborales.saludMes)}</div>
            <div style={{ textAlign: "right", color: "#f87171" }}>{formatCOP(calculos.noLaborales.saludAnual)}</div>
            
            <div style={{ color: "#f87171" }}>(-) Pensión (16%):</div>
            <div style={{ textAlign: "right", color: "#f87171" }}>{formatCOP(calculos.noLaborales.pensionMes)}</div>
            <div style={{ textAlign: "right", color: "#f87171" }}>{formatCOP(calculos.noLaborales.pensionAnual)}</div>

            {calculos.noLaborales.fspMes > 0 && (
              <>
                <div style={{ color: "#f87171" }}>(-) FSP ({((calculos.noLaborales.fspMes / calculos.noLaborales.ibcMes) * 100).toFixed(1)}% s/ IBC):</div>
                <div style={{ textAlign: "right", color: "#f87171" }}>{formatCOP(calculos.noLaborales.fspMes)}</div>
                <div style={{ textAlign: "right", color: "#f87171" }}>{formatCOP(calculos.noLaborales.fspAnual)}</div>
              </>
            )}
            
            <div style={{ borderTop: "1px solid #334155", paddingTop: "4px", fontWeight: 700, color: "#34d399" }}>(=) Neto DIAN (Renta):</div>
            <div style={{ textAlign: "right", borderTop: "1px solid #334155", paddingTop: "4px", fontWeight: 700, color: "#34d399" }}>{formatCOP(noLaborales.bruto - calculos.noLaborales.costosDIANMes - calculos.noLaborales.saludMes - calculos.noLaborales.pensionMes - calculos.noLaborales.fspMes)}</div>
            <div style={{ textAlign: "right", borderTop: "1px solid #334155", paddingTop: "4px", fontWeight: 700, color: "#34d399" }}>{formatCOP((noLaborales.bruto - calculos.noLaborales.costosDIANMes - calculos.noLaborales.saludMes - calculos.noLaborales.pensionMes - calculos.noLaborales.fspMes) * 12)}</div>
          </div>
        </details>

        {/* 3. BLOQUE DE DEDUCCIONES Y OPTIMIZACIÓN */}
        <div className="section-box">
          <h3 style={{ color: "#38bdf8", marginBottom: "16px", fontSize: "1.2rem", fontWeight: 700 }}>Deducciones y Optimización</h3>
          
          <div className="input-group">
            <MoneyInput 
              id="deduc-prepagada"
              label="Medicina Prepagada (Tope 16 UVT/mes)"
              value={deducciones.prepagada}
              onChange={(v) => setDeducciones({ ...deducciones, prepagada: v })}
            />
            <MoneyInput 
              id="deduc-vivienda"
              label="Intereses de Vivienda (Tope 100 UVT/mes)"
              value={deducciones.interesesVivienda}
              onChange={(v) => setDeducciones({ ...deducciones, interesesVivienda: v })}
            />
          </div>

          <div className="input-group">
            <MoneyInput 
              id="deduc-afc"
              label="Aportes AFC / FPV"
              value={deducciones.afc}
              onChange={(v) => setDeducciones({ ...deducciones, afc: v })}
            />
            <div style={{ marginTop: "12px" }}>
              <DependientesInput value={numDependientes} onChange={setNumDependientes} />
            </div>
          </div>

          <div className="input-group">
            <div className="input-field">
              <label htmlFor="rentabilidad-esperada">Rentabilidad Esperada de tus Inversiones Propias (%)</label>
              <input
                id="rentabilidad-esperada"
                type="number"
                value={rentabilidadEsperada}
                onChange={(e) => setRentabilidadEsperada(parseFloat(e.target.value) || 0)}
                placeholder="10"
                style={{ background: "#1e293b", color: "#f8fafc", border: "1px solid #334155", borderRadius: "4px", padding: "8px" }}
              />
            </div>
            <MoneyInput 
              id="deduc-factura"
              label="Compras con Factura Electrónica (Anual)"
              value={deducciones.factura}
              onChange={(v) => setDeducciones({ ...deducciones, factura: v })}
            />
            <div className="tip-text" style={{ marginTop: "-8px", marginBottom: "8px", fontSize: "0.7rem" }}>
              ↳ Se deduce el 1% de las compras (Art. 336 E.T.), máx {formatCOP(240 * C.UVT)}/año.
            </div>
          </div>


        </div>

        {/* GANANCIAS OCASIONALES (Mantenido para no perder funcionalidad) */}
        <details className="section-box">
          <summary className="accordion-header">
            <span>Ganancias Ocasionales</span>
            <span>👇</span>
          </summary>
          <div style={{ marginTop: "12px" }}>
            <div className="input-group">
              <div className="input-field">
                <label>Tipo de Activo</label>
                <input 
                  type="text" 
                  value={nuevoActivo.tipo} 
                  onChange={(e) => setNuevoActivo({ ...nuevoActivo, tipo: e.target.value })}
                  placeholder="Ej: Casa, Acciones BVC"
                />
              </div>
              <MoneyInput 
                id="activo-utilidad"
                label="Utilidad (Ganancia)"
                value={nuevoActivo.utilidad}
                onChange={(v) => setNuevoActivo({ ...nuevoActivo, utilidad: v })}
              />
            </div>
            
            <div className="toggle-group">
              <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>¿Fue en la BVC?</span>
              <button 
                className={`toggle-btn ${nuevoActivo.esBVC ? "active" : ""}`}
                onClick={() => setNuevoActivo({ ...nuevoActivo, esBVC: true })}
              >Sí</button>
              <button 
                className={`toggle-btn ${!nuevoActivo.esBVC ? "active" : ""}`}
                onClick={() => setNuevoActivo({ ...nuevoActivo, esBVC: false })}
              >No</button>
            </div>

            <div className="input-field" style={{ marginTop: "12px" }}>
              <label>Tiempo de Posesión (Años)</label>
              <input 
                type="number" 
                value={nuevoActivo.tiempo} 
                onChange={(e) => setNuevoActivo({ ...nuevoActivo, tiempo: Number(e.target.value) })}
              />
            </div>

            <button className="btn-add" onClick={() => {
              setGananciasOcasionales([...gananciasOcasionales, nuevoActivo]);
              setNuevoActivo({ tipo: "", utilidad: 0, esBVC: false, tiempo: 0 });
            }}>Agregar Activo</button>

            {gananciasOcasionales.length > 0 && (
              <div style={{ marginTop: "16px" }}>
                <h5 style={{ color: "#e2e8f0" }}>Activos Agregados:</h5>
                <ul style={{ fontSize: "0.85rem", color: "#94a3b8", paddingLeft: "16px" }}>
                  {gananciasOcasionales.map((g, index) => (
                    <li key={index}>
                      {g.tipo}: {formatCOP(g.utilidad)} | BVC: {g.esBVC ? "Sí" : "No"} | {g.tiempo} años
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </details>
      </div>

      {/* ── COLUMNA SECUNDARIA (STICKY SIDEBAR) ─────────────────── */}
      <div className="sidebar">
        <h3 style={{ color: "#38bdf8", marginBottom: "20px", fontSize: "1.2rem", fontWeight: 800 }}>Resumen de Liquidación</h3>
        
        <div className="result-row">
          <span>(+) Ingresos Brutos Totales:</span>
          <span className="result-value">{formatCOP(calculos.ingresosBrutosTotales)}</span>
        </div>
        
        <div className="result-row" style={{ color: "#f87171" }}>
          <span>(-) Ingresos No Constitutivos (Salud/Pens/FSP):</span>
          <span className="result-value">{formatCOP(calculos.incrTotales)}</span>
        </div>
        
        <div className="result-row" style={{ color: "#f87171" }}>
          <span>(-) Costos DIAN Reales (Hon/Cap/NoLab):</span>
          <span className="result-value">{formatCOP(calculos.costosTotalesDIANAnual)}</span>
        </div>
        
        <div className="result-row">
          <span>(=) Renta Líquida:</span>
          <span className="result-value">{formatCOP(calculos.rentaLiquidaTotal)}</span>
        </div>
        
        <div className="result-row" style={{ color: "#f87171" }}>
          <span>(-) Deducciones Aplicadas (Topadas al 40% o 1340 UVT):</span>
          <span className="result-value">{formatCOP(calculos.deduccionesLimitadas)}</span>
        </div>
        <div style={{ paddingLeft: "16px", fontSize: "0.85rem", color: "#94a3b8", marginBottom: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>↳ Renta Exenta Laboral (25%):</span>
            <span>{formatCOP(calculos.rentaExentaLaboralAnual)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>↳ Dependientes (10% Laboral):</span>
            <span>{formatCOP(calculos.deduccionDependientes387Anual)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>↳ Medicina Prepagada:</span>
            <span>{formatCOP(calculos.deduccionPrepagadaAnual)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>↳ Intereses de Vivienda:</span>
            <span>{formatCOP(calculos.deduccionViviendaAnual)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>↳ Aportes AFC/FPV:</span>
            <span>{formatCOP(calculos.aportesAFCAnual)}</span>
          </div>
        </div>

        <div className="result-row" style={{ color: "#f87171" }}>
          <span>(-) Deducción Dependientes (Fuera Tope):</span>
          <span className="result-value">{formatCOP(calculos.deduccionDependientes336)}</span>
        </div>
        
        <div className="result-row" style={{ borderTop: "1px solid #334155", paddingTop: "8px" }}>
          <span>(=) Base Gravable Final:</span>
          <span className="result-value" style={{ color: "#38bdf8" }}>{formatCOP(calculos.baseGravable)}</span>
        </div>

        <div className="result-row">
          <span>Impuesto Cédula General:</span>
          <span className="result-value">{formatCOP(calculos.impuestoCedulaGeneral)}</span>
        </div>

        <div className="result-row">
          <span>Impuesto G. Ocasionales:</span>
          <span className="result-value">{formatCOP(calculos.impuestoGananciasOcasionales)}</span>
        </div>

        <div className="result-row">
          <span>Retenciones Practicadas:</span>
          <span className="result-value" style={{ color: "#34d399" }}>{formatCOP(calculos.retencionesTotales)}</span>
        </div>

        <div className="total-box">
          <div style={{ fontSize: "0.9rem", color: "#94a3b8" }}>Saldo Final:</div>
          <div className="total-value" style={{ color: calculos.saldoFinal > 0 ? "#ef4444" : "#10b981" }}>
            {formatCOP(Math.abs(calculos.saldoFinal))}
            <div style={{ fontSize: "0.8rem", marginTop: "4px" }}>
              {calculos.saldoFinal > 0 ? "A Pagar 😡" : "A Favor 🤑"}
            </div>
          </div>
        </div>

        <div className="optimization-box" style={{ marginTop: "16px", background: "#1e293b", padding: "16px", borderRadius: "8px", border: "1px solid #334155" }}>
          <h4 style={{ color: "#06b6d4", marginBottom: "8px", fontWeight: 700 }}>💡 Optimización AFC / FPV</h4>
          
          {/* Sunk Cost Analysis */}
          <p style={{ fontSize: "0.9rem", color: "#e2e8f0", marginBottom: "12px", borderLeft: "4px solid #06b6d4", paddingLeft: "8px" }}>
            💡 Eficiencia Proactiva: Antes de inmovilizar capital en AFC, considera que los aportes a Medicina Prepagada o Intereses de Vivienda reducen tu impuesto con dinero que ya &apos;gastas&apos; mensualmente. Esto libera tu flujo de caja para inversiones líquidas.
          </p>

          <p style={{ fontSize: "0.9rem", color: "#e2e8f0" }}>
            Si inviertes el tope legal de <span style={{ fontWeight: 700, color: "#34d399" }}>{formatCOP(calculos.cupoDisponible)}</span> al año (<span style={{ fontWeight: 700, color: "#22c55e" }}>{formatCOP(calculos.cupoDisponible / 12)} / mes</span>) en un fondo AFC/FPV, tu impuesto proyectado bajaría a <span style={{ fontWeight: 700, color: "#38bdf8" }}>{formatCOP(calculos.impuestoOptimizado)}</span>.
          </p>
          
          {/* Dynamic Breakeven Analysis */}
          <p style={{ fontSize: "0.9rem", color: "#e2e8f0", marginTop: "8px" }}>
            {rentabilidadEsperada / 100 > calculos.rentabilidadBreakevenAnual ? (
              <span>Si tu inversión propia rinde más del {(calculos.rentabilidadBreakevenAnual * 100).toFixed(2)}% anual, podría ser financieramente mejor pagar el impuesto hoy y mantener la liquidez para invertir libremente en bolsa, en lugar de inmovilizar el dinero a 10 años en un FPV.</span>
            ) : (
              <span>Financieramente es mejor invertir en AFC/FPV, ya que tu rentabilidad esperada ({rentabilidadEsperada}%) es menor al breakeven del {(calculos.rentabilidadBreakevenAnual * 100).toFixed(2)}% anual que otorga el beneficio tributario.</span>
            )}
          </p>

          <div style={{ marginTop: "12px", padding: "12px", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(6, 182, 212, 0.2)", borderRadius: "8px", fontSize: "0.75rem", color: "#cbd5e1", lineHeight: "1.45" }}>
            <span style={{ color: "#06b6d4", fontWeight: 700, display: "block", marginBottom: "4px" }}>🔍 Entendiendo el Algebra de la Tasa de Equilibrio ({(calculos.rentabilidadBreakevenAnual * 100).toFixed(2)}%):</span>
            <p style={{ margin: 0 }}>
              Representa el <strong>costo de oportunidad</strong> de tu liquidez a 10 años (tiempo de permanencia legal del beneficio). Si decides NO aportar a la AFC para invertir libremente en bolsa, la DIAN te retendrá hoy el <strong>{(calculos.tramoMarginal * 100).toFixed(0)}%</strong> en tu tarifa marginal, dejando solo el <strong>{((1 - calculos.tramoMarginal) * 100).toFixed(0)}%</strong> de tu capital neto disponible.
              <br /><br />
              Para que una inversión líquida compense esa pérdida tributaria de entrada frente a un fondo exento de retención (asumiendo un rendimiento estándar de FPV del 7.00% anual), tu portafolio personal en bolsa está obligado a rentar por encima del <strong>{(calculos.rentabilidadBreakevenAnual * 100).toFixed(2)}% anual compuesto</strong> durante una década. Si tu estrategia no supera este umbral, es fiscalmente óptimo acogerse al blindaje de la cuenta AFC.
            </p>
          </div>

          <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "8px" }}>
            {(() => {
              const limite40 = calculos.rentaLiquidaTotal * 0.40;
              const limite1340 = 1340 * C.UVT;
              const usoTope1340 = limite40 > limite1340;
              
              return usoTope1340 ? (
                <span>
                  Fórmula del tope legal: Como el 40% de tu renta ({formatCOP(limite40)}) supera el máximo legal permitido de 1.340 UVT ({formatCOP(limite1340)}), se aplica este último tope. <br />
                  Tope de {formatCOP(limite1340)} - Deducciones ya aplicadas ({formatCOP(calculos.deduccionesSujetas)}) = Cupo Disponible.
                </span>
              ) : (
                <span>
                  Fórmula del tope legal: (Renta Líquida de {formatCOP(calculos.rentaLiquidaTotal)} × 40% = {formatCOP(limite40)}) - Deducciones ya aplicadas ({formatCOP(calculos.deduccionesSujetas)}) = Cupo Disponible.
                </span>
              );
            })()}
          </p>
          <div style={{ marginTop: "12px", background: "rgba(52, 211, 153, 0.1)", border: "1px solid rgba(52, 211, 153, 0.2)", borderRadius: "4px", padding: "8px", textAlign: "center", fontWeight: 700, color: "#34d399" }}>
            🔥 TU AHORRO TRIBUTARIO NETO: {formatCOP(calculos.ahorroNeto)} / año.
          </div>

          {/* Housing Warning */}
          {deducciones.interesesVivienda > 0 && (
            <p style={{ fontSize: "0.85rem", color: "#f87171", marginTop: "12px", borderTop: "1px solid #334155", paddingTop: "8px" }}>
              ⚠️ Nota de Analista: Estás pagando {formatCOP(deducciones.interesesVivienda * 12)} en intereses. Aunque te ahorran {formatCOP(deducciones.interesesVivienda * 12 * calculos.tramoMarginal)} en impuestos, el costo neto de tu deuda es del {(calculos.costoNetoDeuda * 100).toFixed(2)}%. Asegúrate de que la valorización de tu activo compense este spread negativo.
            </p>
          )}

          {/* Comparison Table */}
          <div style={{ marginTop: "16px", borderTop: "1px solid #334155", paddingTop: "12px" }}>
            <h5 style={{ color: "#e2e8f0", marginBottom: "8px" }}>Comparativa de Estrategias</h5>
            <table style={{ width: "100%", fontSize: "0.8rem", color: "#94a3b8" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #334155" }}>
                  <th style={{ textAlign: "left", padding: "4px" }}>Acción</th>
                  <th style={{ textAlign: "left", padding: "4px" }}>Impacto en Impuesto</th>
                  <th style={{ textAlign: "left", padding: "4px" }}>Impacto en Liquidez</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "4px" }}>Aporte AFC</td>
                  <td style={{ padding: "4px", color: "#f87171" }}>- {formatCOP(calculos.ahorroNeto)}</td>
                  <td style={{ padding: "4px" }}>Inmovilizado 10 años</td>
                </tr>
                <tr>
                  <td style={{ padding: "4px" }}>Pago Impuesto + Bolsa</td>
                  <td style={{ padding: "4px" }}>$ 0</td>
                  <td style={{ padding: "4px", color: "#34d399" }}>100% Líquido</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>


        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "20px", textAlign: "center" }}>
          UVT {anio}: {formatCOP(C.UVT)} | Tarifa Marginal: {Math.round(calculos.tramoMarginal * 100)}%
        </div>
      </div>
    </div>
  );
}
