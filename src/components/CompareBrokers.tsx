"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { brokers, calcularComision } from '../lib/brokers-data';

export default function CompareBrokers() {
  const [montoStr, setMontoStr] = useState<string>('1000000');
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [openSource, setOpenSource] = useState<string | null>(null);

  const toggleSource = (id: string) => setOpenSource((current) => (current === id ? null : id));
  const monto = Number(montoStr);

  const resultados = useMemo(() => {
    return brokers.map((broker) => ({
      broker,
      resultado: calcularComision(monto, broker, 'compra')
    }));
  }, [monto]);

  type ResultadoExitoso = {
    error: false;
    costoBase: number;
    costoFinal: number;
    costoTransaccional: number;
    costo_suscripcion: number;
    costoTotal: number;
    notas_adicionales: string | null;
  };

  const validResultados = resultados.filter((r) => !r.resultado.error) as {
    broker: typeof brokers[0];
    resultado: ResultadoExitoso;
  }[];

  let ganador = null;
  if (validResultados.length > 0) {
    ganador = validResultados.reduce((prev, curr) => {
      const totalPrev = prev.resultado.costoFinal + prev.resultado.costo_suscripcion;
      const totalCurr = curr.resultado.costoFinal + curr.resultado.costo_suscripcion;
      return totalCurr < totalPrev ? curr : prev;
    });
  }

  const saltos = useMemo(() => {
    const s = [] as number[];
    for (let i = 100000; i <= 1000000; i += 100000) s.push(i);
    for (let i = 1500000; i <= 5000000; i += 500000) s.push(i);
    for (let i = 6000000; i <= 10000000; i += 1000000) s.push(i);
    for (let i = 15000000; i <= 50000000; i += 5000000) s.push(i);
    return s;
  }, []);

  const formatCOP = (val: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tableRef.current && !tableRef.current.contains(event.target as Node)) {
        setSelectedRow(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full flex flex-col items-center font-sans">
      <div className="w-full max-w-6xl space-y-6">
        <section className="card !p-5 md:!p-8 flex flex-col items-center text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1 tracking-tight">Comparador de brokers</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">Encuentra la plataforma más barata para el monto que quieres invertir.</p>
          <div className="mb-8 w-full flex flex-col items-center">
            <label htmlFor="monto-invertir" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Monto a invertir (COP)</label>
            <div className="relative flex items-center justify-center w-full max-w-md">
              <span className="absolute left-4 text-[var(--accent-emerald)] font-bold text-xl">$</span>
              <input
                id="monto-invertir"
                type="text"
                inputMode="numeric"
                className="tax-input text-center !text-2xl !pl-10"
                value={montoStr ? new Intl.NumberFormat('es-CO').format(Number(montoStr)) : ''}
                onChange={(e) => setMontoStr(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>

          {ganador ? (
            <div className="rounded-xl p-6 md:p-8 border border-[var(--border-accent)] bg-[var(--glow-emerald)] relative overflow-hidden w-full max-w-3xl">
              <h3 className="text-sm font-semibold text-[var(--accent-emerald)] mb-2">Opción más barata</h3>
              <div className="text-2xl md:text-4xl font-bold text-[var(--text-primary)] mb-6 tracking-tight">{ganador.broker.nombre}</div>

              <div className="flex flex-wrap gap-8 mb-6 justify-center">
                <div>
                  <div className="text-xs text-[var(--text-muted)] mb-1">Costo total neto</div>
                  <div className="text-2xl md:text-3xl font-mono text-[var(--accent-emerald)] font-semibold">
                    {formatCOP(ganador.resultado.costoFinal + ganador.resultado.costo_suscripcion)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-muted)] mb-1">Impacto sobre el monto</div>
                  <div className="text-2xl md:text-3xl font-mono text-[var(--text-primary)] font-semibold">
                    {monto > 0 ? (((ganador.resultado.costoFinal + ganador.resultado.costo_suscripcion) / monto) * 100).toFixed(2) : '0.00'}%
                  </div>
                </div>
              </div>

              {ganador.resultado.costo_suscripcion > 0 && (
                <div className="mt-6 bg-[var(--glow-amber)] border border-[var(--accent-amber)]/30 rounded-lg p-4 flex flex-col gap-2">
                  <span className="flex items-center gap-2 text-[var(--accent-amber)] font-bold">
                    Más mensualidad de {formatCOP(ganador.resultado.costo_suscripcion)}
                  </span>
                  {ganador.resultado.notas_adicionales && (
                    <span className="text-[var(--text-secondary)] text-sm leading-relaxed">{ganador.resultado.notas_adicionales}</span>
                  )}
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-[var(--border-color)] text-sm text-[var(--text-secondary)] flex items-start gap-2 justify-center text-left">
                <p>
                  Nota: El monto mínimo requerido para futuras ventas en esta plataforma es de{' '}
                  <strong className="text-[var(--text-primary)]">{formatCOP(ganador.broker.monto_minimo_venta)}</strong> COP.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-[var(--glow-amber)] border border-[var(--accent-amber)]/30 rounded-xl p-6 text-[var(--accent-amber)] text-center font-medium">
              El monto ingresado es menor al mínimo de compra requerido por todos los brokers disponibles.
            </div>
          )}
        </section>

        <section className="card !p-5 md:!p-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Matriz comparativa de comisiones</h2>
          <p className="text-sm text-[var(--text-muted)] mb-5">Costo total por compra (comisión + suscripción) y su peso sobre el monto. Toca una fila para resaltarla.</p>
          <div ref={tableRef} className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="py-3 px-4 whitespace-nowrap font-semibold text-[var(--text-secondary)] text-xs sticky left-0 z-10 bg-[var(--bg-card)]">Monto</th>
                  {brokers.map((b) => (
                    <th key={`${b.id}-nom`} className="py-3 px-4 whitespace-nowrap font-semibold text-[var(--text-secondary)] text-xs text-right">
                      {b.nombre}{b.costo_suscripcion_mensual ? ' *' : ''}
                    </th>
                  ))}
                  <th className="py-3 px-4 whitespace-nowrap font-semibold text-[var(--text-secondary)] text-xs">Más barato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {saltos.map((m) => {
                  const filaResultados = brokers.map((b) => ({
                    broker: b,
                    res: calcularComision(m, b, 'compra')
                  }));
                  const filaValidos = filaResultados.filter((r) => !r.res.error) as {
                    broker: typeof brokers[0];
                    res: ResultadoExitoso;
                  }[];
                  const ganadorFila = filaValidos.length > 0
                    ? filaValidos.reduce((prev, curr) => {
                        const totalPrev = prev.res.costoFinal + prev.res.costo_suscripcion;
                        const totalCurr = curr.res.costoFinal + curr.res.costo_suscripcion;
                        return totalCurr < totalPrev ? curr : prev;
                      })
                    : null;

                  return (
                    <tr
                      key={m}
                      className={`transition-colors cursor-pointer ${selectedRow === m ? 'bg-[var(--bg-card-hover)] ring-2 ring-inset ring-[var(--accent-emerald)]' : 'bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)]'}`}
                      onClick={() => setSelectedRow((current) => (current === m ? null : m))}
                    >
                      <td className="py-2.5 px-4 whitespace-nowrap font-mono text-[var(--text-primary)] font-medium sticky left-0 z-10 bg-inherit">{formatCOP(m)}</td>
                      {filaResultados.map(({ broker, res }) => {
                        if (res.error) {
                          return <td key={`${broker.id}-nom`} className="py-2.5 px-4 whitespace-nowrap text-right text-[var(--text-muted)] font-mono text-xs">N/A</td>;
                        }
                        const r = res as ResultadoExitoso;
                        const total = r.costoFinal + r.costo_suscripcion;
                        const isWinner = ganadorFila?.broker.id === broker.id;
                        return (
                          <td key={`${broker.id}-nom`} className={`py-2.5 px-4 whitespace-nowrap text-right font-mono ${isWinner ? 'text-[var(--accent-emerald)] font-bold' : 'text-[var(--text-secondary)]'}`}>
                            <div>{formatCOP(total)}</div>
                            <div className="text-[0.7rem] opacity-70">{((total / m) * 100).toFixed(2)}%</div>
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        {ganadorFila ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border bg-[var(--glow-emerald)] text-[var(--accent-emerald)] border-[var(--border-accent)]">
                            {ganadorFila.broker.nombre}
                          </span>
                        ) : (
                          <span className="text-[var(--text-muted)] text-xs font-medium">N/A</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <div className="card !p-5 md:!p-6 text-[0.8rem] text-[var(--text-secondary)] space-y-3 leading-relaxed">
          <p>
            <span className="text-[var(--text-primary)] font-semibold">Nota sobre tarifas:</span> Los valores calculados corresponden a comisiones de corretaje con IVA incluido. (*) Indica plataformas con costo de suscripción mensual independiente.
          </p>
          <p>
            <span className="text-[var(--text-primary)] font-semibold">Realidad de ejecución en la BVC:</span> En el mercado colombiano no es posible comprar fracciones de acciones. El monto exacto invertido será una aproximación basada en el precio de mercado del activo multiplicada por unidades enteras. Además, la falta de liquidez en ciertos activos genera un spread que representa un costo implícito no reflejado aquí.
          </p>
          <p>
            <span className="text-[var(--accent-amber)] font-semibold">Impacto tributario (brokers internacionales):</span> Las inversiones en plataformas extranjeras no gozan del beneficio tributario de la BVC. Si vendes acciones con menos de 2 años de tenencia, la utilidad entra a tu Cédula General tributando a la tarifa marginal progresiva. Si mantienes la inversión por más de 2 años ininterrumpidos, tributarás como Ganancia Ocasional al 15%.
          </p>
        </div>

        <section className="card !p-5 md:!p-8">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-5">Fuentes de información y tarifas oficiales</h2>
          <div className="space-y-2">
            {[
              {
                id: 'trii',
                title: 'Trii (Básico y Pro)',
                body: (
                  <div className="space-y-2">
                    <p>Trii aplica comisiones fijas para montos menores a $5.000.000 y tarifas porcentuales por encima de ese umbral.</p>
                    <p>Trii Pro agrega una suscripción mensual y usa una escala más baja para el mismo monto.</p>
                    <p className="text-[var(--accent-emerald)]">Fuente: <a href="https://trii.co/" target="_blank" rel="noreferrer" className="underline">Trii</a></p>
                  </div>
                )
              },
              {
                id: 'bancolombia',
                title: 'Bancolombia eTrading',
                body: (
                  <div className="space-y-2">
                    <p>Bancolombia cobra tarifas fijas o porcentuales según el monto y el plan elegido, con IVA incluido.</p>
                    <p>Se usaron los rangos promocionales y estándar reportados para el comparador.</p>
                    <p className="text-[var(--accent-emerald)]">Fuente: tarifa publicada en la plataforma eTrading de Bancolombia.</p>
                  </div>
                )
              },
              {
                id: 'davivienda',
                title: 'Davivienda Homebroker',
                body: (
                  <div className="space-y-2">
                    <p>Davivienda Homebroker usa una tarifa escalonada por monto y aplica una comisión fija o porcentual según el rango.</p>
                    <p>El comparador refleja la estructura general del tarifario disponible para operaciones en la plataforma.</p>
                    <p className="text-[var(--accent-emerald)]">Fuente: tarifario público de Davivienda Homebroker.</p>
                  </div>
                )
              },
              {
                id: 'xtb',
                title: 'XTB',
                body: (
                  <div className="space-y-2">
                    <p>XTB se modela con un spread estimado de 0,5% sobre el monto y un costo de retiro vía SWIFT conservador.</p>
                    <p>El cálculo incluye el costo adicional de salida, que puede ser relevante en transferencias internacionales.</p>
                    <p className="text-[var(--accent-emerald)]">Fuente: <a href="https://www.xtb.com/lat/centro-de-ayuda/tarifas-y-comisiones" target="_blank" rel="noreferrer" className="underline">XTB tarifas y comisiones</a></p>
                  </div>
                )
              },
              {
                id: 'etoro',
                title: 'eToro',
                body: (
                  <div className="space-y-2">
                    <p>eToro se modela con un costo de conversión de divisa de 3% y un retiro fijo local aproximado.</p>
                    <p>Este costo suele impactar más que la comisión directa en operaciones de montos pequeños y medianos.</p>
                    <p className="text-[var(--accent-emerald)]">Fuente: <a href="https://www.etoro.com/es/trading/fees/conversion/" target="_blank" rel="noreferrer" className="underline">eToro fees and conversion</a></p>
                  </div>
                )
              },
              {
                id: 'hapi',
                title: 'Hapi',
                body: (
                  <div className="space-y-2">
                    <p>Hapi se modela con un costo mínimo de fondeo PSE y un porcentaje adicional sobre la operación.</p>
                    <p>También se incluye el costo fijo asociado a retiro local y la comisión de clearing.</p>
                    <p className="text-[var(--accent-emerald)]">Fuente: <a href="https://help.hapi.trade/en/articles/8976002" target="_blank" rel="noreferrer" className="underline">Hapi help center</a></p>
                  </div>
                )
              }
            ].map((item) => (
              <div key={item.id} className="border border-[var(--border-color)] rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSource(item.id)}
                  aria-expanded={openSource === item.id}
                  className="w-full hover:bg-[var(--bg-card-hover)] px-5 py-3.5 flex justify-between items-center text-left transition-colors cursor-pointer"
                >
                  <span className="font-semibold text-[var(--text-primary)]">{item.title}</span>
                  <span className="text-[var(--text-muted)]">{openSource === item.id ? '−' : '+'}</span>
                </button>
                {openSource === item.id && (
                  <div className="px-5 py-4 bg-[var(--bg-primary)] border-t border-[var(--border-color)] text-sm text-[var(--text-secondary)] leading-relaxed">
                    {item.body}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}