// Tipos de Dominio para el Libro Mayor de Conciliación Comercial (Dominio 04)
// Custodiado por: @data-architect & @integration-architect
// Especificación: .specs/04-reconciliation-ledger/reconciliation-ledger.spec.md

import { ChromatographyProfile } from './types';

export type LedgerTransactionType =
  | 'STATION_DISPATCH'
  | 'STATION_RECEIPT'
  | 'STATION_SALE_DISPENSED'
  | 'MERMA_APPARENT_SHRINK'
  | 'MERMA_PHYSICAL_LOSS';

export interface LedgerEntryProps {
  transactionIndex: number;
  transactionType: LedgerTransactionType;
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
  recordedAt: Date;
}

export interface AppendEntryInput {
  transactionType: LedgerTransactionType;
  facilityCode: string;
  dispatchConsecutive?: string;
  standardVolumeSm3: number;
  massKg: number;
  chromatography: ChromatographyProfile;
  apparentMermaSm3?: number;
  physicalMermaSm3?: number;
  mermaPercentage?: number;
  recordedAt?: Date;
}

export interface LedgerIntegrityResult {
  isValid: boolean;
  totalEntries: number;
  lastRecordHash: string;
  verifiedAt: Date;
}

export interface ShrinkageAnalysisInput {
  dispatchConsecutive: string;
  receiptConsecutive: string;
  loadedMassKg: number;
  receivedMassKg: number;
  apparentThermalLossSm3: number;
}

export interface ShrinkageAnalysisResult {
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
