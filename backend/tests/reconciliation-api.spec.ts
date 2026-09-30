import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/infrastructure/server';

describe('@qa-verifier: SPEC-DOM-004 Reconciliation Ledger API Contracts', () => {
  describe('1. POST /api/v1/ledger/record-entry', () => {
    it('debe registrar un asiento inmutable en el ledger y calcular MMBTU y Hash SHA-256', async () => {
      const response = await request(app)
        .post('/api/v1/ledger/record-entry')
        .send({
          transactionType: 'STATION_DISPATCH',
          facilityCode: 'ST-SABANAS',
          dispatchConsecutive: 'DSP-LED-0001',
          standardVolumeSm3: 3500.0,
          massKg: 2500.0,
          chromatography: 'Bonga-Mamey',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.transactionIndex).toBeGreaterThanOrEqual(1);
      expect(response.body.data.recordHash).toHaveLength(64);
      expect(response.body.data.energyMmbtu).toBeGreaterThan(100);
    });
  });

  describe('2. GET /api/v1/ledger/verify-integrity', () => {
    it('debe verificar la integridad criptográfica de la cadena del ledger', async () => {
      const response = await request(app).get('/api/v1/ledger/verify-integrity');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(true);
    });
  });

  describe('3. POST /api/v1/ledger/analyze-shrinkage', () => {
    it('debe analizar y categorizar merma en ruta tolerada', async () => {
      const response = await request(app)
        .post('/api/v1/ledger/analyze-shrinkage')
        .send({
          dispatchConsecutive: 'DSP-LED-0001',
          receiptConsecutive: 'REC-LED-0001',
          loadedMassKg: 2500.0,
          receivedMassKg: 2494.0,
          apparentThermalLossSm3: 50.0,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.physicalLossMassKg).toBe(6.0);
      expect(response.body.data.lossPercentage).toBeCloseTo(0.24, 2);
      expect(response.body.data.isLossTolerated).toBe(true);
      expect(response.body.data.status).toBe('TOLERATED_PURGE');
    });

    it('debe alertar ANOMALY_PHYSICAL_LOSS si la merma supera el 0.50%', async () => {
      const response = await request(app)
        .post('/api/v1/ledger/analyze-shrinkage')
        .send({
          dispatchConsecutive: 'DSP-LED-0002',
          receiptConsecutive: 'REC-LED-0002',
          loadedMassKg: 2500.0,
          receivedMassKg: 2400.0, // 100 kg pérdida (4.00%)
          apparentThermalLossSm3: 50.0,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.lossPercentage).toBe(4.0);
      expect(response.body.data.isLossTolerated).toBe(false);
      expect(response.body.data.status).toBe('ANOMALY_PHYSICAL_LOSS');
    });
  });
});
