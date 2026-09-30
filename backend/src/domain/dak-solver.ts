// Solucionador Newton-Raphson de la Ecuación de Estado Dranchuk-Abu-Kassem (DAK)
// Custodiado por: @domain-architect

import { DAK_CONSTANTS } from './constants';
import { ThermodynamicDivergenceException } from './exceptions';
import { CompressibilityResult } from './types';

export class DranchukAbuKassemSolver {
  private static readonly MAX_ITERATIONS = 100;
  private static readonly EPSILON = 1e-7;

  /**
   * Resuelve el factor de compresibilidad Z mediante iteración Newton-Raphson
   * sobre la densidad reducida rho_r.
   */
  public static solve(Ppr: number, Tpr: number): CompressibilityResult {
    if (Ppr <= 0 || Tpr <= 0) {
      throw new ThermodynamicDivergenceException(
        `Condiciones pseudorreducidas inválidas: Ppr=${Ppr}, Tpr=${Tpr}`
      );
    }

    const { A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11 } = DAK_CONSTANTS;

    const Tpr2 = Tpr * Tpr;
    const Tpr3 = Tpr2 * Tpr;
    const Tpr4 = Tpr3 * Tpr;
    const Tpr5 = Tpr4 * Tpr;

    // Coeficientes dependientes únicamente de Tpr
    const c1 = A1 + A2 / Tpr + A3 / Tpr3 + A4 / Tpr4 + A5 / Tpr5;
    const c2 = A6 + A7 / Tpr + A8 / Tpr2;
    const c3 = A9 * (A7 / Tpr + A8 / Tpr2);
    const c4 = A10 / Tpr3;

    // Estimación inicial para gas real
    let rhoR = (0.27 * Ppr) / Tpr;
    if (rhoR <= 0) rhoR = 0.001;

    let iterations = 0;
    let converged = false;

    while (iterations < this.MAX_ITERATIONS) {
      iterations++;

      const rhoR2 = rhoR * rhoR;
      const rhoR4 = rhoR2 * rhoR2;
      const rhoR5 = rhoR4 * rhoR;
      const expTerm = Math.exp(-A11 * rhoR2);

      // Evaluación de Z(rhoR, Tpr)
      const zCalc =
        1 +
        c1 * rhoR +
        c2 * rhoR2 -
        c3 * rhoR5 +
        c4 * (1 + A11 * rhoR2) * rhoR2 * expTerm;

      // Función objetivo f(rhoR) = Z - (0.27 * Ppr) / (rhoR * Tpr)
      const idealTerm = (0.27 * Ppr) / (rhoR * Tpr);
      const f = zCalc - idealTerm;

      if (Math.abs(f) < this.EPSILON) {
        converged = true;
        break;
      }

      // Derivada analítica f'(rhoR)
      const dZ_drhoR =
        c1 +
        2 * c2 * rhoR -
        5 * c3 * rhoR4 +
        2 * c4 * rhoR * expTerm * (1 + A11 * rhoR2 - Math.pow(A11, 2) * rhoR4);

      const dIdeal_drhoR = (0.27 * Ppr) / (rhoR2 * Tpr);
      const fPrime = dZ_drhoR + dIdeal_drhoR;

      if (Math.abs(fPrime) < 1e-12) {
        throw new ThermodynamicDivergenceException(
          `Derivada nula f'(rhoR) durante Newton-Raphson a Ppr=${Ppr}, Tpr=${Tpr}`
        );
      }

      let deltaRho = f / fPrime;

      // Damping para evitar saltar a valores negativos o divergentes
      let nextRhoR = rhoR - deltaRho;
      if (nextRhoR <= 0) {
        nextRhoR = rhoR * 0.5;
        deltaRho = rhoR - nextRhoR;
      }

      if (Math.abs(deltaRho) < this.EPSILON) {
        rhoR = nextRhoR;
        converged = true;
        break;
      }

      rhoR = nextRhoR;
    }

    if (!converged) {
      throw new ThermodynamicDivergenceException(
        `El método Newton-Raphson no convergió tras ${this.MAX_ITERATIONS} iteraciones (Ppr=${Ppr}, Tpr=${Tpr})`
      );
    }

    const zFactor = (0.27 * Ppr) / (rhoR * Tpr);

    return {
      zFactor,
      reducedDensity: rhoR,
      iterations,
      converged,
    };
  }

  /**
   * Evalúa directamente Z para una densidad reducida y temperatura dadas (útil para procesos isocóricos)
   */
  public static evaluateZ(rhoR: number, Tpr: number): number {
    const { A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11 } = DAK_CONSTANTS;

    const Tpr2 = Tpr * Tpr;
    const Tpr3 = Tpr2 * Tpr;
    const Tpr4 = Tpr3 * Tpr;
    const Tpr5 = Tpr4 * Tpr;

    const c1 = A1 + A2 / Tpr + A3 / Tpr3 + A4 / Tpr4 + A5 / Tpr5;
    const c2 = A6 + A7 / Tpr + A8 / Tpr2;
    const c3 = A9 * (A7 / Tpr + A8 / Tpr2);
    const c4 = A10 / Tpr3;

    const rhoR2 = rhoR * rhoR;
    const rhoR5 = rhoR2 * rhoR2 * rhoR;
    const expTerm = Math.exp(-A11 * rhoR2);

    return (
      1 +
      c1 * rhoR +
      c2 * rhoR2 -
      c3 * rhoR5 +
      c4 * (1 + A11 * rhoR2) * rhoR2 * expTerm
    );
  }
}
