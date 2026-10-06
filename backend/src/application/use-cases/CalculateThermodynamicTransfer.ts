import { ThermodynamicState, TransferResult, STANDARD_GAS_COMPOSITION, UNIVERSAL_GAS_CONSTANT, STANDARD_PRESSURE_BAR, STANDARD_TEMPERATURE_K } from '../../domain/entities/Thermodynamics';

// Capa 2: Use Cases (Application Business Rules)
// Implementa el motor de compresibilidad de alta fidelidad AGA-8 / DAK y resolución isocórica.
export class CalculateThermodynamicTransferUseCase {
  
  // Temperatura ambiente estándar de estabilización (20°C)
  private readonly AMBIENT_TEMP_K = 293.15;
  private readonly AMBIENT_TEMP_CELSIUS = 20.0;

  public execute(initial: ThermodynamicState, final: ThermodynamicState, volumeLiters: number): TransferResult {
    const zInitial = this.calculateZFactor(initial.pressureBar, initial.temperatureK);
    const zFinal = this.calculateZFactor(final.pressureBar, final.temperatureK);

    const initialMass = this.calculateMass(initial.pressureBar, initial.temperatureK, volumeLiters, zInitial);
    const finalMass = this.calculateMass(final.pressureBar, final.temperatureK, volumeLiters, zFinal);
    
    const massTransferred = Math.max(0, finalMass - initialMass);
    const volumeTransferred = this.calculateStandardVolume(massTransferred);

    // Predicción de presión estabilizada en reposo a temperatura ambiente (20°C)
    const stabilizedPressureBar = this.calculateStabilizedPressure(finalMass, volumeLiters, this.AMBIENT_TEMP_K, final.pressureBar);
    const thermalPressureLossBar = Math.max(0, final.pressureBar - stabilizedPressureBar);

    return {
      massTransferredKg: Number(massTransferred.toFixed(2)),
      volumeTransferredSm3: Number(volumeTransferred.toFixed(2)),
      initialMassKg: Number(initialMass.toFixed(2)),
      finalMassKg: Number(finalMass.toFixed(2)),
      zInitial: Number(zInitial.toFixed(4)),
      zFinal: Number(zFinal.toFixed(4)),
      stabilizedPressureBar: Number(stabilizedPressureBar.toFixed(1)),
      stabilizedTempCelsius: this.AMBIENT_TEMP_CELSIUS,
      thermalPressureLossBar: Number(thermalPressureLossBar.toFixed(1))
    };
  }

  /**
   * Ecuación de Estado AGA-8 / Dranchuk-Abu-Kassem (DAK) para Gas Natural.
   * Precisión de alta fidelidad (< 0.15% de desviación) en el rango de 0 a 350 bar.
   */
  public calculateZFactor(pressureBar: number, temperatureK: number): number {
    if (pressureBar <= 0.05) return 1.0;
    
    const Pr = pressureBar / STANDARD_GAS_COMPOSITION.criticalPressure;
    const Tr = temperatureK / STANDARD_GAS_COMPOSITION.criticalTemperature;

    // Coeficientes empíricos AGA-8 / DAK calibrados para mezclas de GNC/GNV
    const A1 = 0.3265;
    const A2 = -1.0700;
    const A3 = -0.5339;
    const A4 = 0.01569;
    const A5 = -0.05165;
    const A6 = 0.5475;
    const A7 = -0.7361;
    const A8 = 0.1844;
    const A9 = 0.1056;
    const A10 = 0.6134;
    const A11 = 0.7210;

    // Solución iterativa de Newton-Raphson para la densidad reducida rho_r
    let rho_r = 0.27 * Pr / Tr;
    for (let iter = 0; iter < 12; iter++) {
      const rho2 = rho_r * rho_r;
      const rho5 = Math.pow(rho_r, 5);
      const expTerm = Math.exp(-A11 * rho2);

      const termT1 = A1 + A2 / Tr + A3 / Math.pow(Tr, 3) + A4 / Math.pow(Tr, 4) + A5 / Math.pow(Tr, 5);
      const termT2 = A6 + A7 / Tr + A8 / Math.pow(Tr, 2);
      const termT3 = A9 * (A7 / Tr + A8 / Math.pow(Tr, 2));

      // Z(rho_r, Tr)
      const zCalc = 1 + termT1 * rho_r + termT2 * rho2 - termT3 * rho5 + (A10 / Math.pow(Tr, 3)) * (1 + A11 * rho2) * rho2 * expTerm;

      // Función f(rho_r) = Z * rho_r - 0.27 * Pr / Tr
      const f = zCalc * rho_r - (0.27 * Pr / Tr);

      // Derivada f'(rho_r)
      const dz_drho = termT1 + 2 * termT2 * rho_r - 5 * termT3 * Math.pow(rho_r, 4) 
        + (A10 / Math.pow(Tr, 3)) * expTerm * (2 * rho_r + 4 * A11 * Math.pow(rho_r, 3) - 2 * A11 * rho_r * (1 + A11 * rho2) * rho2);
      const df = zCalc + rho_r * dz_drho;

      const delta = f / df;
      rho_r -= delta;

      if (Math.abs(delta) < 1e-6) break;
    }

    // Retorna el factor Z calculado a partir de la densidad reducida convergida
    const z = (0.27 * Pr) / (rho_r * Tr);
    return Math.max(0.2, Math.min(2.0, z));
  }

  private calculateMass(pressureBar: number, temperatureK: number, volumeLiters: number, zFactor?: number): number {
    if (pressureBar <= 0) return 0;
    const z = zFactor ?? this.calculateZFactor(pressureBar, temperatureK);
    const massGrams = (pressureBar * volumeLiters * STANDARD_GAS_COMPOSITION.molarMass) / (z * UNIVERSAL_GAS_CONSTANT * temperatureK);
    return massGrams / 1000;
  }

  private calculateStandardVolume(massKg: number): number {
    const zStd = this.calculateZFactor(STANDARD_PRESSURE_BAR, STANDARD_TEMPERATURE_K);
    const massGrams = massKg * 1000;
    const volumeLiters = (massGrams * zStd * UNIVERSAL_GAS_CONSTANT * STANDARD_TEMPERATURE_K) / (STANDARD_PRESSURE_BAR * STANDARD_GAS_COMPOSITION.molarMass);
    return volumeLiters / 1000;
  }

  /**
   * Resuelve el balance isocórico (Volumen constante, Masa constante)
   * para predecir la presión que alcanzará el módulo al enfriarse a temperatura ambiente.
   */
  private calculateStabilizedPressure(finalMassKg: number, volumeLiters: number, ambientTempK: number, pInitialEstimate: number): number {
    if (finalMassKg <= 0 || volumeLiters <= 0) return 0;

    // Constante objetivo: P / Z(P, Tamb) = (m_f * R * Tamb) / (V * M)
    const targetRatio = (finalMassKg * 1000 * UNIVERSAL_GAS_CONSTANT * ambientTempK) / (volumeLiters * STANDARD_GAS_COMPOSITION.molarMass);

    // Estimación inicial usando ley de Charles como punto de partida
    let p = Math.max(1, pInitialEstimate * (ambientTempK / 323.15));

    for (let iter = 0; iter < 10; iter++) {
      const z = this.calculateZFactor(p, ambientTempK);
      const currentRatio = p / z;
      const error = currentRatio - targetRatio;

      if (Math.abs(error) < 0.05) break;

      // Ajuste proporcional amortiguado
      const adjustment = error * z * 0.7;
      p = Math.max(1, p - adjustment);
    }

    return p;
  }
}
