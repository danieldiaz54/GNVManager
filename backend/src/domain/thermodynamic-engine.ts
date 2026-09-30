// Motor Termodinámico Principal de Gases Reales
// Custodiado por: @domain-architect
// Especificación: .specs/01-domain-thermo/thermodynamic-engine.spec.md

import {
  STANDARD_PRESSURE_BAR,
  STANDARD_TEMPERATURE_K,
  UNIVERSAL_GAS_CONSTANT_R,
} from './constants';
import { DranchukAbuKassemSolver } from './dak-solver';
import { PhysicalInvariantException } from './exceptions';
import {
  AforoCertification,
  ChromatographyProfile,
  CompressibilityResult,
  IsochoricForecastInput,
  IsochoricForecastResult,
  IThermodynamicEngine,
  MassVolumeResult,
  ThermodynamicState,
} from './types';

export class ThermodynamicEngine implements IThermodynamicEngine {
  private static readonly SABANAS_RESTING_PRESSURE_FLOOR_BAR = 230.0;

  /**
   * Calcula el factor de compresibilidad Z mediante formulación DAK y Newton-Raphson
   */
  public calculateZFactor(
    pressureBar: number,
    temperatureK: number,
    profile: ChromatographyProfile
  ): CompressibilityResult {
    if (pressureBar <= 0) {
      throw new PhysicalInvariantException(
        `La presión debe ser estrictamente positiva. Recibido: ${pressureBar} bar`
      );
    }
    if (temperatureK <= 0) {
      throw new PhysicalInvariantException(
        `La temperatura absoluta debe ser estrictamente positiva. Recibido: ${temperatureK} K`
      );
    }

    const Ppr = pressureBar / profile.pseudoCriticalPressureBar;
    const Tpr = temperatureK / profile.pseudoCriticalTemperatureK;

    return DranchukAbuKassemSolver.solve(Ppr, Tpr);
  }

  /**
   * Calcula la masa física en kg y el volumen contractual estándar en Sm3
   */
  public calculateMassAndVolume(
    state: ThermodynamicState,
    profile: ChromatographyProfile
  ): MassVolumeResult {
    const { pressureBar, temperatureK, volumeLiters } = state;

    if (volumeLiters <= 0) {
      throw new PhysicalInvariantException(
        `El volumen geométrico debe ser positivo. Recibido: ${volumeLiters} L`
      );
    }

    const { zFactor } = this.calculateZFactor(pressureBar, temperatureK, profile);

    // n = (P * V) / (Z * R * T) en moles
    // m = n * Mw en gramos -> / 1000 en kg
    const moles = (pressureBar * volumeLiters) / (zFactor * UNIVERSAL_GAS_CONSTANT_R * temperatureK);
    const massKg = (moles * profile.molecularWeight) / 1000.0;

    // Volumen estándar contractual (Sm3 a 1.01325 bar y 288.15 K)
    const zStdResult = this.calculateZFactor(
      STANDARD_PRESSURE_BAR,
      STANDARD_TEMPERATURE_K,
      profile
    );
    const zStd = zStdResult.zFactor;

    // V_std (L) = V * (P / P_std) * (T_std / T) * (Z_std / Z)
    // 1 Sm3 = 1000 L
    const standardVolumeLiters =
      volumeLiters *
      (pressureBar / STANDARD_PRESSURE_BAR) *
      (STANDARD_TEMPERATURE_K / temperatureK) *
      (zStd / zFactor);

    const standardVolumeSm3 = standardVolumeLiters / 1000.0;
    const densityKgM3 = massKg / (volumeLiters / 1000.0);

    return {
      massKg,
      standardVolumeSm3,
      densityKgM3,
      zFactor,
    };
  }

  /**
   * Pronóstico de estabilización isocórica post-corte (Thermal Decay a volumen constante)
   */
  public forecastIsochoricDecay(
    input: IsochoricForecastInput
  ): IsochoricForecastResult {
    const {
      cutoffPressureBar,
      cutoffTemperatureK,
      ambientTemperatureK,
      geometricVolumeLiters,
      chromatography,
    } = input;

    // 1. Estado al corte
    const cutoffZResult = this.calculateZFactor(
      cutoffPressureBar,
      cutoffTemperatureK,
      chromatography
    );
    const rhoR = cutoffZResult.reducedDensity;

    // En un proceso isocórico estricto (V=cte, m=cte), la densidad reducida rho_r es INVARIANTE
    // rho_r = 0.27 * (rho_molar * R) * (Tpc / Ppc) = constante
    const stabilizedTpr = ambientTemperatureK / chromatography.pseudoCriticalTemperatureK;
    const stabilizedZ = DranchukAbuKassemSolver.evaluateZ(rhoR, stabilizedTpr);

    // P_estabilizada = (rho_r * Z * Tpr * Ppc) / 0.27
    const stabilizedPressureBar =
      (rhoR * stabilizedZ * stabilizedTpr * chromatography.pseudoCriticalPressureBar) / 0.27;

    const pressureDropBar = cutoffPressureBar - stabilizedPressureBar;

    // Cálculos de masa y volumen estándar para el estado estabilizado
    const stabilizedStateResult = this.calculateMassAndVolume(
      {
        pressureBar: stabilizedPressureBar,
        temperatureK: ambientTemperatureK,
        volumeLiters: geometricVolumeLiters,
      },
      chromatography
    );

    return {
      stabilizedPressureBar,
      pressureDropBar,
      stabilizedTemperatureK: ambientTemperatureK,
      stabilizedZFactor: stabilizedZ,
      standardVolumeSm3: stabilizedStateResult.standardVolumeSm3,
      massKg: stabilizedStateResult.massKg,
    };
  }

  /**
   * Regla de negocio BR-AFORO-001: Certificación inviolable de Aforo en Sabanas
   * Requiere P_estabilizada >= 230.00 bar
   */
  public certifyAforoSabanas(
    stabilizedPressureBar: number,
    stationId: string
  ): AforoCertification {
    const thresholdBar = ThermodynamicEngine.SABANAS_RESTING_PRESSURE_FLOOR_BAR;
    const isCertified = stabilizedPressureBar >= thresholdBar;

    return {
      isCertified,
      stabilizedPressureBar,
      thresholdBar,
      stationId,
      status: isCertified ? 'CERTIFIED_AFT' : 'REJECTED_UNDERPRESSURE',
      rejectionReason: isCertified
        ? undefined
        : `Presión estabilizada (${stabilizedPressureBar.toFixed(2)} bar) inferior al umbral normativo operacional de ${thresholdBar.toFixed(2)} bar en estación ${stationId}. Despacho no conforme.`,
      timestamp: new Date(),
    };
  }
}
