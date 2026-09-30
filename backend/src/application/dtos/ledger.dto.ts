// DTOs y Esquemas Zod para ReconciliationLedger (Dominio 04 / 05)
// Custodiado por: @integration-architect
// Especificación: .specs/04-reconciliation-ledger/reconciliation-ledger.spec.md

import { z } from 'zod';
import { ChromatographyInputSchema } from './thermo.dto';

export const LedgerTransactionTypeSchema = z.enum([
  'STATION_DISPATCH',
  'STATION_RECEIPT',
  'STATION_SALE_DISPENSED',
  'MERMA_APPARENT_SHRINK',
  'MERMA_PHYSICAL_LOSS',
]);

export const RecordLedgerEntrySchema = z.object({
  transactionType: LedgerTransactionTypeSchema,
  facilityCode: z.string().min(1, 'Código de instalación requerido'),
  dispatchConsecutive: z.string().optional(),
  standardVolumeSm3: z.number().positive('El volumen estándar debe ser positivo'),
  massKg: z.number().positive('La masa debe ser positiva'),
  chromatography: ChromatographyInputSchema,
  apparentMermaSm3: z.number().min(0).optional().default(0),
  physicalMermaSm3: z.number().min(0).optional().default(0),
  mermaPercentage: z.number().min(0).optional().default(0),
  recordedAt: z.string().or(z.date()).optional().transform((val) => (val ? new Date(val) : new Date())),
});

export const AnalyzeShrinkageSchema = z.object({
  dispatchConsecutive: z.string().min(1, 'Consecutivo de despacho requerido'),
  receiptConsecutive: z.string().min(1, 'Consecutivo de recibo requerido'),
  loadedMassKg: z.number().positive('La masa despachada debe ser positiva'),
  receivedMassKg: z.number().positive('La masa recibida debe ser positiva'),
  apparentThermalLossSm3: z.number().min(0).optional().default(0),
});

export type RecordLedgerEntryDto = z.infer<typeof RecordLedgerEntrySchema>;
export type AnalyzeShrinkageDto = z.infer<typeof AnalyzeShrinkageSchema>;
