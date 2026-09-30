// Servicio de Aplicación para Despachos y Topología Física
// Custodiado por: @integration-architect

import {
  DispatchOperation,
  ModularRack,
  ThermodynamicEngine,
} from '../../domain';
import {
  ExecuteLoadingDto,
  ExecuteUnloadingDto,
  ValidateRackDto,
} from '../dtos/dispatch.dto';
import { ThermoApplicationService } from './thermo-application.service';

export class DispatchApplicationService {
  private readonly thermoService: ThermoApplicationService;
  private readonly thermoEngine: ThermodynamicEngine;

  constructor(
    thermoService?: ThermoApplicationService,
    thermoEngine?: ThermodynamicEngine
  ) {
    this.thermoService = thermoService || new ThermoApplicationService();
    this.thermoEngine = thermoEngine || new ThermodynamicEngine();
  }

  /**
   * Valida la integridad física y vigencia de pruebas hidrostáticas de un rack
   */
  public validateRack(dto: ValidateRackDto): {
    isValid: boolean;
    cylinderCount: number;
    nominalVolumeLiters: number;
    plateCode: string;
  } {
    const rack = new ModularRack(dto.rack);
    rack.assertAllCylindersValidForOperation(dto.operationDate);

    return {
      isValid: true,
      cylinderCount: rack.cylinderCount,
      nominalVolumeLiters: rack.nominalVolumeLiters,
      plateCode: rack.plateCode,
    };
  }

  /**
   * Ejecuta un cargue en manifold de estación (LOADING_DISPATCH)
   */
  public executeLoading(dto: ExecuteLoadingDto): DispatchOperation {
    const rack = new ModularRack(dto.rack);
    const profile = this.thermoService.resolveChromatography(dto.chromatography);

    return DispatchOperation.executeLoading(
      {
        consecutiveNumber: dto.consecutiveNumber,
        stationCode: dto.stationCode,
        rack,
        chromatography: profile,
        initialPressureBar: dto.initialPressureBar,
        initialTemperatureK: dto.initialTemperatureK,
        cutoffPressureBar: dto.cutoffPressureBar,
        cutoffTemperatureK: dto.cutoffTemperatureK,
        ambientTemperatureK: dto.ambientTemperatureK,
        operationDate: dto.operationDate,
      },
      this.thermoEngine
    );
  }

  /**
   * Ejecuta un descargue en EDS receptora (UNLOADING_RECEIPT)
   */
  public executeUnloading(dto: ExecuteUnloadingDto): DispatchOperation {
    const rack = new ModularRack(dto.rack);
    const profile = this.thermoService.resolveChromatography(dto.chromatography);

    return DispatchOperation.executeUnloading(
      {
        consecutiveNumber: dto.consecutiveNumber,
        stationCode: dto.stationCode,
        rack,
        chromatography: profile,
        initialPressureBar: dto.initialPressureBar,
        initialTemperatureK: dto.initialTemperatureK,
        cutoffPressureBar: dto.cutoffPressureBar,
        cutoffTemperatureK: dto.cutoffTemperatureK,
        operationDate: dto.operationDate,
      },
      this.thermoEngine
    );
  }
}
