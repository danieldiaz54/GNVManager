import { describe, it, expect } from 'vitest';
import {
  ThermodynamicEngine,
  createBongaMameyProfile,
  createCandilejasProfile,
  createGasRicoLlanoProfile,
  InvalidChromatographyException,
  ChromatographyProfileValueObject,
  ThermodynamicDivergenceException,
} from '../src/domain';

describe('@qa-verifier: SPEC-DOM-001 Thermodynamic Engine Test Suite', () => {
  describe('1. Dynamic Chromatography Profiles & Invariants', () => {
    it('debe crear exitosamente el perfil Bonga-Mamey con 96.3666% de CH4', () => {
      const profile = createBongaMameyProfile();
      expect(profile.name).toBe('Bonga-Mamey');
      expect(profile.fractions.find((f) => f.component === 'CH4')?.fraction).toBeCloseTo(0.963666, 6);
      
      const sumFractions = profile.fractions.reduce((acc, f) => acc + f.fraction, 0);
      expect(sumFractions).toBeCloseTo(1.0, 5);
      expect(profile.molecularWeight).toBeGreaterThan(16.0);
      expect(profile.molecularWeight).toBeLessThan(18.0);
      expect(profile.pseudoCriticalPressureBar).toBeGreaterThan(44);
      expect(profile.pseudoCriticalPressureBar).toBeLessThan(48);
      expect(profile.pseudoCriticalTemperatureK).toBeGreaterThan(180);
      expect(profile.pseudoCriticalTemperatureK).toBeLessThan(210);
    });

    it('debe crear exitosamente el perfil Candilejas con 99.1685% de CH4', () => {
      const profile = createCandilejasProfile();
      expect(profile.name).toBe('Candilejas');
      expect(profile.fractions.find((f) => f.component === 'CH4')?.fraction).toBeCloseTo(0.991685, 6);
      
      const sumFractions = profile.fractions.reduce((acc, f) => acc + f.fraction, 0);
      expect(sumFractions).toBeCloseTo(1.0, 5);
    });

    it('debe arrojar InvalidChromatographyException si las fracciones molares no suman 1.0 +- 1e-5', () => {
      expect(() => {
        new ChromatographyProfileValueObject({
          id: 'invalid-sum',
          name: 'Invalid Mix',
          fractions: [
            { component: 'CH4', fraction: 0.90 },
            { component: 'N2', fraction: 0.05 },
          ], // Suma 0.95 !== 1.0
        });
      }).toThrowError(InvalidChromatographyException);
    });

    it('debe arrojar InvalidChromatographyException si existe alguna fracción molar negativa', () => {
      expect(() => {
        new ChromatographyProfileValueObject({
          id: 'invalid-negative',
          name: 'Negative Mix',
          fractions: [
            { component: 'CH4', fraction: 1.05 },
            { component: 'CO2', fraction: -0.05 },
          ],
        });
      }).toThrowError(InvalidChromatographyException);
    });
  });

  describe('2. Compressibility Factor Z (Dranchuk-Abu-Kassem via Newton-Raphson)', () => {
    const engine = new ThermodynamicEngine();
    const bongaMamey = createBongaMameyProfile();

    it('debe converger para Bonga-Mamey a 200 bar y 300 K con Z en rango [0.8000, 0.8800]', () => {
      const result = engine.calculateZFactor(200.0, 300.0, bongaMamey);

      expect(result.converged).toBe(true);
      expect(result.iterations).toBeLessThan(50);
      expect(result.zFactor).toBeGreaterThanOrEqual(0.8000);
      expect(result.zFactor).toBeLessThanOrEqual(0.8800);
      expect(result.reducedDensity).toBeGreaterThan(0);
    });

    it('debe converger a condiciones casi estándar (1.01325 bar, 288.15 K) con Z cercano a 0.998', () => {
      const candilejas = createCandilejasProfile();
      const result = engine.calculateZFactor(1.01325, 288.15, candilejas);

      expect(result.converged).toBe(true);
      expect(result.zFactor).toBeGreaterThan(0.995);
      expect(result.zFactor).toBeLessThanOrEqual(1.0005);
    });

    it('debe resolver alta presión de compresión (250 bar, 320 K)', () => {
      const result = engine.calculateZFactor(250.0, 320.0, bongaMamey);
      expect(result.converged).toBe(true);
      expect(result.zFactor).toBeGreaterThan(0.80);
      expect(result.zFactor).toBeLessThan(0.95);
    });

    it('debe lanzar excepción si la presión o temperatura son menores o iguales a cero', () => {
      expect(() => engine.calculateZFactor(-10, 300, bongaMamey)).toThrow();
      expect(() => engine.calculateZFactor(200, -5, bongaMamey)).toThrow();
    });
  });

  describe('3. Mass and Standard Volume Calculation', () => {
    const engine = new ThermodynamicEngine();
    const bongaMamey = createBongaMameyProfile();

    it('debe calcular masa y Sm3 para rack de 11 cilindros (13,497 L) a 230 bar y 300 K', () => {
      const state = {
        pressureBar: 230.0,
        temperatureK: 300.0,
        volumeLiters: 13497.0,
      };

      const result = engine.calculateMassAndVolume(state, bongaMamey);

      expect(result.massKg).toBeGreaterThan(2000.0);
      expect(result.massKg).toBeLessThan(3500.0);
      expect(result.standardVolumeSm3).toBeGreaterThan(2800.0);
      expect(result.densityKgM3).toBeCloseTo(result.massKg / (state.volumeLiters / 1000.0), 1);
      expect(result.zFactor).toBeGreaterThan(0.80);
      expect(result.zFactor).toBeLessThan(0.90);
    });

    it('debe calcular masa coherente para rack de 12 cilindros (26,950 L)', () => {
      const state = {
        pressureBar: 250.0,
        temperatureK: 310.0,
        volumeLiters: 26950.0,
      };

      const result = engine.calculateMassAndVolume(state, bongaMamey);
      expect(result.massKg).toBeGreaterThan(4500.0);
      expect(result.standardVolumeSm3).toBeGreaterThan(6000.0);
    });
  });

  describe('4. Isochoric Thermal Decay Post-Shutoff (Enfriamiento post-corte)', () => {
    const engine = new ThermodynamicEngine();
    const bongaMamey = createBongaMameyProfile();

    it('debe pronosticar caída de presión por enfriamiento de 330 K a 300 K manteniendo masa constante', () => {
      const input = {
        cutoffPressureBar: 250.0,
        cutoffTemperatureK: 330.0,
        ambientTemperatureK: 300.0,
        geometricVolumeLiters: 13497.0,
        chromatography: bongaMamey,
        coolingTimeSeconds: 7200,
      };

      const forecast = engine.forecastIsochoricDecay(input);

      // La presión estabilizada debe ser menor que la de corte debido a la contracción térmica
      expect(forecast.stabilizedPressureBar).toBeLessThan(input.cutoffPressureBar);
      expect(forecast.pressureDropBar).toBeGreaterThan(15.0); // Típicamente cae entre 15 y 30 bar
      expect(forecast.stabilizedTemperatureK).toBe(input.ambientTemperatureK);

      // Conservación estricta de la masa: masa al corte == masa estabilizada
      const cutoffState = engine.calculateMassAndVolume(
        {
          pressureBar: input.cutoffPressureBar,
          temperatureK: input.cutoffTemperatureK,
          volumeLiters: input.geometricVolumeLiters,
        },
        bongaMamey
      );

      const relativeMassDiff = Math.abs(forecast.massKg - cutoffState.massKg) / cutoffState.massKg;
      expect(relativeMassDiff).toBeLessThan(1e-4);
    });
  });

  describe('5. Inviolable Sabanas Gauging Certification Rule (BR-AFORO-001)', () => {
    const engine = new ThermodynamicEngine();

    it('debe certificar exitosamente cuando Pestabilizada >= 230.00 bar', () => {
      const certExact = engine.certifyAforoSabanas(230.00, 'ST-SABANAS');
      expect(certExact.isCertified).toBe(true);
      expect(certExact.status).toBe('CERTIFIED_AFT');
      expect(certExact.stabilizedPressureBar).toBe(230.00);

      const certAbove = engine.certifyAforoSabanas(234.50, 'ST-SABANAS');
      expect(certAbove.isCertified).toBe(true);
      expect(certAbove.status).toBe('CERTIFIED_AFT');
    });

    it('debe RECHAZAR categóricamente el aforo cuando Pestabilizada < 230.00 bar', () => {
      const certUnder = engine.certifyAforoSabanas(229.99, 'ST-SABANAS');
      expect(certUnder.isCertified).toBe(false);
      expect(certUnder.status).toBe('REJECTED_UNDERPRESSURE');
      expect(certUnder.rejectionReason).toContain('230');

      const certLow = engine.certifyAforoSabanas(218.00, 'ST-SABANAS');
      expect(certLow.isCertified).toBe(false);
      expect(certLow.status).toBe('REJECTED_UNDERPRESSURE');
    });
  });
});
