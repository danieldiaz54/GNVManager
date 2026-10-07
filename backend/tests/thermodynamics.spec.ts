import { describe, it, expect } from 'vitest';
import { CalculateThermodynamicTransferUseCase } from '../src/application/use-cases/CalculateThermodynamicTransfer';
import { 
  ThermodynamicState, 
  DivergenceException, 
  PressureExceededException 
} from '../src/domain/entities/Thermodynamics';

describe('CalculateThermodynamicTransferUseCase', () => {
  const useCase = new CalculateThermodynamicTransferUseCase();

  describe('Successful transfer calculations under normal pressure (<230 bar)', () => {
    it('should calculate transfer successfully for valid states', () => {
      const initial: ThermodynamicState = { pressureBar: 50, temperatureK: 300 };
      const final: ThermodynamicState = { pressureBar: 200, temperatureK: 320 };
      const volumeLiters = 1000;

      const result = useCase.execute(initial, final, volumeLiters);

      expect(result).toBeDefined();
      expect(result.massTransferredKg).toBeGreaterThan(0);
      expect(result.volumeTransferredSm3).toBeGreaterThan(0);
      expect(result.zInitial).toBeGreaterThan(0);
      expect(result.zFinal).toBeGreaterThan(0);
      expect(result.stabilizedPressureBar).toBeLessThan(final.pressureBar); // Normally cooling down reduces pressure
      expect(result.stabilizedTempCelsius).toBe(20.0);
    });
  });

  describe('Sabanas rule (PressureExceededException)', () => {
    it('should throw PressureExceededException when initial pressure > 230 bar', () => {
      const initial: ThermodynamicState = { pressureBar: 231, temperatureK: 300 };
      const final: ThermodynamicState = { pressureBar: 200, temperatureK: 320 };
      const volumeLiters = 1000;

      expect(() => useCase.execute(initial, final, volumeLiters))
        .toThrow(PressureExceededException);
    });

    it('should throw PressureExceededException when final pressure > 230 bar', () => {
      const initial: ThermodynamicState = { pressureBar: 200, temperatureK: 300 };
      const final: ThermodynamicState = { pressureBar: 230.1, temperatureK: 320 };
      const volumeLiters = 1000;

      expect(() => useCase.execute(initial, final, volumeLiters))
        .toThrow(PressureExceededException);
    });

    it('should not throw when pressure is exactly 230 bar', () => {
      const initial: ThermodynamicState = { pressureBar: 230, temperatureK: 300 };
      const final: ThermodynamicState = { pressureBar: 230, temperatureK: 320 };
      const volumeLiters = 1000;

      expect(() => useCase.execute(initial, final, volumeLiters))
        .not.toThrow(PressureExceededException);
    });
  });

  describe('DivergenceException', () => {
    it('should throw DivergenceException for invalid edge case inputs (e.g. extremely low temp / high pressure)', () => {
      // Trying to cause divergence in Newton-Raphson. 
      // Negative temperature will definitely cause weird behavior, but let's see if we can trigger divergence with e.g. T close to 0
      // CalculateZFactor with T=0.01 and Pressure=200
      const initial: ThermodynamicState = { pressureBar: 200, temperatureK: 0.01 };
      const final: ThermodynamicState = { pressureBar: 200, temperatureK: 300 };
      const volumeLiters = 1000;

      expect(() => useCase.execute(initial, final, volumeLiters))
        .toThrow(DivergenceException);
    });
  });
});
