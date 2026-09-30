import { describe, it, expect } from 'vitest';
import {
  ReconciliationLedger,
  ReconciliationEntry,
  ShrinkageAnalyzer,
  LedgerTamperedException,
  createBongaMameyProfile,
} from '../src/domain';

describe('@qa-verifier: SPEC-DOM-004 Reconciliation Ledger & Shrinkage Test Suite', () => {
  const bongaMamey = createBongaMameyProfile();

  describe('1. Cryptographic Hash Chaining & Append-Only Invariants (BR-LEDGER-001)', () => {
    it('debe registrar asientos secuenciales con hash SHA-256 encadenado y verificar integridad', () => {
      const ledger = new ReconciliationLedger();

      // Registro #1 (Génesis)
      const entry1 = ledger.appendEntry({
        transactionType: 'STATION_DISPATCH',
        facilityCode: 'ST-SABANAS',
        dispatchConsecutive: 'DSP-2026-0001',
        standardVolumeSm3: 3500.0,
        massKg: 2500.0,
        chromatography: bongaMamey,
      });

      expect(entry1.transactionIndex).toBe(1);
      expect(entry1.previousRecordHash).toBe('GENESIS_RECORD_GNV_MANAGER');
      expect(entry1.recordHash).toHaveLength(64); // SHA-256 hex string

      // Registro #2
      const entry2 = ledger.appendEntry({
        transactionType: 'STATION_RECEIPT',
        facilityCode: 'EDS-MEDELLIN',
        dispatchConsecutive: 'REC-2026-0001',
        standardVolumeSm3: 3493.0,
        massKg: 2495.0,
        chromatography: bongaMamey,
      });

      expect(entry2.transactionIndex).toBe(2);
      expect(entry2.previousRecordHash).toBe(entry1.recordHash);

      // Verificación de integridad de toda la cadena
      const integrity = ledger.verifyLedgerIntegrity();
      expect(integrity.isValid).toBe(true);
      expect(integrity.totalEntries).toBe(2);
    });

    it('debe DETECTAR manipulación o fraude si se altera un registro histórico (LedgerTamperedException)', () => {
      const ledger = new ReconciliationLedger();

      ledger.appendEntry({
        transactionType: 'STATION_DISPATCH',
        facilityCode: 'ST-SABANAS',
        dispatchConsecutive: 'DSP-2026-0001',
        standardVolumeSm3: 3500.0,
        massKg: 2500.0,
        chromatography: bongaMamey,
      });

      ledger.appendEntry({
        transactionType: 'STATION_RECEIPT',
        facilityCode: 'EDS-MEDELLIN',
        dispatchConsecutive: 'REC-2026-0001',
        standardVolumeSm3: 3493.0,
        massKg: 2495.0,
        chromatography: bongaMamey,
      });

      // Intento fraudulento: alterar el valor de masa del registro #1 directamente
      const entries = ledger.getAllEntries();
      // Modificamos fraudulentamente la masa del asiento 1
      (entries[0] as any).massKg = 2800.0;

      expect(() => ledger.verifyLedgerIntegrity()).toThrowError(LedgerTamperedException);
    });
  });

  describe('2. Energy Conversion to MMBTU (BR-LEDGER-002)', () => {
    it('debe calcular MMBTU correctamente a partir del HHV cromatográfico de Bonga-Mamey', () => {
      const ledger = new ReconciliationLedger();
      const entry = ledger.appendEntry({
        transactionType: 'STATION_DISPATCH',
        facilityCode: 'ST-SABANAS',
        dispatchConsecutive: 'DSP-2026-0002',
        standardVolumeSm3: 1000.0, // 1000 Sm3
        massKg: 715.0,
        chromatography: bongaMamey,
      });

      // 1000 Sm3 * 35.3146667 scf/Sm3 * 1030.5 BTU/scf / 1e6 ≈ 36.39 MMBTU
      expect(entry.energyMmbtu).toBeCloseTo(36.39, 1);
    });
  });

  describe('3. Shrinkage Segregation: Apparent vs Physical Loss (BR-LEDGER-003)', () => {
    it('debe clasificar como TOLERATED_PURGE una merma en ruta normal (<= 0.50%)', () => {
      const analysis = ShrinkageAnalyzer.analyzeTransitLoss({
        dispatchConsecutive: 'DSP-2026-0001',
        receiptConsecutive: 'REC-2026-0001',
        loadedMassKg: 2500.0,
        receivedMassKg: 2495.0, // 5 kg de pérdida en mangueras de manifold
        apparentThermalLossSm3: 45.0,
      });

      expect(analysis.physicalLossMassKg).toBe(5.0);
      expect(analysis.lossPercentage).toBeCloseTo(0.20, 2);
      expect(analysis.isLossTolerated).toBe(true);
      expect(analysis.status).toBe('TOLERATED_PURGE');
    });

    it('debe DISPARAR ALERTA ANOMALY_PHYSICAL_LOSS si la merma en ruta supera el 0.50%', () => {
      const analysis = ShrinkageAnalyzer.analyzeTransitLoss({
        dispatchConsecutive: 'DSP-2026-0002',
        receiptConsecutive: 'REC-2026-0002',
        loadedMassKg: 2500.0,
        receivedMassKg: 2450.0, // 50 kg de pérdida (2.00%)
        apparentThermalLossSm3: 45.0,
      });

      expect(analysis.physicalLossMassKg).toBe(50.0);
      expect(analysis.lossPercentage).toBeCloseTo(2.00, 2);
      expect(analysis.isLossTolerated).toBe(false);
      expect(analysis.status).toBe('ANOMALY_PHYSICAL_LOSS');
    });
  });
});
