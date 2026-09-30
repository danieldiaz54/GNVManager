// Modelado dinámico de cromatografías y propiedades pseudocríticas
// Custodiado por: @domain-architect

import { PURE_COMPONENT_PROPERTIES } from './constants';
import { InvalidChromatographyException } from './exceptions';
import { ChromatographyProfile, MolarFraction } from './types';

export class ChromatographyProfileValueObject implements ChromatographyProfile {
  public readonly id: string;
  public readonly name: string;
  public readonly fractions: MolarFraction[];
  public readonly molecularWeight: number;
  public readonly pseudoCriticalPressureBar: number;
  public readonly pseudoCriticalTemperatureK: number;
  public readonly higherHeatingValueBtuScf?: number;

  constructor(params: {
    id: string;
    name: string;
    fractions: MolarFraction[];
    higherHeatingValueBtuScf?: number;
  }) {
    this.id = params.id;
    this.name = params.name;
    this.fractions = params.fractions;
    this.higherHeatingValueBtuScf = params.higherHeatingValueBtuScf;

    this.validateInvariants();
    this.molecularWeight = this.calculateMolecularWeight();

    const pseudoCritical = this.calculateStewartBurkhardtVoo();
    this.pseudoCriticalTemperatureK = pseudoCritical.Tpc;
    this.pseudoCriticalPressureBar = pseudoCritical.Ppc;
  }

  private validateInvariants(): void {
    if (!this.fractions || this.fractions.length === 0) {
      throw new InvalidChromatographyException('La lista de fracciones molares no puede estar vacía.');
    }

    let sum = 0;
    for (const f of this.fractions) {
      if (f.fraction < 0) {
        throw new InvalidChromatographyException(
          `Fracción molar negativa detectada para el componente ${f.component}: ${f.fraction}`
        );
      }
      sum += f.fraction;
    }

    if (Math.abs(sum - 1.0) > 1e-5) {
      throw new InvalidChromatographyException(
        `La suma de fracciones molares debe ser 1.0 (+-1e-5). Suma calculada: ${sum.toFixed(6)}`
      );
    }
  }

  private calculateMolecularWeight(): number {
    let mw = 0;
    for (const f of this.fractions) {
      const pureProp = PURE_COMPONENT_PROPERTIES[f.component];
      if (pureProp) {
        mw += f.fraction * pureProp.molecularWeight;
      }
    }
    return mw;
  }

  /**
   * Regla de mezcla de Stewart-Burkhardt-Voo (SBV) para gases naturales con no-hidrocarburos
   */
  private calculateStewartBurkhardtVoo(): { Tpc: number; Ppc: number } {
    let sumTcOverPc = 0;
    let sumSqrtTcOverPc = 0;
    let sumTcOverSqrtPc = 0;

    for (const f of this.fractions) {
      const pure = PURE_COMPONENT_PROPERTIES[f.component];
      if (!pure) continue;

      const tc = pure.criticalTemperatureK;
      const pc = pure.criticalPressureBar;
      const y = f.fraction;

      sumTcOverPc += y * (tc / pc);
      sumSqrtTcOverPc += y * Math.sqrt(tc / pc);
      sumTcOverSqrtPc += y * (tc / Math.sqrt(pc));
    }

    const J = (1 / 3) * sumTcOverPc + (2 / 3) * Math.pow(sumSqrtTcOverPc, 2);
    const K = sumTcOverSqrtPc;

    const Tpc = Math.pow(K, 2) / J;
    const Ppc = Tpc / J;

    return { Tpc, Ppc };
  }
}

/**
 * Perfil Bonga-Mamey: Gas Seco de la Costa Norte Colombiana
 * Metano al 96.3666%
 */
export function createBongaMameyProfile(): ChromatographyProfileValueObject {
  return new ChromatographyProfileValueObject({
    id: 'prof-bonga-mamey',
    name: 'Bonga-Mamey',
    fractions: [
      { component: 'CH4', fraction: 0.963666 },
      { component: 'C2H6', fraction: 0.018500 },
      { component: 'C3H8', fraction: 0.004200 },
      { component: 'iC4', fraction: 0.000800 },
      { component: 'nC4', fraction: 0.000700 },
      { component: 'CO2', fraction: 0.005634 },
      { component: 'N2', fraction: 0.006500 },
    ],
    higherHeatingValueBtuScf: 1030.5,
  });
}

/**
 * Perfil Candilejas: Gas Ultra Seco
 * Metano al 99.1685%
 */
export function createCandilejasProfile(): ChromatographyProfileValueObject {
  return new ChromatographyProfileValueObject({
    id: 'prof-candilejas',
    name: 'Candilejas',
    fractions: [
      { component: 'CH4', fraction: 0.991685 },
      { component: 'CO2', fraction: 0.003500 },
      { component: 'N2', fraction: 0.004815 },
    ],
    higherHeatingValueBtuScf: 1012.0,
  });
}

/**
 * Perfil Gas Rico del Llano: Alto contenido de licuables / pesados
 */
export function createGasRicoLlanoProfile(): ChromatographyProfileValueObject {
  return new ChromatographyProfileValueObject({
    id: 'prof-gas-rico-llano',
    name: 'Gas Rico Llano',
    fractions: [
      { component: 'CH4', fraction: 0.865000 },
      { component: 'C2H6', fraction: 0.075000 },
      { component: 'C3H8', fraction: 0.038000 },
      { component: 'nC4', fraction: 0.012000 },
      { component: 'CO2', fraction: 0.005000 },
      { component: 'N2', fraction: 0.005000 },
    ],
    higherHeatingValueBtuScf: 1165.0,
  });
}
