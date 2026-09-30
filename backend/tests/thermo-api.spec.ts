import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/infrastructure/server';

describe('@qa-verifier: SPEC-API-001 Thermodynamic & Aforo API Contracts', () => {
  describe('1. POST /api/v1/thermo/compressibility', () => {
    it('debe calcular Z exitosamente para el perfil preconfigurado Bonga-Mamey', async () => {
      const response = await request(app)
        .post('/api/v1/thermo/compressibility')
        .send({
          pressureBar: 200.0,
          temperatureK: 300.0,
          chromatography: 'Bonga-Mamey',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.converged).toBe(true);
      expect(response.body.data.zFactor).toBeGreaterThanOrEqual(0.80);
      expect(response.body.data.zFactor).toBeLessThanOrEqual(0.88);
      expect(response.body.data.reducedDensity).toBeGreaterThan(0);
    });

    it('debe retornar 400 VALIDATION_ERROR si la presión es negativa o cero', async () => {
      const response = await request(app)
        .post('/api/v1/thermo/compressibility')
        .send({
          pressureBar: -50.0,
          temperatureK: 300.0,
          chromatography: 'Bonga-Mamey',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('2. POST /api/v1/thermo/calculate-state', () => {
    it('debe calcular masa física y volumen normalizado Sm3 para rack de 11 cilindros (13,497 L)', async () => {
      const response = await request(app)
        .post('/api/v1/thermo/calculate-state')
        .send({
          pressureBar: 230.0,
          temperatureK: 300.0,
          volumeLiters: 13497.0,
          chromatography: 'Bonga-Mamey',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.massKg).toBeGreaterThan(2000);
      expect(response.body.data.standardVolumeSm3).toBeGreaterThan(2800);
      expect(response.body.data.densityKgM3).toBeGreaterThan(150);
      expect(response.body.data.zFactor).toBeGreaterThan(0.80);
    });

    it('debe retornar 400 si el volumen geométrico es inválido', async () => {
      const response = await request(app)
        .post('/api/v1/thermo/calculate-state')
        .send({
          pressureBar: 230.0,
          temperatureK: 300.0,
          volumeLiters: 0,
          chromatography: 'Bonga-Mamey',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('3. POST /api/v1/thermo/isochoric-forecast', () => {
    it('debe pronosticar caída de presión post-corte por enfriamiento isocórico', async () => {
      const response = await request(app)
        .post('/api/v1/thermo/isochoric-forecast')
        .send({
          cutoffPressureBar: 250.0,
          cutoffTemperatureK: 330.0,
          ambientTemperatureK: 300.0,
          geometricVolumeLiters: 13497.0,
          chromatography: 'Bonga-Mamey',
          coolingTimeSeconds: 7200,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.stabilizedPressureBar).toBeLessThan(250.0);
      expect(response.body.data.pressureDropBar).toBeGreaterThan(15.0);
      expect(response.body.data.massKg).toBeGreaterThan(2000);
      expect(response.body.data.stabilizedTemperatureK).toBe(300.0);
    });
  });

  describe('4. POST /api/v1/aforo/certify-sabanas', () => {
    it('debe CERTIFICAR aforo si la presión estabilizada es >= 230.00 bar', async () => {
      const response = await request(app)
        .post('/api/v1/aforo/certify-sabanas')
        .send({
          stabilizedPressureBar: 231.42,
          stationId: 'ST-SABANAS',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isCertified).toBe(true);
      expect(response.body.data.status).toBe('CERTIFIED_AFT');
      expect(response.body.data.thresholdBar).toBe(230.0);
    });

    it('debe RECHAZAR aforo si la presión estabilizada es < 230.00 bar', async () => {
      const response = await request(app)
        .post('/api/v1/aforo/certify-sabanas')
        .send({
          stabilizedPressureBar: 228.50,
          stationId: 'ST-SABANAS',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isCertified).toBe(false);
      expect(response.body.data.status).toBe('REJECTED_UNDERPRESSURE');
      expect(response.body.data.rejectionReason).toContain('230');
    });

    it('debe retornar 400 si falta el identificador de estación', async () => {
      const response = await request(app)
        .post('/api/v1/aforo/certify-sabanas')
        .send({
          stabilizedPressureBar: 235.0,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
