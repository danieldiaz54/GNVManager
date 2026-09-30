// Entidad de Asiento Inmutable del Libro Mayor de Conciliación
// Custodiado por: @data-architect
// Especificación: .specs/04-reconciliation-ledger/reconciliation-ledger.spec.md

import crypto from 'crypto';
import { LedgerEntryProps, LedgerTransactionType } from './ledger-types';

export class ReconciliationEntry implements LedgerEntryProps {
  public readonly transactionIndex: number;
  public readonly transactionType: LedgerTransactionType;
  public readonly facilityCode: string;
  public readonly dispatchConsecutive?: string;
  public readonly energyMmbtu: number;
  public readonly standardVolumeSm3: number;
  public readonly massKg: number;
  public readonly apparentMermaSm3?: number;
  public readonly physicalMermaSm3?: number;
  public readonly mermaPercentage?: number;
  public readonly previousRecordHash: string;
  public readonly recordHash: string;
  public readonly recordedAt: Date;

  constructor(props: LedgerEntryProps) {
    this.transactionIndex = props.transactionIndex;
    this.transactionType = props.transactionType;
    this.facilityCode = props.facilityCode;
    this.dispatchConsecutive = props.dispatchConsecutive;
    this.energyMmbtu = props.energyMmbtu;
    this.standardVolumeSm3 = props.standardVolumeSm3;
    this.massKg = props.massKg;
    this.apparentMermaSm3 = props.apparentMermaSm3;
    this.physicalMermaSm3 = props.physicalMermaSm3;
    this.mermaPercentage = props.mermaPercentage;
    this.previousRecordHash = props.previousRecordHash;
    this.recordHash = props.recordHash;
    this.recordedAt = props.recordedAt;
  }

  /**
   * Genera el payload canónico para el cálculo del hash criptográfico SHA-256
   */
  public static computePayload(props: Omit<LedgerEntryProps, 'recordHash'>): string {
    return [
      props.transactionIndex,
      props.previousRecordHash,
      props.transactionType,
      props.facilityCode,
      props.dispatchConsecutive || 'NONE',
      props.massKg.toFixed(4),
      props.standardVolumeSm3.toFixed(4),
      props.energyMmbtu.toFixed(4),
      props.recordedAt.toISOString(),
    ].join('|');
  }

  /**
   * Computa el hash SHA-256 de un asiento
   */
  public static computeHash(props: Omit<LedgerEntryProps, 'recordHash'>): string {
    const payload = this.computePayload(props);
    return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
  }

  /**
   * Convierte volumen estándar Sm3 a energía equivalente en MMBTU según poder calorífico (HHV)
   */
  public static calculateEnergyMmbtu(
    standardVolumeSm3: number,
    higherHeatingValueBtuScf: number = 1030.5
  ): number {
    const SCF_PER_SM3 = 35.3146667;
    const totalScf = standardVolumeSm3 * SCF_PER_SM3;
    const totalBtu = totalScf * higherHeatingValueBtuScf;
    return totalBtu / 1_000_000.0;
  }
}
