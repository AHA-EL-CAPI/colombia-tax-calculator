"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { brokers, calcularComision } from '../lib/brokers-data';

export default function CompareBrokers() {
  const [montoStr, setMontoStr] = useState<string>('1000000');
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [openSource, setOpenSource] = useState<string | null>(null);

  const toggleSource = (id: string) => setOpenSource(openSource === id ? null : id);
  const monto = Number(montoStr);

  // 1. Calcular para el monto dado
  const resultados = useMemo(() => {
    return brokers.map(broker => ({
      broker,
      resultado: calcularComision(monto, broker, 'compra')
    }));
  }, [monto]);

  // Tipado estricto para TS
  type ResultadoExitoso = { error: false, costoBase: number, costoFinal: number, costo_suscripcion: number, notas_adicionales: string | null };
  const validResultados = resultados.filter(r => !r.resultado.error) as { broker: typeof brokers[0], resultado: ResultadoExitoso }[];

  let ganador = null;
  if (validResultados.length > 0) {
    ganador = validResultados.reduce((prev, curr) => {
      const totalPrev = prev.resultado.costoFinal + prev.resultado.costo_suscripcion;
      const totalCurr = curr.resultado.costoFinal + curr.resultado.costo_suscripcion;
      return (totalCurr < totalPrev) ? curr : prev;
    });
  }

  // 2. Generar saltos para la matriz
  const saltos = useMemo(() => {
    const s = [];
    for (let i = 100000; i <= 1000000; i += 100000) s.push(i);
    for (let i = 1500000; i <= 5000000; i += 500000) s.push(i);
    for (let i = 6000000; i <= 10000000; i += 1000000) s.push(i);
    for (let i = 15000000; i <= 50000000; i += 5000000) s.push(i);
    return s;
  }, []);

  const formatCOP = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tableRef.current && !tableRef.current.contains(event.target as Node)) {
        setSelectedRow(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full flex flex-col items-center font-sans">
      <div className="w-full max-w-6xl space-y-8">

        {/* SIMULADOR INTERACTIVO */}
        <section className="bg-gray-800 rounded-2xl p-6 md:p-8 border border-gray-700 shadow-2xl flex flex-col items-center text-center">
          <h2 className="text-2xl font-bold text-white mb-6">Comparador Brokers ≡ƒôê</h2>
          <div className="mb-8 w-full flex flex-col items-center">
            <label className="block text-sm font-medium text-gray-400 mb-2">Monto a Invertir (COP)</label>
            <div className="relative flex items-center justify-center w-full max-w-md">
              <span className="absolute left-4 text-emerald-400 font-bold text-xl">$</span>
              <input
                type="text"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-center font-mono text-2xl tracking-wider"
                value={montoStr ? new Intl.NumberFormat('es-CO').format(Number(montoStr)) : ''}
                onChange={(e) => setMontoStr(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>

          {ganador ? (
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 md:p-8 border border-gray-700 relative overflow-hidden shadow-lg">
              <div className="absolute -top-4 -right-4 p-8 text-8xl opacity-5 transform rotate-12">≡ƒÅå</div>
              <h3 className="text-sm tracking-wider uppercase text-blue-400 font-bold mb-2">Ganador Recomendado</h3>
              <div className="text-3xl md:text-4xl font-bold text-white mb-6">{ganador.broker.nombre}</div>

              <div className="flex flex-wrap gap-8 mb-6">
                <div>
                  <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">Costo Total Neto</div>
                  <div className="text-3xl font-mono text-green-400 font-semibold">{formatCOP(ganador.resultado.costoFinal + ganador.resultado.costo_suscripcion)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">Impacto</div>
                  <div className="text-3xl font-mono text-blue-400 font-semibold">
                    {(((ganador.resultado.costoFinal + ganador.resultado.costo_suscripcion) / monto) * 100).toFixed(2)}%
                  </div>
                </div>
              </div>

              {ganador.resultado.costo_suscripcion > 0 && (
                <div className="mt-6 bg-red-900/20 border border-red-900/50 rounded-lg p-4 flex flex-col gap-2">
                  <span className="flex items-center gap-2 text-red-400 font-bold">
                    ΓÜá∩╕Å M├ís mensualidad de {formatCOP(ganador.resultado.costo_suscripcion)}
                  </span>
                  {ganador.resultado.notas_adicionales && (
                    <span className="text-red-300/80 text-sm leading-relaxed">{ganador.resultado.notas_adicionales}</span>
                  )}
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-700/50 text-sm text-gray-400 flex items-start gap-2">
                <span className="text-xl">≡ƒÆí</span>
                <p>Nota: El monto m├¡nimo requerido para futuras ventas en esta plataforma es de <strong className="text-gray-300">{formatCOP(ganador.broker.monto_minimo_venta)}</strong> COP.</p>
              </div>
            </div>
          ) : (
            <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-6 text-red-400 text-center font-medium">
              El monto ingresado es menor al m├¡nimo de compra requerido por todos los brokers disponibles.
            </div>
          )}
        </section>

        {/* MATRIZ DE COMISIONES */}
        <section className="bg-gray-800 rounded-2xl p-6 md:p-8 border border-gray-700 shadow-2xl overflow-x-auto">
          <h2 className="text-xl font-bold text-white mb-6">Matriz Comparativa de Comisiones</h2>
          <div ref={tableRef} className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm whitespace-nowrap min-w-max">
              <thead>
                <tr className="border-b border-gray-700 divide-x divide-gray-600">
                  <th className="py-4 !px-8 whitespace-nowrap font-semibold text-gray-400 uppercase tracking-wider text-xs">Monto</th>
                  {brokers.map(b => (
                    <th key={b.id + '-nom'} className="py-4 !px-8 whitespace-nowrap font-semibold text-gray-400 uppercase tracking-wider text-xs text-right">
                      {b.nombre} ($) {b.costo_suscripcion_mensual ? '*' : ''}
                    </th>
                  ))}
                  {brokers.map(b => (
                    <th key={b.id + '-pct'} className="py-4 !px-8 whitespace-nowrap font-semibold text-gray-400 uppercase tracking-wider text-xs text-right">
                      {b.nombre} (%) {b.costo_suscripcion_mensual ? '*' : ''}
                    </th>
                  ))}
                  <th className="py-4 !px-8 whitespace-nowrap font-semibold text-gray-400 uppercase tracking-wider text-xs pl-8">≡ƒÅå Ganador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {saltos.map((m) => {
                  const filaResultados = brokers.map(b => ({
                    broker: b,
                    res: calcularComision(m, b, 'compra')
                  }));
                  const filaValidos = filaResultados.filter(r => !r.res.error) as { broker: typeof brokers[0], res: ResultadoExitoso }[];
                  const ganadorFila = filaValidos.length > 0 ? filaValidos.reduce((prev, curr) => {
                    const totalPrev = prev.res.costoFinal + prev.res.costo_suscripcion;
                    const totalCurr = curr.res.costoFinal + curr.res.costo_suscripcion;
                    return (totalCurr < totalPrev) ? curr : prev;
                  }) : null;

                  return (
                    <tr
                      key={m}
                      className={`divide-x divide-gray-600 transition-all cursor-pointer ${selectedRow === m ? 'bg-gray-700 ring-2 ring-inset ring-blue-500 shadow-lg relative z-10' : 'bg-transparent hover:bg-gray-700/60'}`}
                      onClick={() => setSelectedRow(selectedRow === m ? null : m)}
                    >
                      <td className="py-3 !px-8 whitespace-nowrap font-mono text-gray-300 font-medium">{formatCOP(m)}</td>
                      {filaResultados.map(({ broker, res }) => {
                        if (res.error) {
                          return <td key={broker.id + '-nom'} className="py-3 !px-8 whitespace-nowrap text-right text-gray-600 font-mono text-xs">N/A</td>;
                        }
                        const r = res as ResultadoExitoso;
                        const isWinner = ganadorFila?.broker.id === broker.id;
                        return (
                          <td key={broker.id + '-nom'} className={`py-3 !px-8 whitespace-nowrap text-right font-mono ${isWinner ? 'text-green-400 font-bold' : 'text-gray-400'}`}>
                            {formatCOP(r.costoFinal + r.costo_suscripcion)}
                          </td>
                        );
                      })}
                      {filaResultados.map(({ broker, res }) => {
                        if (res.error) {
                          return <td key={broker.id + '-pct'} className="py-3 !px-8 whitespace-nowrap text-right text-gray-600 font-mono text-xs">N/A</td>;
                        }
                        const r = res as ResultadoExitoso;
                        const p = (((r.costoFinal + r.costo_suscripcion) / m) * 100).toFixed(2);
                        const isWinner = ganadorFila?.broker.id === broker.id;
                        return (
                          <td key={broker.id + '-pct'} className={`py-3 !px-8 whitespace-nowrap text-right font-mono ${isWinner ? 'text-green-400 font-bold' : 'text-gray-400'}`}>
                            {p}%
                          </td>
                        );
                      })}
                      <td className="py-3 !px-8 whitespace-nowrap pl-8">
                        {ganadorFila ? (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold shadow-sm border
                            ${ganadorFila.broker.nombre.toLowerCase().includes('trii') ? 'bg-green-900/20 text-green-400 border-green-800/50' :
                              ganadorFila.broker.nombre.toLowerCase().includes('bancolombia') ? 'bg-yellow-900/20 text-yellow-400 border-yellow-800/50' :
                                'bg-blue-900/20 text-blue-400 border-blue-800/50'}`}
                          >
                            {ganadorFila.broker.nombre}
                          </span>
                        ) : (
                          <span className="text-gray-600 text-xs font-medium">N/A</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* DISCLAIMER */}
        <div className="text-xs text-gray-400 bg-gray-800/50 p-4 rounded-xl border border-gray-700 mt-6 mb-8 space-y-2 leading-relaxed">
          <p>
            <span className="text-yellow-500 font-bold">ΓÜá∩╕Å Nota sobre tarifas:</span> Los valores calculados corresponden a comisiones de corretaje con IVA incluido. (*) Indica plataformas con costo de suscripci├│n mensual independiente.
          </p>
          <p>
            <span className="text-blue-400 font-bold">≡ƒÆí Realidad de ejecuci├│n en la BVC:</span> En el mercado colombiano no es posible comprar fracciones de acciones. El monto exacto invertido ser├í una aproximaci├│n basada en el precio de mercado del activo multiplicada por unidades enteras. Adem├ís, la falta de liquidez en ciertos activos genera un <span className="italic">spread</span> (diferencia entre puntas de compra y venta) que representa un costo impl├¡cito no reflejado aqu├¡.
          </p>
          <p>
            <span className="text-red-400 font-bold">≡ƒÅ¢∩╕Å Impacto Tributario (Brokers Internacionales):</span> Las inversiones en plataformas extranjeras (como IBKR) no gozan del beneficio tributario de la BVC (Art. 36-1 E.T.). Si vendes acciones con menos de 2 a├▒os de tenencia, la utilidad entra a tu C├⌐dula General tributando a la tarifa marginal progresiva. Si mantienes la inversi├│n por m├ís de 2 a├▒os ininterrumpidos, tributar├í como Ganancia Ocasional al 15%.
          </p>
        </div>

        {/* FUENTES Y METODOLOG├ìA */}
        <section className="bg-gray-800 rounded-2xl p-6 md:p-8 border border-gray-700 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6">≡ƒôï Fuentes de Informaci├│n y Tarifas Oficiales</h2>

          <div className="space-y-4">
            {/* PANEL 1: Trii */}
            <div className="border border-gray-700 rounded-lg overflow-hidden transition-all">
              <button
                onClick={() => toggleSource('trii')}
                className="w-full bg-gray-800/60 hover:bg-gray-800 px-6 py-4 flex justify-between items-center text-left transition-colors"
              >
                <span className="font-semibold text-gray-200">Trii (B├ísico y Pro)</span>
                <span className="text-gray-400">{openSource === 'trii' ? 'Γû▓' : 'Γû╝'}</span>
              </button>
              {openSource === 'trii' && (
                <div className="p-6 bg-gray-900 border-t border-gray-700 text-sm text-gray-300 space-y-6">
                  <div>
                    <h3 className="font-semibold text-white mb-3">Tarifas Generales (B├ísico)</h3>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="py-2 px-4 text-gray-400 font-medium">Monto</th>
                          <th className="py-2 px-4 text-gray-400 font-medium">Comisi├│n (Sin IVA)</th>
                          <th className="py-2 px-4 text-gray-400 font-medium">Comisi├│n (Con IVA)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        <tr><td className="py-2 px-4">Hasta $2.000.000</td><td className="py-2 px-4">$11.900</td><td className="py-2 px-4">$14.161</td></tr>
                        <tr><td className="py-2 px-4">De $2.000.001 a $5.000.000</td><td className="py-2 px-4">$14.900</td><td className="py-2 px-4">$17.731</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-3">Operaciones &gt; $5.000.000</h3>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="py-2 px-4 text-gray-400 font-medium">Porcentaje (Sin IVA)</th>
                          <th className="py-2 px-4 text-gray-400 font-medium">Porcentaje (Con IVA)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td className="py-2 px-4">0.2%</td><td className="py-2 px-4">0.238%</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-blue-900/20 border border-blue-800/50 p-4 rounded-lg">
                    <p className="text-blue-300 text-sm">
                      <strong>Trii Pro:</strong> Aplica un 50% de descuento sobre todas las tarifas base (tanto montos fijos como porcentajes) a cambio de una suscripci├│n mensual de $34.900.
                    </p>
                  </div>
                  <a href="https://trii.co/" target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors border border-gray-600">
                    Visitar Trii.co Γåù
                  </a>
                </div>
              )}
            </div>

            {/* PANEL 2: Bancolombia */}
            <div className="border border-gray-700 rounded-lg overflow-hidden transition-all">
              <button
                onClick={() => toggleSource('bancolombia')}
                className="w-full bg-gray-800/60 hover:bg-gray-800 px-6 py-4 flex justify-between items-center text-left transition-colors"
              >
                <span className="font-semibold text-gray-200">Valores Bancolombia (eTrading)</span>
                <span className="text-gray-400">{openSource === 'bancolombia' ? 'Γû▓' : 'Γû╝'}</span>
              </button>
              {openSource === 'bancolombia' && (
                <div className="p-6 bg-gray-900 border-t border-gray-700 text-sm text-gray-300 space-y-6">
                  <div>
                    <h3 className="font-semibold text-white mb-3">Promoci├│n Actual</h3>
                    <ul className="list-disc pl-5 space-y-2 text-gray-300 mb-4">
                      <li>Montos entre $200.000 y $10.000.000: Tarifa plana de $20.000 + IVA.</li>
                      <li>Montos mayores a $10.000.000: 0.2% + IVA.</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-3">Tarifa Est├índar</h3>
                    <ul className="list-disc pl-5 space-y-2 text-gray-300 mb-4">
                      <li>Monto m├¡nimo de compra: $1.000.000 | Monto m├¡nimo de venta: $500.000.</li>
                      <li>Operaciones hasta $16.666.666: Tarifa plana de $50.000 + IVA.</li>
                      <li>Operaciones mayores a $16.666.666: 0.3% + IVA.</li>
                    </ul>
                  </div>
                  <a href="https://www.bancolombia.com/personas/inversiones/etrading" target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors border border-gray-600">
                    Visitar eTrading Bancolombia Γåù
                  </a>
                </div>
              )}
            </div>

            {/* PANEL 3: Davivienda */}
            <div className="border border-gray-700 rounded-lg overflow-hidden transition-all">
              <button
                onClick={() => toggleSource('davivienda')}
                className="w-full bg-gray-800/60 hover:bg-gray-800 px-6 py-4 flex justify-between items-center text-left transition-colors"
              >
                <span className="font-semibold text-gray-200">Davivienda Corredores (Homebroker)</span>
                <span className="text-gray-400">{openSource === 'davivienda' ? 'Γû▓' : 'Γû╝'}</span>
              </button>
              {openSource === 'davivienda' && (
                <div className="p-6 bg-gray-900 border-t border-gray-700 text-sm text-gray-300 space-y-6">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="py-2 px-4 text-gray-400 font-medium">Rango de Operaci├│n</th>
                        <th className="py-2 px-4 text-gray-400 font-medium">Comisi├│n (Sin IVA)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      <tr><td className="py-2 px-4">De $1.000.000 a $20.000.000</td><td className="py-2 px-4">$60.000 tarifa fija</td></tr>
                      <tr><td className="py-2 px-4">De $20.000.001 a $50.000.000</td><td className="py-2 px-4">0.3% sobre el monto</td></tr>
                      <tr><td className="py-2 px-4">Mayores a $50.000.000</td><td className="py-2 px-4">0.2% sobre el monto</td></tr>
                    </tbody>
                  </table>
                  <a href="https://www.daviviendacorredores.com/nuestras-plataformas/" target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors border border-gray-600">
                    Visitar Homebroker Davivienda Γåù
                  </a>
                </div>
              )}
            </div>

            {/* PANEL 4: Interactive Brokers (v├¡a Plenti) */}
            <div className="border border-gray-700 rounded-lg overflow-hidden transition-all">
              <button
                onClick={() => toggleSource('ibkr')}
                className="w-full bg-gray-800/60 hover:bg-gray-800 px-6 py-4 flex justify-between items-center text-left transition-colors"
              >
                <span className="font-semibold text-gray-200">Interactive Brokers (v├¡a Plenti)</span>
                <span className="text-gray-400">{openSource === 'ibkr' ? 'Γû▓' : 'Γû╝'}</span>
              </button>
              {openSource === 'ibkr' && (
                <div className="p-6 bg-gray-900 border-t border-gray-700 text-sm text-gray-300 space-y-6">
                  <div>
                    <h3 className="font-semibold text-white mb-3">Estructura de Costos: Env├¡o + Broker</h3>
                    <ul className="list-disc pl-5 space-y-2 text-gray-300 mb-4">
                      <li><strong>Fondeo v├¡a Plenti (ACH):</strong> Costo fijo de $3.00 USD por env├¡o + un spread cambiario estimado del ~1.36% sobre la TRM oficial.</li>
                      <li><strong>Comisi├│n IBKR (Tiered):</strong> Cobra $0.0035 USD por acci├│n, con un cobro m├¡nimo de $0.35 USD por orden.</li>
                      <li><strong>Tasa de Cambio:</strong> El simulador asume una TRM est├ítica conservadora de $3.900 COP para proyectar los cobros fijos en d├│lares.</li>
                      <li><strong>Aviso de Volumen:</strong> La estimaci├│n asume la compra de activos de alto valor (como ETFs o Blue Chips) donde el n├║mero de acciones no supera las 100 unidades, activando ├║nicamente el cobro m├¡nimo de $0.35 USD de IBKR.</li>
                    </ul>
                  </div>
                  <div className="flex gap-4 flex-wrap">
                    <a href="https://www.interactivebrokers.com/en/pricing/commissions-stocks.php" target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors border border-gray-600">
                      Tarifas IBKR Γåù
                    </a>
                    <a href="https://www.plenti.com.co/personas/inversionistas" target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors border border-gray-600">
                      Ver Plenti Γåù
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
