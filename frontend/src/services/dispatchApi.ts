// Cliente de API tipado para Operaciones de Despacho y Topología de Activos (Dominio 02)
// Custodiado por: @integration-architect / @impeccable-designer

export interface CylinderDto {
  id: string;
  serialNumber: string;
  waterCapacityLiters: number;
  tareWeightKg: number;
  manufacturingDate: string;
  hydrostaticTestDate: string;
  nextHydrostaticDueDate: string;
}

export interface ModularRackDto {
  id: string;
  plateCode: string;
  rackType: 'ELEVEN_CYLINDER_13497L' | 'TWELVE_CYLINDER_26950L' | 'CUSTOM_MODULE';
  nominalVolumeLiters: number;
  maxWorkingPressureBar: number;
  cylinders: CylinderDto[];
}

export interface ValidateRackResponse {
  isValid: boolean;
  cylinderCount: number;
  nominalVolumeLiters: number;
  plateCode: string;
}

export interface DispatchOperationResponse {
  consecutiveNumber: string;
  stationCode: string;
  operationType: 'LOADING_DISPATCH' | 'UNLOADING_RECEIPT';
  initialPressureBar: number;
  initialTemperatureK: number;
  initialMassKg: number;
  initialStandardVolumeSm3: number;
  cutoffPressureBar: number;
  cutoffTemperatureK: number;
  cutoffMassKg: number;
  cutoffStandardVolumeSm3: number;
  stabilizedPressureBar?: number;
  stabilizedTemperatureK?: number;
  netMassTransferredKg: number;
  netStandardVolumeSm3: number;
  certificationStatus: 'CERTIFIED_AFT' | 'REJECTED_UNDERPRESSURE' | 'NON_COMPLIANT';
  isCertified: boolean;
  rejectionReason?: string;
  operationDate: string;
}

const API_BASE = '/api/v1/dispatch';

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

export const dispatchApi = {
  validateRack: (params: { rack: ModularRackDto; operationDate?: string }) =>
    postJson<ValidateRackResponse>('/validate-rack', params),

  executeLoading: (params: {
    consecutiveNumber: string;
    stationCode: string;
    rack: ModularRackDto;
    chromatography: string;
    initialPressureBar: number;
    initialTemperatureK: number;
    cutoffPressureBar: number;
    cutoffTemperatureK: number;
    ambientTemperatureK: number;
    operationDate?: string;
  }) => postJson<DispatchOperationResponse>('/execute-loading', params),

  executeUnloading: (params: {
    consecutiveNumber: string;
    stationCode: string;
    rack: ModularRackDto;
    chromatography: string;
    initialPressureBar: number;
    initialTemperatureK: number;
    cutoffPressureBar: number;
    cutoffTemperatureK: number;
    operationDate?: string;
  }) => postJson<DispatchOperationResponse>('/execute-unloading', params),
};
