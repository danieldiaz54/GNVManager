import { describe, it, expect } from 'vitest';
import {
  Cylinder,
  ModularRack,
  DispatchOperation,
  ExpiredHydrostaticTestException,
  InvalidFlowDirectionException,
  createBongaMameyProfile,
} from '../src/domain';

describe('@qa-verifier: SPEC-DOM-002 Dispatch Operations & Asset Topology Test Suite', () => {
  const bongaMamey = createBongaMameyProfile();

  // Helper para generar una batería de 11 cilindros válida
  const createValidElevenCylinderRack = (overrides?: { expiredCylinderIndex?: number }) => {
    const now = new Date('2026-10-01T12:00:00Z');
    const futureDate = new Date('2028-10-01T12:00:00Z');
    const pastDate = new Date('2025-01-01T12:00:00Z');

    const cylinders: Cylinder[] = Array.from({ length: 11 }).map((_, i) => {
      const isExpired = overrides?.expiredCylinderIndex === i;
      return new Cylinder({
        id: `cyl-${i + 1}`,
        serialNumber: `SN-2024-CIL-${(i + 1).toString().padStart(3, '0')}`,
        waterCapacityLiters: 1227.0,
        tareWeightKg: 850.0,
        manufacturingDate: new Date('2020-01-01'),
        hydrostaticTestDate: isExpired ? new Date('2020-01-01') : new Date('2023-10-01'),
        nextHydrostaticDueDate: isExpired ? pastDate : futureDate,
      });
    });

    return new ModularRack({
      id: 'rack-001',
      plateCode: 'RCK-11-SAB-01',
      rackType: 'ELEVEN_CYLINDER_13497L',
      nominalVolumeLiters: 13497.0,
      maxWorkingPressureBar: 250.0,
      cylinders,
    });
  };

  describe('1. Asset Topology & Cylinder Hydrostatic Integrity (BR-DISPATCH-002)', () => {
    it('debe validar exitosamente un rack de 11 cilindros con todas las pruebas hidrostáticas vigentes', () => {
      const rack = createValidElevenCylinderRack();
      const operationDate = new Date('2026-10-01T12:00:00Z');

      expect(rack.cylinderCount).toBe(11);
      expect(rack.nominalVolumeLiters).toBe(13497.0);
      expect(() => rack.assertAllCylindersValidForOperation(operationDate)).not.toThrow();
    });

    it('debe RECHAZAR y lanzar ExpiredHydrostaticTestException si al menos un cilindro tiene la prueba vencida', () => {
      // Cilindro #4 con prueba vencida
      const rack = createValidElevenCylinderRack({ expiredCylinderIndex: 3 });
      const operationDate = new Date('2026-10-01T12:00:00Z');

      expect(() => rack.assertAllCylindersValidForOperation(operationDate)).toThrowError(
        ExpiredHydrostaticTestException
      );
    });
  });

  describe('2. Bidirectional Flow Invariants (BR-DISPATCH-001)', () => {
    it('debe ejecutar un cargue exitoso cuando Pf > Pi y deltaM > 0', () => {
      const rack = createValidElevenCylinderRack();
      const operation = DispatchOperation.executeLoading({
        consecutiveNumber: 'DSP-2026-0001',
        stationCode: 'ST-SABANAS',
        rack,
        chromatography: bongaMamey,
        initialPressureBar: 40.0, // Retorno de estación receptora a 40 bar
        initialTemperatureK: 298.15,
        cutoffPressureBar: 250.0, // Corte tras llenado
        cutoffTemperatureK: 328.15, // 55 °C calentamiento compresivo
        ambientTemperatureK: 301.15, // 28 °C ambiente
        operationDate: new Date('2026-10-01T12:00:00Z'),
      });

      expect(operation.operationType).toBe('LOADING_DISPATCH');
      expect(operation.cutoffPressureBar).toBeGreaterThan(operation.initialPressureBar);
      expect(operation.netMassTransferredKg).toBeGreaterThan(0);
      expect(operation.netStandardVolumeSm3).toBeGreaterThan(0);
    });

    it('debe RECHAZAR cargue si Pf <= Pi (violación física de cargue)', () => {
      const rack = createValidElevenCylinderRack();

      expect(() =>
        DispatchOperation.executeLoading({
          consecutiveNumber: 'DSP-2026-0002',
          stationCode: 'ST-SABANAS',
          rack,
          chromatography: bongaMamey,
          initialPressureBar: 200.0,
          initialTemperatureK: 298.15,
          cutoffPressureBar: 180.0, // Inválido: menor presión en cargue
          cutoffTemperatureK: 320.15,
          ambientTemperatureK: 300.15,
          operationDate: new Date('2026-10-01T12:00:00Z'),
        })
      ).toThrowError(InvalidFlowDirectionException);
    });

    it('debe ejecutar un descargue exitoso cuando Pi > Pf y deltaM < 0 (entregado)', () => {
      const rack = createValidElevenCylinderRack();
      const operation = DispatchOperation.executeUnloading({
        consecutiveNumber: 'REC-2026-0001',
        stationCode: 'EDS-MEDELLIN',
        rack,
        chromatography: bongaMamey,
        initialPressureBar: 230.0, // Llega cargado a la EDS
        initialTemperatureK: 295.15,
        cutoffPressureBar: 35.0, // Descargado a la succión del compresor de la EDS
        cutoffTemperatureK: 293.15,
        operationDate: new Date('2026-10-01T18:00:00Z'),
      });

      expect(operation.operationType).toBe('UNLOADING_RECEIPT');
      expect(operation.initialPressureBar).toBeGreaterThan(operation.cutoffPressureBar);
      expect(operation.netMassTransferredKg).toBeGreaterThan(0); // Cantidad neta descargada
      expect(operation.initialMassKg).toBeGreaterThan(operation.cutoffMassKg);
    });

    it('debe RECHAZAR descargue si Pi <= Pf (violación física de descargue)', () => {
      const rack = createValidElevenCylinderRack();

      expect(() =>
        DispatchOperation.executeUnloading({
          consecutiveNumber: 'REC-2026-0002',
          stationCode: 'EDS-MEDELLIN',
          rack,
          chromatography: bongaMamey,
          initialPressureBar: 50.0,
          initialTemperatureK: 295.15,
          cutoffPressureBar: 100.0, // Inválido: mayor presión en descargue
          cutoffTemperatureK: 295.15,
          operationDate: new Date('2026-10-01T18:00:00Z'),
        })
      ).toThrowError(InvalidFlowDirectionException);
    });
  });

  describe('3. Sabanas 230 bar Certification Rule (BR-DISPATCH-003)', () => {
    it('debe CERTIFICAR el cargue en Sabanas si la presión estabilizada es >= 230 bar', () => {
      const rack = createValidElevenCylinderRack();
      const operation = DispatchOperation.executeLoading({
        consecutiveNumber: 'DSP-2026-0003',
        stationCode: 'ST-SABANAS',
        rack,
        chromatography: bongaMamey,
        initialPressureBar: 30.0,
        initialTemperatureK: 298.15,
        cutoffPressureBar: 250.0,
        cutoffTemperatureK: 310.15, // 37 °C (llenado con post-enfriamiento en manifold)
        ambientTemperatureK: 301.15, // 28 °C
        operationDate: new Date('2026-10-01T12:00:00Z'),
      });

      expect(operation.stabilizedPressureBar).toBeGreaterThanOrEqual(230.0);
      expect(operation.certificationStatus).toBe('CERTIFIED_AFT');
      expect(operation.isCertified).toBe(true);
    });

    it('debe RECHAZAR el aforo si la presión estabilizada cae por debajo de 230 bar por corte bajo o calor excesivo', () => {
      const rack = createValidElevenCylinderRack();
      const operation = DispatchOperation.executeLoading({
        consecutiveNumber: 'DSP-2026-0004',
        stationCode: 'ST-SABANAS',
        rack,
        chromatography: bongaMamey,
        initialPressureBar: 30.0,
        initialTemperatureK: 298.15,
        cutoffPressureBar: 235.0, // Corte muy bajo para disipar
        cutoffTemperatureK: 338.15, // 65 °C (mucho calor compresivo)
        ambientTemperatureK: 298.15,
        operationDate: new Date('2026-10-01T12:00:00Z'),
      });

      expect(operation.stabilizedPressureBar).toBeLessThan(230.0);
      expect(operation.certificationStatus).toBe('REJECTED_UNDERPRESSURE');
      expect(operation.isCertified).toBe(false);
      expect(operation.rejectionReason).toContain('230');
    });
  });
});
