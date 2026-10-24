"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { brokers, calcularComision, type BrokerConfig } from '../lib/brokers-data';

type ResultadoExitoso = {
  error: false;
  costoBase: number;
  costoFinal: number;
  costoTransaccional: number;
  costo_suscripcion: number;
  costoTotal: number;
  notas_adicionales: string | null;
};

// Plataformas que operan en la Bolsa de Valores de Colombia; el resto son internacionales
const BROKERS_LOCALES = new Set(['trii-basico', 'trii-pro', 'bancolombia-promo', 'bancolombia-std', 'davivienda-homebroker']);

const MONTOS_RAPIDOS = [
  { label: '$500 mil', value: 500_000 },
  { label: '$1M', value: 1_000_000 },
  { label: '$5M', value: 5_000_000 },
  { label: '$10M', value: 10_000_000 },
  { label: '$50M', value: 50_000_000 },
];

const formatCOP = (val: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

const costoTotalDe = (r: ResultadoExitoso) => r.costoFinal + r.costo_suscripcion;

function iniciales(nombre: string) {
  return nombre.replace(/\(.*?\)/g, '').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function EtiquetaMercado({ broker }: { broker: BrokerConfig }) {
  const local = BROKERS_LOCALES.has(broker.id);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.68rem] font-semibold border ${
      local
        ? 'text-[var(--accent-emerald)] border-[var(--border-accent)] bg-[var(--glow-emerald)]'
        : 'text-[var(--accent-blue)] border-[var(--accent-blue)]/30 bg-[var(--accent-blue)]/10'
    }`}>
      {local ? 'BVC Colombia' : 'Internacional'}
    </span>
  );
}

function Chevron() {
  return (
    <svg className="chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function CompareBrokers() {
  const [montoStr, setMontoStr] = useState<string>('1000000');
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const monto = Number(montoStr);

  // Ranking ordenado por costo total; los que no alcanzan el mínimo van al final
  const ranking = useMemo(() => {
    const filas = brokers.map((broker) => ({ broker, resultado: calcularComision(monto, broker, 'compra') }));
    const validos = filas
      .filter((f) => !f.resultado.error)
      .map((f) => ({ broker: f.broker, resultado: f.resultado as ResultadoExitoso }))
      .sort((x, y) => costoTotalDe(x.resultado) - costoTotalDe(y.resultado));
    const noDisponibles = filas.filter((f) => f.resultado.error).map((f) => f.broker);
    return { validos, noDisponibles };
  }, [monto]);

  const ganador = ranking.validos[0] ?? null;
  const costoMaximo = ranking.validos.length > 0 ? costoTotalDe(ranking.validos[ranking.validos.length - 1].resultado) : 0;
  const ahorroVsMasCaro = ganador ? costoMaximo - costoTotalDe(ganador.resultado) : 0;

  const saltos = useMemo(() => {
    const s = [] as number[];
    for (let i = 100000; i <= 1000000; i += 100000) s.push(i);
    for (let i = 1500000; i <= 5000000; i += 500000) s.push(i);
    for (let i = 6000000; i <= 10000000; i += 1000000) s.push(i);
    for (let i = 15000000; i <= 50000000; i += 5000000) s.push(i);
    return s;
  }, []);

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

  const fuentes = [
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
      id: 'ibkr',
      title: 'Interactive Brokers (vía Plenti)',
      body: (
        <div className="space-y-2">
          <p>IBKR se modela con el spread de conversión de Plenti (~1,36%), el envío ACH y la comisión mínima Tiered de IBKR, a una TRM de $3.900.</p>
          <p>La versión Standard usa un costo fijo más conservador para compras de gran volumen de acciones baratas.</p>
          <p className="text-[var(--accent-emerald)]">Fuente: <a href="https://www.interactivebrokers.com/en/pricing/commissions-stocks.php" target="_blank" rel="noreferrer" className="underline">IBKR comisiones</a></p>
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
  ];

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full max-w-6xl space-y-6">

        {/* ══ HERO ═══════════════════════════════════════════════ */}
        <div className="text-center pt-2">
          <h1 className="font-extrabold text-[var(--text-primary)] leading-tight tracking-tight mb-3" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.3rem)' }}>
            Comparador de <span className="text-[var(--accent-emerald)]">brokers</span>
          </h1>
          <p className="text-[0.95rem] text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed">
            Escribe cuánto quieres invertir y mira qué plataforma te cobra menos por la compra,
            entre {brokers.length} opciones locales e internacionales.
          </p>
        </div>

        {/* ══ MONTO + GANADOR ════════════════════════════════════ */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-stretch">
          <section className="card !p-6 md:!p-8 flex flex-col justify-center">
            <label htmlFor="monto-invertir" className="field-label">Monto a invertir (COP)</label>
            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--accent-emerald)] font-bold text-xl font-mono">$</span>
              <input
                id="monto-invertir"
                type="text"
                inputMode="numeric"
                className="tax-input !text-2xl !pl-10 !py-4"
                value={montoStr ? new Intl.NumberFormat('es-CO').format(Number(montoStr)) : ''}
                onChange={(e) => setMontoStr(e.target.value.replace(/\D/g, ''))}
                placeholder="0"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {MONTOS_RAPIDOS.map(({ label, value }) => (
                <button key={value} className="chip" aria-pressed={monto === value} onClick={() => setMontoStr(String(value))}>
                  {label}
                </button>
              ))}
            </div>
            <p className="field-hint mt-4">
              Costos de una operación de compra con IVA incluido. Las plataformas con suscripción suman la mensualidad.
            </p>
          </section>

          {ganador ? (
            <section className="rounded-2xl p-6 md:p-8 border border-[var(--border-accent)] bg-[var(--glow-emerald)] flex flex-col justify-center" aria-live="polite">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--accent-emerald)] mb-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
                </svg>
                Opción más barata para {formatCOP(monto)}
              </div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-[var(--on-accent)] bg-[var(--accent-emerald)] shrink-0">
                  {iniciales(ganador.broker.nombre)}
                </div>
                <div className="min-w-0">
                  <div className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] tracking-tight leading-tight">{ganador.broker.nombre}</div>
                  <div className="mt-1"><EtiquetaMercado broker={ganador.broker} /></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] p-4">
                  <div className="text-xs text-[var(--text-muted)] mb-1">Costo total</div>
                  <div className="text-xl md:text-2xl font-mono font-semibold text-[var(--accent-emerald)]">{formatCOP(costoTotalDe(ganador.resultado))}</div>
                </div>
                <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] p-4">
                  <div className="text-xs text-[var(--text-muted)] mb-1">Sobre el monto</div>
                  <div className="text-xl md:text-2xl font-mono font-semibold text-[var(--text-primary)]">
                    {monto > 0 ? ((costoTotalDe(ganador.resultado) / monto) * 100).toFixed(2) : '0.00'}%
                  </div>
                </div>
              </div>
              {ahorroVsMasCaro > 0 && (
                <p className="text-sm text-[var(--text-secondary)] mt-4">
                  Te ahorras <strong className="text-[var(--text-primary)]">{formatCOP(ahorroVsMasCaro)}</strong> frente a la opción más cara.
                  Mínimo para vender después: <strong className="text-[var(--text-primary)]">{formatCOP(ganador.broker.monto_minimo_venta)}</strong>.
                </p>
              )}
              {ganador.resultado.costo_suscripcion > 0 && (
                <div className="mt-4 rounded-lg p-3 text-sm bg-[var(--glow-amber)] border border-[var(--accent-amber)]/30">
                  <strong className="text-[var(--accent-amber)]">Incluye mensualidad de {formatCOP(ganador.resultado.costo_suscripcion)}.</strong>
                </div>
              )}
              {ganador.resultado.notas_adicionales && (
                <p className="mt-3 text-xs text-[var(--text-muted)] leading-relaxed">{ganador.resultado.notas_adicionales}</p>
              )}
            </section>
          ) : (
            <section className="rounded-2xl p-6 md:p-8 border border-[var(--accent-amber)]/30 bg-[var(--glow-amber)] flex items-center justify-center text-center text-[var(--accent-amber)] font-medium">
              El monto ingresado es menor al mínimo de compra de todos los brokers disponibles.
            </section>
          )}
        </div>

        {/* ══ RANKING ════════════════════════════════════════════ */}
        <section className="card !p-5 md:!p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-5">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Ranking para {formatCOP(monto)}</h2>
            <span className="text-sm text-[var(--text-muted)]">De menor a mayor costo</span>
          </div>
          <ol className="space-y-2">
            {ranking.validos.map(({ broker, resultado }, i) => {
              const total = costoTotalDe(resultado);
              const ancho = costoMaximo > 0 ? Math.max(4, (total / costoMaximo) * 100) : 0;
              const esGanador = i === 0;
              return (
                <li
                  key={broker.id}
                  className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 md:gap-4 rounded-xl px-3 md:px-4 py-3 border ${
                    esGanador ? 'border-[var(--border-accent)] bg-[var(--glow-emerald)]' : 'border-[var(--border-color)] bg-[var(--bg-primary)]'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold font-mono ${
                    esGanador ? 'bg-[var(--accent-emerald)] text-[var(--on-accent)]' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)]'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
                      <span className="font-semibold text-[var(--text-primary)] leading-snug">{broker.nombre}</span>
                      <EtiquetaMercado broker={broker} />
                      {resultado.costo_suscripcion > 0 && (
                        <span className="text-[0.68rem] text-[var(--accent-amber)]">+ mensualidad</span>
                      )}
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--border-color)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${ancho}%`, background: esGanador ? 'var(--accent-emerald)' : 'var(--text-muted)' }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono font-semibold ${esGanador ? 'text-[var(--accent-emerald)]' : 'text-[var(--text-primary)]'}`}>{formatCOP(total)}</div>
                    <div className="font-mono text-xs text-[var(--text-muted)]">{monto > 0 ? ((total / monto) * 100).toFixed(2) : '0.00'}%</div>
                  </div>
                </li>
              );
            })}
          </ol>
          {ranking.noDisponibles.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
              <div className="text-sm text-[var(--text-muted)] mb-2">No disponibles para este monto (no alcanza el mínimo de compra):</div>
              <div className="flex flex-wrap gap-2">
                {ranking.noDisponibles.map((b) => (
                  <span key={b.id} className="text-xs px-2.5 py-1 rounded-md border border-[var(--border-color)] text-[var(--text-secondary)]">
                    {b.nombre} · mín. {formatCOP(b.monto_minimo_compra)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ══ NOTAS ══════════════════════════════════════════════ */}
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              titulo: 'Sobre las tarifas',
              color: 'var(--accent-emerald)',
              texto: 'Los valores son comisiones de corretaje con IVA incluido. (*) indica plataformas con costo de suscripción mensual aparte.',
            },
            {
              titulo: 'Ejecución en la BVC',
              color: 'var(--accent-blue)',
              texto: 'En Colombia no se compran fracciones de acciones: el monto real depende del precio por unidades enteras. La baja liquidez de algunos activos genera un spread que no se refleja aquí.',
            },
            {
              titulo: 'Impuestos en brokers internacionales',
              color: 'var(--accent-amber)',
              texto: 'No gozan del beneficio tributario de la BVC. Si vendes con menos de 2 años de tenencia, la utilidad va a tu cédula general con tarifa marginal; con más de 2 años, tributa como ganancia ocasional al 15%.',
            },
          ].map((n) => (
            <div key={n.titulo} className="card !p-5" style={{ borderTop: `3px solid ${n.color}` }}>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2 text-[0.95rem]">{n.titulo}</h3>
              <p className="text-[0.82rem] text-[var(--text-secondary)] leading-relaxed">{n.texto}</p>
            </div>
          ))}
        </div>

        {/* ══ TABLA COMPLETA (plegable) ══════════════════════════ */}
        <details className="detail-block !mt-0">
          <summary>
            <div>
              Ver tabla completa por monto
              <small>Costo de cada broker desde $100 mil hasta $50 millones. Toca una fila para resaltarla.</small>
            </div>
            <Chevron />
          </summary>
          <div className="detail-body">
            <div ref={tableRef} className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="py-3 px-4 font-semibold text-[var(--text-secondary)] text-xs sticky left-0 z-10 bg-[var(--bg-card)]">Monto</th>
                    {brokers.map((b) => (
                      <th key={b.id} className="py-3 px-4 font-semibold text-[var(--text-secondary)] text-xs text-right">
                        {b.nombre}{b.costo_suscripcion_mensual ? ' *' : ''}
                      </th>
                    ))}
                    <th className="py-3 px-4 font-semibold text-[var(--text-secondary)] text-xs">Más barato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {saltos.map((m) => {
                    const filaResultados = brokers.map((b) => ({ broker: b, res: calcularComision(m, b, 'compra') }));
                    const filaValidos = filaResultados.filter((r) => !r.res.error) as { broker: BrokerConfig; res: ResultadoExitoso }[];
                    const ganadorFila = filaValidos.length > 0
                      ? filaValidos.reduce((prev, curr) => (costoTotalDe(curr.res) < costoTotalDe(prev.res) ? curr : prev))
                      : null;

                    return (
                      <tr
                        key={m}
                        className={`transition-colors cursor-pointer ${selectedRow === m ? 'bg-[var(--bg-card-hover)] ring-2 ring-inset ring-[var(--accent-emerald)]' : 'bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)]'}`}
                        onClick={() => setSelectedRow((current) => (current === m ? null : m))}
                      >
                        <td className="py-2 px-4 font-mono text-[var(--text-primary)] font-medium sticky left-0 z-10 bg-inherit">{formatCOP(m)}</td>
                        {filaResultados.map(({ broker, res }) => {
                          if (res.error) {
                            return <td key={broker.id} className="py-2 px-4 text-right text-[var(--text-muted)] font-mono text-xs">N/A</td>;
                          }
                          const total = costoTotalDe(res as ResultadoExitoso);
                          const isWinner = ganadorFila?.broker.id === broker.id;
                          return (
                            <td key={broker.id} className={`py-2 px-4 text-right font-mono ${isWinner ? 'text-[var(--accent-emerald)] font-bold' : 'text-[var(--text-secondary)]'}`}>
                              <div>{formatCOP(total)}</div>
                              <div className="text-[0.7rem] opacity-70">{((total / m) * 100).toFixed(2)}%</div>
                            </td>
                          );
                        })}
                        <td className="py-2 px-4">
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
          </div>
        </details>

        {/* ══ FUENTES (plegables) ════════════════════════════════ */}
        <section>
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-3">Fuentes de información y tarifas oficiales</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {fuentes.map((item) => (
              <details key={item.id} className="detail-block !mt-0">
                <summary>
                  <div>{item.title}</div>
                  <Chevron />
                </summary>
                <div className="px-6 py-4 text-sm text-[var(--text-secondary)] leading-relaxed">
                  {item.body}
                </div>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
