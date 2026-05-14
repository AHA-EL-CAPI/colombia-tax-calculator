import { calcularRetencion } from './tax-calculator';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const casos = require('../../__tests__/fixtures/casos-dian-2026.json');

describe('Validación de Cumplimiento (Data-Driven)', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  casos.forEach((caso: any) => {
    it(caso.descripcion, () => {
      const { inputs, expected } = caso;
      const res = calcularRetencion(
        inputs.salario,
        inputs.anio,
        inputs.dependientes,
        inputs.afc,
        inputs.prepagada,
        inputs.intereses
      );

      Object.keys(expected).forEach((key) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((res as any)[key]).toBe(expected[key]);
      });
    });
  });
});
