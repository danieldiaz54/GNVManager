export interface ThermodynamicState {
  pressureBar: number;
  temperatureK: number;
}

export interface GasComposition {
  molarMass: number; // g/mol
  criticalPressure: number; // bar
  criticalTemperature: number; // K
}

export interface TransferResult {
  massTransferredKg: number;
  volumeTransferredSm3: number;
  initialMassKg: number;
  finalMassKg: number;
  zInitial: number;
  zFinal: number;
  stabilizedPressureBar: number;
  stabilizedTempCelsius: number;
  thermalPressureLossBar: number;
}

// Valores estándar de negocio (Enterprise Business Rules)
// Estas reglas aplican a cualquier aplicación que procese GNV, independientemente del framework.
export const STANDARD_GAS_COMPOSITION: GasComposition = {
  molarMass: 16.5,
  criticalPressure: 46.0,
  criticalTemperature: 191.0
};

export const UNIVERSAL_GAS_CONSTANT = 0.0831446; // L*bar/(K*mol)
export const STANDARD_PRESSURE_BAR = 1.01325; // 1 atm
export const STANDARD_TEMPERATURE_K = 288.15; // 15°C
