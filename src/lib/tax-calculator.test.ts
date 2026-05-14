import {
  calcularRetencion,
  calcularRetencionIndependiente,
  encontrarSalarioMagicoAsalariado,
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
      expect(res.costosDeduciblesMes).toBeGreaterThan(0);
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
});
