// Contratos e interfaces del Dominio Termodinámico (Dominio 01)
// Basado en: .specs/01-domain-thermo/thermodynamic-engine.spec.md
// Custodiado por: @domain-architect

export type GasComponent =
  | 'CH4'
  | 'C2H6'
  | 'C3H8'
  | 'iC4'
  | 'nC4'
  | 'iC5'
  | 'nC5'
  | 'C6plus'
  | 'N2'
  | 'CO2'
  | 'H2S'
  | 'He';

export interface MolarFraction {
  component: GasComponent;
  fraction: number; // 0.0 a 1.0
}

export interface ChromatographyProfile {
  id: string;
  name: string; // ej: 'Bonga-Mamey', 'Candilejas', 'Gas Rico Llano'
  fractions: MolarFraction[];
  molecularWeight: number; // g/mol
  pseudoCriticalPressureBar: number; // bar
  pseudoCriticalTemperatureK: number; // K
  higherHeatingValueBtuScf?: number; // BTU/scf
}

export interface ThermodynamicState {
  pressureBar: number;      // Presión absoluta [bar]
  temperatureK: number;     // Temperatura absoluta [K]
  volumeLiters: number;     // Volumen geométrico nominal [L]
}

export interface CompressibilityResult {
  zFactor: number;
  reducedDensity: number;
  iterations: number;
  converged: boolean;
}

export interface MassVolumeResult {
  massKg: number;
  standardVolumeSm3: number;
  densityKgM3: number;
  zFactor: number;
}

export interface IsochoricForecastInput {
  cutoffPressureBar: number;
  cutoffTemperatureK: number;
  ambientTemperatureK: number;
  geometricVolumeLiters: number;
  chromatography: ChromatographyProfile;
  coolingTimeSeconds?: number;
  tauSeconds?: number;
}

export interface IsochoricForecastResult {
  stabilizedPressureBar: number;
  pressureDropBar: number;
  stabilizedTemperatureK: number;
  stabilizedZFactor: number;
  standardVolumeSm3: number;
  massKg: number;
}

export type AforoStatus =
  | 'CERTIFIED_AFT'
  | 'REJECTED_UNDERPRESSURE'
  | 'NON_COMPLIANT';

export interface AforoCertification {
  isCertified: boolean;
  stabilizedPressureBar: number;
  thresholdBar: number; // 230.0 bar para Sabanas
  stationId: string;
  status: AforoStatus;
  rejectionReason?: string;
  timestamp: Date;
}

export interface IThermodynamicEngine {
  calculateZFactor(
    pressureBar: number,
    temperatureK: number,
    profile: ChromatographyProfile
  ): CompressibilityResult;

  calculateMassAndVolume(
    state: ThermodynamicState,
    profile: ChromatographyProfile
  ): MassVolumeResult;

  forecastIsochoricDecay(
    input: IsochoricForecastInput
  ): IsochoricForecastResult;

  certifyAforoSabanas(
    stabilizedPressureBar: number,
    stationId: string
  ): AforoCertification;
}
