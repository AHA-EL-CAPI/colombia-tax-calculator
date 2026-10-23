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

  describe('2. Auditoría de Dependientes (Art 387 vs Art 336, sin doble beneficio)', () => {
    it('Un mismo dependiente no genera Art. 387 y 72 UVT a la vez (Concepto DIAN 11080/2023)', () => {
      const res = calcularRetencion(10_000_000, 2026, 3);
      const topeMensual = 32 * CONSTANTES_2026.UVT;
      expect(res.tieneArt387).toBe(true);
      expect(res.deduccionArt387Mes).toBeLessThanOrEqual(topeMensual);
      expect(res.deduccionArt336Mes).toBe(0);
      // El primer dependiente va al Art. 387; los otros dos a las 72 UVT
      expect(res.deduccionArt336Anual).toBe(72 * 2 * CONSTANTES_2026.UVT);
    });

    it('Con un dependiente elige la deducción que deja menos impuesto', () => {
      const conDep = calcularRetencion(10_000_000, 2026, 1);
      expect(conDep.tieneArt387 && conDep.tieneArt336).toBe(false);
      const bajo = calcularRetencion(2_000_000, 2026, 1);
      expect(bajo.tieneArt387 && bajo.tieneArt336).toBe(false);
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

  describe('4. Exclusividad de Beneficios para Independientes (Art. 336 par. 5)', () => {
    it('La presunción de costos UGPP no excluye la Renta Exenta del 25%', () => {
      const res = calcularRetencionIndependiente(10_000_000, 'Presunción Media', true, 0.11, 2026);
      expect(res.costosUGPPMes).toBeGreaterThan(0);
      expect(res.rentaExentaAnual).toBeCloseTo(res.ingresoNetoAnual * 0.25, 2);
    });

    it('Prohíbe la Renta Exenta del 25% cuando se restan costos reales ante la DIAN', () => {
      const res = calcularRetencionIndependiente(10_000_000, 'Costos Reales (Declarados con Soportes)', true, 0.11, 2026, 0, 2_000_000);
      expect(res.rentaExentaAnual).toBe(0);
      expect(res.rentaExentaMes).toBe(0);
    });

    it('El impuesto anual no depende del método de retención', () => {
      const tabla = calcularRetencionIndependiente(10_000_000, 'Honorarios y Servicios Profesionales (No clasificados)', true, 0.11, 2026);
      const plana = calcularRetencionIndependiente(10_000_000, 'Honorarios y Servicios Profesionales (No clasificados)', false, 0.11, 2026);
      expect(plana.impuestoAnual).toBe(tabla.impuestoAnual);
      expect(plana.impuestoMes).toBe(1_100_000);
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
    it('Debe calcular FSP correctamente', () => {
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
    });
  });

  describe('7. Régimen Simple (Arts. 903, 904, 908 y 912)', () => {
    it('No descuenta la cotización propia a pensión, solo el aporte patronal', () => {
      // 120M en el grupo de profesionales: 5,9% sobre ingresos brutos
      const sinDescuentos = calcularRST(120_000_000, '4', 52_374, 1_750_905);
      expect(sinDescuentos!.impuestoBruto).toBeCloseTo(7_080_000, 0);
      expect(sinDescuentos!.descuentoPension).toBe(0);
      expect(sinDescuentos!.impuestoNeto).toBeCloseTo(7_080_000, 0);

      const conPatronal = calcularRST(120_000_000, '4', 52_374, 1_750_905, { aportesPensionPatronalesAnual: 2_000_000 });
      expect(conPatronal!.descuentoPension).toBe(2_000_000);
      expect(conPatronal!.impuestoNeto).toBeCloseTo(5_080_000, 0);
    });

    it('El 0,5% electrónico solo aplica a lo recibido por medios electrónicos', () => {
      const res = calcularRST(120_000_000, '4', 52_374, 1_750_905, { ingresosElectronicosAnual: 60_000_000 });
      expect(res!.descuentoElectronico).toBeCloseTo(300_000, 0);
    });

    it('El impuesto al consumo del 8% solo aplica al expendio de comidas', () => {
      expect(calcularRST(100_000_000, '3', 52_374, 1_750_905)!.impuestoConsumo).toBe(0);
      expect(calcularRST(100_000_000, '3', 52_374, 1_750_905, { esExpendioComidas: true })!.impuestoConsumo).toBe(8_000_000);
    });
  });
});

describe('Regresiones de la auditoría 2026', () => {
  const C = CONSTANTES_2026;

  it('La retención mensual respeta el tope de 1.340 UVT / 12 (Art. 388)', () => {
    const res = calcularRetencion(20_000_000, 2026, 0, 6_000_000);
    expect(res.deduccionesCapadasMes).toBeLessThanOrEqual((1340 * C.UVT) / 12 + 1);
  });

  it('El IBC del asalariado no supera 25 SMMLV', () => {
    const res = calcularRetencion(60_000_000, 2026, 0);
    expect(res.ibcMes).toBe(25 * C.SMMLV);
    expect(res.descuentoSaludMes).toBeCloseTo(25 * C.SMMLV * 0.04, 2);
  });

  it('El auxilio de transporte es ingreso gravado, no INCRGO', () => {
    const res = calcularRetencion(3_000_000, 2026, 0);
    expect(res.calificaAuxilio).toBe(true);
    expect(res.ingresoNetoAnual).toBeCloseTo(res.ingresoBrutoAnual - res.totalDescuentosAnual, 2);
  });

  it('Obligado a declarar desde 1.400 UVT exactas', () => {
    const res = calcularRetencionIndependiente((1400 * C.UVT) / 12, 'Honorarios y Servicios Profesionales (No clasificados)', true, 0.11, 2026);
    expect(res.obligadoDeclarar).toBe(true);
  });

  it('El aporte sugerido respeta los topes de aportes voluntarios', () => {
    const res = calcularRetencion(15_000_000, 2026, 0);
    expect(res.aporteSugerido).toBeLessThanOrEqual(Math.min(res.ingresoBrutoAnual * 0.30, 3800 * C.UVT) / 12);
  });
});
