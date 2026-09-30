// Servicio de Aplicación: Orquestación de Casos de Uso Termodinámicos y Aforos
// Custodiado por: @integration-architect

import {
  AforoCertification,
  ChromatographyProfile,
  ChromatographyProfileValueObject,
  CompressibilityResult,
  createBongaMameyProfile,
  createCandilejasProfile,
  createGasRicoLlanoProfile,
  IsochoricForecastResult,
  IThermodynamicEngine,
  MassVolumeResult,
  ThermodynamicEngine,
} from '../../domain';
import {
  CalculateCompressibilityDto,
  CalculateStateDto,
  CertifyAforoSabanasDto,
  ChromatographyInput,
  IsochoricForecastDto,
} from '../dtos/thermo.dto';

export class ThermoApplicationService {
  private readonly engine: IThermodynamicEngine;

  constructor(engine?: IThermodynamicEngine) {
    this.engine = engine || new ThermodynamicEngine();
  }

  /**
   * Resuelve el perfil cromatográfico a partir del DTO (preset o personalizado)
   */
  public resolveChromatography(input: ChromatographyInput): ChromatographyProfile {
    if (typeof input === 'string') {
      switch (input) {
        case 'Bonga-Mamey':
          return createBongaMameyProfile();
        case 'Candilejas':
          return createCandilejasProfile();
        case 'Gas Rico Llano':
          return createGasRicoLlanoProfile();
        default:
          throw new Error(`Perfil cromatográfico preconfigurado no reconocido: ${input}`);
      }
    }

    return new ChromatographyProfileValueObject({
      id: input.id || 'custom-profile',
      name: input.name,
      fractions: input.fractions,
      higherHeatingValueBtuScf: input.higherHeatingValueBtuScf,
    });
  }

  /**
   * Caso de Uso: Calcular factor Z y densidad reducida
   */
  public calculateCompressibility(dto: CalculateCompressibilityDto): CompressibilityResult {
    const profile = this.resolveChromatography(dto.chromatography);
    return this.engine.calculateZFactor(dto.pressureBar, dto.temperatureK, profile);
  }

  /**
   * Caso de Uso: Calcular masa, densidad y volumen normalizado Sm3
   */
  public calculateState(dto: CalculateStateDto): MassVolumeResult {
    const profile = this.resolveChromatography(dto.chromatography);
    return this.engine.calculateMassAndVolume(
      {
        pressureBar: dto.pressureBar,
        temperatureK: dto.temperatureK,
        volumeLiters: dto.volumeLiters,
      },
      profile
    );
  }

  /**
   * Caso de Uso: Pronóstico isocórico de enfriamiento y caída de presión
   */
  public isochoricForecast(dto: IsochoricForecastDto): IsochoricForecastResult {
    const profile = this.resolveChromatography(dto.chromatography);
    return this.engine.forecastIsochoricDecay({
      cutoffPressureBar: dto.cutoffPressureBar,
      cutoffTemperatureK: dto.cutoffTemperatureK,
      ambientTemperatureK: dto.ambientTemperatureK,
      geometricVolumeLiters: dto.geometricVolumeLiters,
      chromatography: profile,
      coolingTimeSeconds: dto.coolingTimeSeconds,
    });
  }

  /**
   * Caso de Uso: Certificación de Aforo en Sabanas (P >= 230 bar)
   */
  public certifyAforoSabanas(dto: CertifyAforoSabanasDto): AforoCertification {
    return this.engine.certifyAforoSabanas(dto.stabilizedPressureBar, dto.stationId);
  }
}
