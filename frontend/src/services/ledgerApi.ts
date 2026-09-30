// Cliente de API tipado para ReconciliationLedger (Dominio 04)
// Custodiado por: @integration-architect / @impeccable-designer

export interface LedgerEntryDto {
  transactionIndex: number;
  transactionType:
    | 'STATION_DISPATCH'
    | 'STATION_RECEIPT'
    | 'STATION_SALE_DISPENSED'
    | 'MERMA_APPARENT_SHRINK'
    | 'MERMA_PHYSICAL_LOSS';
  facilityCode: string;
  dispatchConsecutive?: string;
  energyMmbtu: number;
  standardVolumeSm3: number;
  massKg: number;
  apparentMermaSm3?: number;
  physicalMermaSm3?: number;
  mermaPercentage?: number;
  previousRecordHash: string;
  recordHash: string;
  recordedAt: string;
}

export interface LedgerIntegrityResponse {
  isValid: boolean;
  totalEntries: number;
  lastRecordHash: string;
  verifiedAt: string;
}

export interface ShrinkageAnalysisResponse {
  dispatchConsecutive: string;
  receiptConsecutive: string;
  loadedMassKg: number;
  receivedMassKg: number;
  physicalLossMassKg: number;
  lossPercentage: number;
  isLossTolerated: boolean;
  status: 'OPTIMAL' | 'TOLERATED_PURGE' | 'ANOMALY_PHYSICAL_LOSS';
  apparentThermalLossSm3: number;
}

const API_BASE = '/api/v1/ledger';

async function getJson<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`);
  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || `Error HTTP ${response.status}`);
  }
  return json.data;
}

async function postJson<T>(endpoint: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || `Error HTTP ${response.status}`);
  }
  return json.data;
}

export const ledgerApi = {
  recordEntry: (params: {
    transactionType: string;
    facilityCode: string;
    dispatchConsecutive?: string;
    standardVolumeSm3: number;
    massKg: number;
    chromatography: string;
    apparentMermaSm3?: number;
    physicalMermaSm3?: number;
  }) => postJson<LedgerEntryDto>('/record-entry', params),

  verifyIntegrity: () => getJson<LedgerIntegrityResponse>('/verify-integrity'),

  analyzeShrinkage: (params: {
    dispatchConsecutive: string;
    receiptConsecutive: string;
    loadedMassKg: number;
    receivedMassKg: number;
    apparentThermalLossSm3?: number;
  }) => postJson<ShrinkageAnalysisResponse>('/analyze-shrinkage', params),

  getAllEntries: () => getJson<LedgerEntryDto[]>('/entries'),
};
