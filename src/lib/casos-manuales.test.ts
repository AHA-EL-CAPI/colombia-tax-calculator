/**
 * Casos calculados a mano (fuera del motor) con UVT 2026 = $52.374 (Res. DIAN 238/2025)
 * y SMMLV 2026 = $1.750.905 (Decreto 1469/2025). Cada paso cita la norma aplicada.
 */
import { calcularRetencion, calcularRetencionIndependiente } from './tax-calculator';

const UVT = 52_374;

describe('Casos manuales 2026', () => {
  it('Caso A · Asalariado $10M, 2 dependientes, prepagada $500k', () => {
    // INCRGO: salud 4% + pensión 4% + FSP 1% (5,71 SMMLV, Ley 797 art. 8) = $900.000/mes
    // Neto anual = 120.000.000 − 10.800.000 = 109.200.000
    // Art. 387: 10% × 120M = 12.000.000 (tope 384 UVT = 20.111.616)
    // Prepagada (Art. 387): 6.000.000 (tope 16 UVT/mes)
    // 25% (Art. 206-10): (109,2M − 12M − 6M) × 25% = 22.800.000 (tope 790 UVT)
    // Sujetas al 40% = 40.800.000 < 40% × 109,2M = 43.680.000 → sin recorte
    // Art. 336: 2 × 72 UVT = 7.541.856 (fuera del 40%, también con el Art. 387)
    // Base = 109,2M − 40,8M − 7.541.856 = 60.858.144 → (base − 1.090 UVT) × 19%
    const r = calcularRetencion(10_000_000, 2026, 2, 0, 500_000);
    expect(r.fspMes).toBe(100_000);
    expect(r.ingresoNetoAnual).toBe(109_200_000);
    expect(r.deduccionArt387Anual).toBe(12_000_000);
    expect(r.rentaExentaAnual).toBe(22_800_000);
    expect(r.deduccionesCapadas).toBe(40_800_000);
    expect(r.deduccionArt336Anual).toBe(144 * UVT);
    expect(r.baseGravableAnual).toBe(60_858_144);
    expect(r.impuestoAnual).toBe(716_392);
    // Retención mensual (Art. 383/388): 9,1M − 1M − 0,5M − 1,9M = 5.700.000
    expect(r.baseGravableMes).toBeCloseTo(5_700_000, 0);
    expect(r.impuestoMes).toBe(137_649);
  });

  it('Caso B · Independiente honorarios $12M, 1 dependiente, sin costos', () => {
    // IBC = 40% × 12M = 4.800.000 (2,74 SMMLV, sin FSP). Salud 12,5% + pensión 16% = 1.368.000/mes
    // Neto anual = 144M − 16.416.000 = 127.584.000
    // Opción Art. 387: 14.400.000; 25% de (127.584.000 − 14.400.000) = 28.296.000 → base 84.888.000
    // Opción 72 UVT: 25% de 127.584.000 = 31.896.000 → base 91.917.072 (peor)
    const r = calcularRetencionIndependiente(12_000_000, 'Honorarios y Servicios Profesionales (No clasificados)', true, 0.11, 2026, 1);
    expect(r.ibcMes).toBe(4_800_000);
    expect(r.fspMes).toBe(0);
    expect(r.ingresoNetoAnual).toBe(127_584_000);
    expect(r.tieneArt387).toBe(true);
    expect(r.deduccionArt336Anual).toBe(0);
    expect(r.baseGravableAnual).toBe(84_888_000);
    expect(r.impuestoAnual).toBe(5_282_065);
  });

  it('Caso C · Asalariado $40M con AFC $10M: tope 790 UVT y 1.340 UVT', () => {
    // IBC 40M (< 25 SMMLV); FSP 2% (22,8 SMMLV). INCRGO = 4.000.000/mes → neto 432.000.000
    // AFC válido 120M (< 30% de 480M y < 3.800 UVT). 25% topado en 790 UVT = 41.375.460
    // Sujetas 161,4M > min(40% × 432M; 1.340 UVT = 70.181.160) → 70.181.160
    // Base 361.818.840 = 6.908,37 UVT → 788 + (6.908,37 − 4.100) × 33% UVT
    const r = calcularRetencion(40_000_000, 2026, 0, 10_000_000);
    expect(r.fspMes).toBe(800_000);
    expect(r.rentaExentaAnual).toBe(790 * UVT);
    expect(r.deduccionesCapadas).toBe(1340 * UVT);
    expect(r.baseGravableAnual).toBe(361_818_840);
    expect(r.impuestoAnual).toBe(89_808_907);
  });

  it('Caso D · Asalariado 2025 $2,5M: auxilio de transporte y no obligado a declarar', () => {
    // 2,5M ≤ 2 SMMLV 2025 → auxilio $200.000. Bruto 32.400.000 < 1.400 UVT 2025 (69.718.600)
    const r = calcularRetencion(2_500_000, 2025);
    expect(r.auxilioTransporteMensual).toBe(200_000);
    expect(r.ingresoBrutoAnual).toBe(32_400_000);
    expect(r.ingresoNetoAnual).toBe(30_000_000);
    expect(r.impuestoAnual).toBe(0);
    expect(r.obligadoDeclarar).toBe(false);
  });
});
