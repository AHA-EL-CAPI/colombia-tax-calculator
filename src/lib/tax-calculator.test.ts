import {
  calcularRetencion,
  calcularRetencionIndependiente,
  encontrarSalarioMagicoAsalariado,
  calcularRST,
  CONSTANTES_2026
} from './tax-calculator';

describe('Auditoría DIAN: Retención en la Fuente 2026', () => {
  
  describe('1. Control de Topes y Límites (El 40% y 1.340 UVT)', () => {
    it('Asalariado VIP: Nunca debe deducir más de 1.340 UVT así aporte fortunas a AFC', () => {
      const res = calcularRetencion(50_000_000, 2026, 0, 30_000_000, 0, 0, 0, 0);
      const limiteAbsolutoEsperado = 1340 * CONSTANTES_2026.UVT;
      expect(res.topeTecho40Activo).toBe(true);
      expect(res.deduccionesCapadas).toBeLessThanOrEqual(limiteAbsolutoEsperado);
      expect(res.porcentajeUsado).toBe(100);
    });
  });

  describe('2. Auditoría de Dependientes (Doble Beneficio Art 387 vs Art 336)', () => {
    it('Debe aplicar límite de 32 UVT/mes y calcular 72 UVT anuales adicionales solo en Renta', () => {
      const res = calcularRetencion(10_000_000, 2026, 3);
      const topeMensual = 32 * CONSTANTES_2026.UVT;
      expect(res.deduccionArt387Mes).toBeLessThanOrEqual(topeMensual);
      expect(res.deduccionArt336Mes).toBe(0);
      const deduccionAnualEsperada = 72 * 3 * CONSTANTES_2026.UVT;
      expect(res.deduccionArt336Anual).toBe(deduccionAnualEsperada);
    });
  });

  describe('3. Auditoría del Piso de Seguridad Social (UGPP)', () => {
    it('El IBC de un independiente nunca puede ser menor a 1 SMMLV si tiene capacidad de pago', () => {
      const res = calcularRetencionIndependiente(5_000_000, 'Presunción Media', true, 0.11, 2026);
      expect(res.tieneCapacidadDePago).toBe(true);
      expect(res.usandoIBCMinimo).toBe(true);
      expect(res.ibcMes).toBe(CONSTANTES_2026.SMMLV);
    });
  });

  describe('4. Exclusividad de Beneficios para Independientes', () => {
    it('Prohíbe usar Renta Exenta del 25% si el independiente ya reclama Costos Presuntos', () => {
      const res = calcularRetencionIndependiente(10_000_000, 'Presunción Media', true, 0.11, 2026);
      expect(res.costosUGPPMes).toBeGreaterThan(0);
      expect(res.rentaExentaAnual).toBe(0);
      expect(res.rentaExentaMes).toBe(0);
    });
  });

  describe('5. Auditoría de Ingeniería Inversa (Salario Mágico)', () => {
    it('El Salario Mágico debe generar exactamente $0 de impuesto anual', () => {
      const salarioMagico = encontrarSalarioMagicoAsalariado(2026, 0);
      const validacion = calcularRetencion(salarioMagico, 2026, 0);
      expect(validacion.impuestoAnual).toBeLessThanOrEqual(0);
    });
  });

  describe('6. Auditoría de FSP (Fondo de Solidaridad Pensional)', () => {
    it('Debe calcular FSP correctamente y habilitar descuento en el Régimen Simple', () => {
      // 1. Asalariado con 10M (5.71 SMMLV en 2026), FSP debería ser 1% (100.000 COP/mes)
      const resAsalariado = calcularRetencion(10_000_000, 2026, 0);
      expect(resAsalariado.fspMes).toBe(100_000);
      expect(resAsalariado.fspAnual).toBe(1_200_000);

      // 2. Independiente con 10M, IBC es 4M (2.28 SMMLV), por debajo de 4 SMMLV, FSP es 0
      const resIndependienteBajo = calcularRetencionIndependiente(10_000_000, 'Honorarios y Servicios Profesionales (No clasificados)', true, 0, 2026);
      expect(resIndependienteBajo.fspMes).toBe(0);

      // 3. Independiente con 20M, IBC es 8M (4.57 SMMLV), FSP debe ser 1% (80.000 COP/mes)
      const resIndependienteAlto = calcularRetencionIndependiente(20_000_000, 'Honorarios y Servicios Profesionales (No clasificados)', true, 0, 2026);
      expect(resIndependienteAlto.fspMes).toBe(80_000);

      // 4. Régimen Simple (calcularRST) con descuento de FSP incluido
      // Con ingreso anual de 120M:
      // ibcPension es el 40% de 120M = 48M.
      // ibcMensual de pension es 48M / 12 = 4M (2.28 SMMLV), por debajo de 4 SMMLV, FSP es 0.
      // impuestoBruto es 120M * 5.9% = 7.080.000 COP.
      // descuentoPension (sin tope) es 48M * 0.16 = 7.680.000 COP.
      // Como descuentoPension > impuestoBruto, se topa en 7.080.000 COP.
      const rstBajo = calcularRST(120_000_000, '4', 52_374, 1_750_905);
      expect(rstBajo).not.toBeNull();
      expect(rstBajo!.descuentoPension).toBe(7_080_000);

      // Con ingreso anual de 600M (40% es 240M, ibcMensual = 20M = 11.42 SMMLV), FSP es 1% de 20M = 200k/mes * 12 = 2.400.000 COP.
      // impuestoBruto es 600M * 7.3% = 43.800.000 COP (segunda franja).
      // descuentoPension es 240M * 0.16 + 2.400.000 = 38.400.000 + 2.400.000 = 40.800.000 COP.
      // Como 40.800.000 < 43.800.000, el descuento de pensión es el total (no se topa).
      const rstAlto = calcularRST(600_000_000, '4', 52_374, 1_750_905);
      expect(rstAlto).not.toBeNull();
      expect(rstAlto!.descuentoPension).toBe(40_800_000);
    });
  });
});
