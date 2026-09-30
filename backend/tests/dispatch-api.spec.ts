import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/infrastructure/server';

describe('@qa-verifier: SPEC-DOM-002 Dispatch Operations API Contracts', () => {
  const validElevenCylinders = Array.from({ length: 11 }).map((_, i) => ({
    id: `cyl-${i + 1}`,
    serialNumber: `SN-2024-CIL-${(i + 1).toString().padStart(3, '0')}`,
    waterCapacityLiters: 1227.0,
    tareWeightKg: 850.0,
    manufacturingDate: '2020-01-01T00:00:00.000Z',
    hydrostaticTestDate: '2023-10-01T00:00:00.000Z',
    nextHydrostaticDueDate: '2028-10-01T00:00:00.000Z',
  }));

  const validRack = {
    id: 'rack-001',
    plateCode: 'RCK-11-SAB-01',
    rackType: 'ELEVEN_CYLINDER_13497L',
    nominalVolumeLiters: 13497.0,
    maxWorkingPressureBar: 250.0,
    cylinders: validElevenCylinders,
  };

  describe('1. POST /api/v1/dispatch/validate-rack', () => {
    it('debe validar exitosamente un rack con cilindros conformes', async () => {
      const response = await request(app)
        .post('/api/v1/dispatch/validate-rack')
        .send({ rack: validRack });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(true);
      expect(response.body.data.cylinderCount).toBe(11);
    });

    it('debe rechazar (422) si un cilindro tiene la prueba hidrostática vencida', async () => {
      const expiredCylinders = [...validElevenCylinders];
      expiredCylinders[2] = {
        ...expiredCylinders[2],
        nextHydrostaticDueDate: '2023-01-01T00:00:00.000Z', // Vencida
      };

      const response = await request(app)
        .post('/api/v1/dispatch/validate-rack')
        .send({
          rack: {
            ...validRack,
            cylinders: expiredCylinders,
          },
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('DOMAIN_ERROR');
      expect(response.body.error.message).toContain('vencida');
    });
  });

  describe('2. POST /api/v1/dispatch/execute-loading', () => {
    it('debe ejecutar un cargue exitoso y certificar aforo en Sabanas', async () => {
      const response = await request(app)
        .post('/api/v1/dispatch/execute-loading')
        .send({
          consecutiveNumber: 'DSP-API-0001',
          stationCode: 'ST-SABANAS',
          rack: validRack,
          chromatography: 'Bonga-Mamey',
          initialPressureBar: 35.0,
          initialTemperatureK: 298.15,
          cutoffPressureBar: 250.0,
          cutoffTemperatureK: 310.15,
          ambientTemperatureK: 301.15,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.operationType).toBe('LOADING_DISPATCH');
      expect(response.body.data.netMassTransferredKg).toBeGreaterThan(2000);
      expect(response.body.data.isCertified).toBe(true);
      expect(response.body.data.certificationStatus).toBe('CERTIFIED_AFT');
    });

    it('debe rechazar (422) si la presión final es menor o igual a la inicial', async () => {
      const response = await request(app)
        .post('/api/v1/dispatch/execute-loading')
        .send({
          consecutiveNumber: 'DSP-API-0002',
          stationCode: 'ST-SABANAS',
          rack: validRack,
          chromatography: 'Bonga-Mamey',
          initialPressureBar: 200.0,
          initialTemperatureK: 298.15,
          cutoffPressureBar: 150.0, // Inválido para cargue
          cutoffTemperatureK: 310.15,
          ambientTemperatureK: 301.15,
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('DOMAIN_ERROR');
    });
  });

  describe('3. POST /api/v1/dispatch/execute-unloading', () => {
    it('debe ejecutar un descargue exitoso en estación receptora', async () => {
      const response = await request(app)
        .post('/api/v1/dispatch/execute-unloading')
        .send({
          consecutiveNumber: 'REC-API-0001',
          stationCode: 'EDS-MEDELLIN',
          rack: validRack,
          chromatography: 'Bonga-Mamey',
          initialPressureBar: 230.0,
          initialTemperatureK: 295.15,
          cutoffPressureBar: 35.0,
          cutoffTemperatureK: 293.15,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.operationType).toBe('UNLOADING_RECEIPT');
      expect(response.body.data.netMassTransferredKg).toBeGreaterThan(2000);
    });
  });
});
