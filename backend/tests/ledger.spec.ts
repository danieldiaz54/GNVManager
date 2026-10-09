import { describe, it, expect } from 'vitest';
import { UpdateSaleVolumeUseCase } from '../src/application/use-cases/UpdateSaleVolume';
import type { IReconciliationRepository, ReconciliationRecordEntity } from '../src/domain/repositories/IReconciliationRepository';

class MockAppendOnlyLedgerRepository implements IReconciliationRepository {
  private records: Map<string, ReconciliationRecordEntity> = new Map();

  async save(record: ReconciliationRecordEntity): Promise<ReconciliationRecordEntity> {
    const id = record.id || 'rec-' + Date.now();
    const created: ReconciliationRecordEntity = {
      ...record,
      id,
      createdAt: new Date(),
      events: []
    };
    this.records.set(id, created);
    return created;
  }

  async saveRack(): Promise<ReconciliationRecordEntity> {
    throw new Error('Not implemented');
  }

  async findById(id: string): Promise<ReconciliationRecordEntity | null> {
    const found = this.records.get(id);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }

  async findAll(): Promise<ReconciliationRecordEntity[]> {
    return Array.from(this.records.values());
  }

  async updateSaleVolume(id: string, saleVolumeSm3: number): Promise<ReconciliationRecordEntity> {
    const existing = this.records.get(id);
    if (!existing) {
      throw new Error(`Record with ID ${id} not found`);
    }

    // Ledger Invariant: Append-only event generation, base initial values are immutable
    const newEvent = {
      id: 'event-' + ((existing.events?.length || 0) + 1),
      recordId: id,
      eventType: 'SALE_DISPENSED',
      saleVolumeSm3,
      createdAt: new Date()
    };

    const updatedEvents = [...(existing.events || []), newEvent];
    const updatedRecord = {
      ...existing,
      events: updatedEvents
    };

    this.records.set(id, updatedRecord);
    return JSON.parse(JSON.stringify(updatedRecord));
  }
}

describe('Append-Only Ledger Integrity', () => {
  it('should maintain immutable initial calculations and append events sequentially without destructive mutations', async () => {
    const repo = new MockAppendOnlyLedgerRepository();
    const initialRecord: ReconciliationRecordEntity = {
      id: 'rec-test-01',
      recordType: 'INDIVIDUAL',
      moduleCapacityLiters: 1500,
      initialPressureBar: 200,
      initialTempK: 300,
      finalPressureBar: 50,
      finalTempK: 290,
      calculatedMassKg: 120.5,
      calculatedVolumeSm3: 155.2
    };

    const saved = await repo.save(initialRecord);
    expect(saved.events).toEqual([]);

    const useCase = new UpdateSaleVolumeUseCase(repo);

    // First sale event appended
    const updated1 = await useCase.execute('rec-test-01', 50.0);
    expect(updated1.events).toHaveLength(1);
    expect(updated1.events?.[0].saleVolumeSm3).toBe(50.0);
    // Base physical calculated volume must remain unaltered
    expect(updated1.calculatedVolumeSm3).toBe(155.2);
    expect(updated1.calculatedMassKg).toBe(120.5);

    // Second sale event appended (audit trail)
    const updated2 = await useCase.execute('rec-test-01', 30.5);
    expect(updated2.events).toHaveLength(2);
    expect(updated2.events?.[0].saleVolumeSm3).toBe(50.0);
    expect(updated2.events?.[1].saleVolumeSm3).toBe(30.5);

    // Ensure base thermodynamic values are still untouched
    expect(updated2.calculatedVolumeSm3).toBe(155.2);
    expect(updated2.initialPressureBar).toBe(200);
    expect(updated2.finalPressureBar).toBe(50);
  });

  it('should reject destructive negative sale volume mutations', async () => {
    const repo = new MockAppendOnlyLedgerRepository();
    await repo.save({
      id: 'rec-test-02',
      moduleCapacityLiters: 1000,
      initialPressureBar: 200,
      initialTempK: 300,
      finalPressureBar: 50,
      finalTempK: 290,
      calculatedMassKg: 100,
      calculatedVolumeSm3: 130
    });

    const useCase = new UpdateSaleVolumeUseCase(repo);
    await expect(useCase.execute('rec-test-02', -10))
      .rejects.toThrow('El volumen de venta no puede ser negativo.');

    // Verify no events were recorded
    const record = await repo.findById('rec-test-02');
    expect(record?.events).toHaveLength(0);
  });
});
