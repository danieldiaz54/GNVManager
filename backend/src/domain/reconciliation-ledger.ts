// Agregado de Dominio: Libro Mayor Inmutable de Conciliación (ReconciliationLedger)
// Custodiado por: @data-architect
// Especificación: .specs/04-reconciliation-ledger/reconciliation-ledger.spec.md

import { LedgerTamperedException } from './exceptions';
import { AppendEntryInput, LedgerIntegrityResult } from './ledger-types';
import { ReconciliationEntry } from './reconciliation-entry';

export class ReconciliationLedger {
  public static readonly GENESIS_HASH = 'GENESIS_RECORD_GNV_MANAGER';
  private entries: ReconciliationEntry[] = [];

  constructor(initialEntries: ReconciliationEntry[] = []) {
    this.entries = [...initialEntries];
  }

  /**
   * Asienta una nueva transacción inmutable en el libro mayor (Append-Only)
   */
  public appendEntry(input: AppendEntryInput): ReconciliationEntry {
    const transactionIndex = this.entries.length + 1;
    const recordedAt = input.recordedAt || new Date();

    const previousRecordHash =
      this.entries.length === 0
        ? ReconciliationLedger.GENESIS_HASH
        : this.entries[this.entries.length - 1].recordHash;

    const energyMmbtu = ReconciliationEntry.calculateEnergyMmbtu(
      input.standardVolumeSm3,
      input.chromatography.higherHeatingValueBtuScf || 1030.5
    );

    const baseProps = {
      transactionIndex,
      transactionType: input.transactionType,
      facilityCode: input.facilityCode,
      dispatchConsecutive: input.dispatchConsecutive,
      energyMmbtu,
      standardVolumeSm3: input.standardVolumeSm3,
      massKg: input.massKg,
      apparentMermaSm3: input.apparentMermaSm3,
      physicalMermaSm3: input.physicalMermaSm3,
      mermaPercentage: input.mermaPercentage,
      previousRecordHash,
      recordedAt,
    };

    const recordHash = ReconciliationEntry.computeHash(baseProps);

    const newEntry = new ReconciliationEntry({
      ...baseProps,
      recordHash,
    });

    this.entries.push(newEntry);
    return newEntry;
  }

  /**
   * Recorre la cadena completa del ledger y verifica la integridad criptográfica
   * Si un registro histórico fue alterado, lanza LedgerTamperedException
   */
  public verifyLedgerIntegrity(): LedgerIntegrityResult {
    let expectedPreviousHash = ReconciliationLedger.GENESIS_HASH;

    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];
      const expectedIndex = i + 1;

      // 1. Verificación de índice contiguo
      if (entry.transactionIndex !== expectedIndex) {
        throw new LedgerTamperedException(
          entry.transactionIndex,
          `Índice discontinuo detectado. Se esperaba ${expectedIndex}, recibido ${entry.transactionIndex}`
        );
      }

      // 2. Verificación de encadenamiento con el hash previo
      if (entry.previousRecordHash !== expectedPreviousHash) {
        throw new LedgerTamperedException(
          entry.transactionIndex,
          `Ruptura de encadenamiento. previousRecordHash no coincide con el hash del asiento anterior`
        );
      }

      // 3. Verificación de autenticidad del hash (Recomputación SHA-256)
      const recomputedHash = ReconciliationEntry.computeHash({
        transactionIndex: entry.transactionIndex,
        transactionType: entry.transactionType,
        facilityCode: entry.facilityCode,
        dispatchConsecutive: entry.dispatchConsecutive,
        energyMmbtu: entry.energyMmbtu,
        standardVolumeSm3: entry.standardVolumeSm3,
        massKg: entry.massKg,
        apparentMermaSm3: entry.apparentMermaSm3,
        physicalMermaSm3: entry.physicalMermaSm3,
        mermaPercentage: entry.mermaPercentage,
        previousRecordHash: entry.previousRecordHash,
        recordedAt: entry.recordedAt,
      });

      if (recomputedHash !== entry.recordHash) {
        throw new LedgerTamperedException(
          entry.transactionIndex,
          `Discrepancia en la firma digital SHA-256. El contenido del registro ha sido alterado fraudulentamente`
        );
      }

      expectedPreviousHash = entry.recordHash;
    }

    return {
      isValid: true,
      totalEntries: this.entries.length,
      lastRecordHash: expectedPreviousHash,
      verifiedAt: new Date(),
    };
  }

  public getAllEntries(): ReconciliationEntry[] {
    return [...this.entries];
  }

  public getEntryByIndex(index: number): ReconciliationEntry | undefined {
    return this.entries.find((e) => e.transactionIndex === index);
  }

  public get totalEntries(): number {
    return this.entries.length;
  }
}
