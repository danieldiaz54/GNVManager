// Cliente de API tipado para el Motor Termodinámico y Aforos
// Custodiado por: @integration-architect / @impeccable-designer

export interface CompressibilityResponse {
  zFactor: number;
  reducedDensity: number;
  iterations: number;
  converged: boolean;
}

export interface StateCalculationResponse {
  massKg: number;
  standardVolumeSm3: number;
  densityKgM3: number;
  zFactor: number;
}

export interface IsochoricForecastResponse {
  stabilizedPressureBar: number;
  pressureDropBar: number;
  stabilizedTemperatureK: number;
  stabilizedZFactor: number;
  standardVolumeSm3: number;
  massKg: number;
}

export interface AforoCertificationResponse {
  isCertified: boolean;
  stabilizedPressureBar: number;
  thresholdBar: number;
  stationId: string;
  status: 'CERTIFIED_AFT' | 'REJECTED_UNDERPRESSURE' | 'NON_COMPLIANT';
  rejectionReason?: string;
  timestamp: string;
}

const API_BASE = '/api/v1';

async function postJson<T>(endpoint: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    const errorMsg = json.error?.message || `Error HTTP ${response.status}`;
    throw new Error(errorMsg);
  }

  return json.data;
}

export const thermoApi = {
  calculateCompressibility: (params: {
    pressureBar: number;
    temperatureK: number;
    chromatography: string;
  }) => postJson<CompressibilityResponse>('/thermo/compressibility', params),

  calculateState: (params: {
    pressureBar: number;
    temperatureK: number;
    volumeLiters: number;
    chromatography: string;
  }) => postJson<StateCalculationResponse>('/thermo/calculate-state', params),

  forecastIsochoricDecay: (params: {
    cutoffPressureBar: number;
    cutoffTemperatureK: number;
    ambientTemperatureK: number;
    geometricVolumeLiters: number;
    chromatography: string;
    coolingTimeSeconds?: number;
  }) => postJson<IsochoricForecastResponse>('/thermo/isochoric-forecast', params),

  certifyAforoSabanas: (params: {
    stabilizedPressureBar: number;
    stationId: string;
  }) => postJson<AforoCertificationResponse>('/aforo/certify-sabanas', params),
};
