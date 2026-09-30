// Entidad de Dominio: Operación de Despacho (Cargue y Descargue)
// Custodiado por: @domain-architect & @data-architect

import {
  AforoCertificationStatus,
  ExecuteLoadingInput,
  ExecuteUnloadingInput,
  OperationType,
} from './dispatch-types';
import { InvalidFlowDirectionException } from './exceptions';
import { ModularRack } from './modular-rack';
import { ThermodynamicEngine } from './thermodynamic-engine';
import { ChromatographyProfile } from './types';

export class DispatchOperation {
  public readonly consecutiveNumber: string;
  public readonly stationCode: string;
  public readonly operationType: OperationType;
  public readonly rack: ModularRack;
  public readonly chromatography: ChromatographyProfile;

  // Lecturas iniciales
  public readonly initialPressureBar: number;
  public readonly initialTemperatureK: number;
  public readonly initialMassKg: number;
  public readonly initialStandardVolumeSm3: number;
  public readonly initialZFactor: number;

  // Lecturas al corte
  public readonly cutoffPressureBar: number;
  public readonly cutoffTemperatureK: number;
  public readonly cutoffMassKg: number;
  public readonly cutoffStandardVolumeSm3: number;
  public readonly cutoffZFactor: number;

  // Estabilización térmica
  public readonly stabilizedPressureBar?: number;
  public readonly stabilizedTemperatureK?: number;
  public readonly stabilizedZFactor?: number;

  // Balance neto
  public readonly netMassTransferredKg: number;
  public readonly netStandardVolumeSm3: number;

  // Certificación de aforo
  public readonly certificationStatus: AforoCertificationStatus;
  public readonly isCertified: boolean;
  public readonly rejectionReason?: string;
  public readonly operationDate: Date;

  private constructor(props: {
    consecutiveNumber: string;
    stationCode: string;
    operationType: OperationType;
    rack: ModularRack;
    chromatography: ChromatographyProfile;
    initialPressureBar: number;
    initialTemperatureK: number;
    initialMassKg: number;
    initialStandardVolumeSm3: number;
    initialZFactor: number;
    cutoffPressureBar: number;
    cutoffTemperatureK: number;
    cutoffMassKg: number;
    cutoffStandardVolumeSm3: number;
    cutoffZFactor: number;
    stabilizedPressureBar?: number;
    stabilizedTemperatureK?: number;
    stabilizedZFactor?: number;
    netMassTransferredKg: number;
    netStandardVolumeSm3: number;
    certificationStatus: AforoCertificationStatus;
    isCertified: boolean;
    rejectionReason?: string;
    operationDate: Date;
  }) {
    this.consecutiveNumber = props.consecutiveNumber;
    this.stationCode = props.stationCode;
    this.operationType = props.operationType;
    this.rack = props.rack;
    this.chromatography = props.chromatography;
    this.initialPressureBar = props.initialPressureBar;
    this.initialTemperatureK = props.initialTemperatureK;
    this.initialMassKg = props.initialMassKg;
    this.initialStandardVolumeSm3 = props.initialStandardVolumeSm3;
    this.initialZFactor = props.initialZFactor;
    this.cutoffPressureBar = props.cutoffPressureBar;
    this.cutoffTemperatureK = props.cutoffTemperatureK;
    this.cutoffMassKg = props.cutoffMassKg;
    this.cutoffStandardVolumeSm3 = props.cutoffStandardVolumeSm3;
    this.cutoffZFactor = props.cutoffZFactor;
    this.stabilizedPressureBar = props.stabilizedPressureBar;
    this.stabilizedTemperatureK = props.stabilizedTemperatureK;
    this.stabilizedZFactor = props.stabilizedZFactor;
    this.netMassTransferredKg = props.netMassTransferredKg;
    this.netStandardVolumeSm3 = props.netStandardVolumeSm3;
    this.certificationStatus = props.certificationStatus;
    this.isCertified = props.isCertified;
    this.rejectionReason = props.rejectionReason;
    this.operationDate = props.operationDate;
  }

  /**
   * Ejecuta una operación de Cargue en Manifold (LOADING_DISPATCH)
   * Aplica BR-DISPATCH-001 (Pf > Pi y deltaM > 0), BR-DISPATCH-002 y BR-DISPATCH-003
   */
  public static executeLoading(
    input: ExecuteLoadingInput,
    engine: ThermodynamicEngine = new ThermodynamicEngine()
  ): DispatchOperation {
    const opDate = input.operationDate || new Date();

    // 1. Integridad de cilindros (BR-DISPATCH-002)
    const rack =
      input.rack instanceof ModularRack ? input.rack : new ModularRack(input.rack);
    rack.assertAllCylindersValidForOperation(opDate);

    // 2. Invariante de flujo en cargue: Pf > Pi (BR-DISPATCH-001)
    if (input.cutoffPressureBar <= input.initialPressureBar) {
      throw new InvalidFlowDirectionException(
        `En una operación de cargue la presión final (${input.cutoffPressureBar} bar) debe ser estrictamente mayor a la inicial (${input.initialPressureBar} bar).`
      );
    }

    // 3. Balance termodinámico inicial
    const initialState = engine.calculateMassAndVolume(
      {
        pressureBar: input.initialPressureBar,
        temperatureK: input.initialTemperatureK,
        volumeLiters: rack.nominalVolumeLiters,
      },
      input.chromatography
    );

    // 4. Balance termodinámico al corte
    const cutoffState = engine.calculateMassAndVolume(
      {
        pressureBar: input.cutoffPressureBar,
        temperatureK: input.cutoffTemperatureK,
        volumeLiters: rack.nominalVolumeLiters,
      },
      input.chromatography
    );

    const netMassTransferredKg = cutoffState.massKg - initialState.massKg;
    const netStandardVolumeSm3 = cutoffState.standardVolumeSm3 - initialState.standardVolumeSm3;

    if (netMassTransferredKg <= 0) {
      throw new InvalidFlowDirectionException(
        `En cargue la masa transferida debe ser positiva. Delta calculado: ${netMassTransferredKg.toFixed(2)} kg`
      );
    }

    // 5. Pronóstico isocórico de enfriamiento post-corte
    const isochoricResult = engine.forecastIsochoricDecay({
      cutoffPressureBar: input.cutoffPressureBar,
      cutoffTemperatureK: input.cutoffTemperatureK,
      ambientTemperatureK: input.ambientTemperatureK,
      geometricVolumeLiters: rack.nominalVolumeLiters,
      chromatography: input.chromatography,
      coolingTimeSeconds: 7200,
    });

    // 6. Certificación de aforo en Sabanas (BR-DISPATCH-003)
    let isCertified = true;
    let certificationStatus: AforoCertificationStatus = 'CERTIFIED_AFT';
    let rejectionReason: string | undefined = undefined;

    if (input.stationCode === 'ST-SABANAS') {
      const aforoCert = engine.certifyAforoSabanas(
        isochoricResult.stabilizedPressureBar,
        input.stationCode
      );
      isCertified = aforoCert.isCertified;
      certificationStatus = aforoCert.status;
      rejectionReason = aforoCert.rejectionReason;
    }

    return new DispatchOperation({
      consecutiveNumber: input.consecutiveNumber,
      stationCode: input.stationCode,
      operationType: 'LOADING_DISPATCH',
      rack,
      chromatography: input.chromatography,
      initialPressureBar: input.initialPressureBar,
      initialTemperatureK: input.initialTemperatureK,
      initialMassKg: initialState.massKg,
      initialStandardVolumeSm3: initialState.standardVolumeSm3,
      initialZFactor: initialState.zFactor,
      cutoffPressureBar: input.cutoffPressureBar,
      cutoffTemperatureK: input.cutoffTemperatureK,
      cutoffMassKg: cutoffState.massKg,
      cutoffStandardVolumeSm3: cutoffState.standardVolumeSm3,
      cutoffZFactor: cutoffState.zFactor,
      stabilizedPressureBar: isochoricResult.stabilizedPressureBar,
      stabilizedTemperatureK: isochoricResult.stabilizedTemperatureK,
      stabilizedZFactor: isochoricResult.stabilizedZFactor,
      netMassTransferredKg,
      netStandardVolumeSm3,
      certificationStatus,
      isCertified,
      rejectionReason,
      operationDate: opDate,
    });
  }

  /**
   * Ejecuta una operación de Descargue en EDS receptora (UNLOADING_RECEIPT)
   * Aplica BR-DISPATCH-001 (Pi > Pf y deltaM entregado) y BR-DISPATCH-002
   */
  public static executeUnloading(
    input: ExecuteUnloadingInput,
    engine: ThermodynamicEngine = new ThermodynamicEngine()
  ): DispatchOperation {
    const opDate = input.operationDate || new Date();

    // 1. Integridad de cilindros (BR-DISPATCH-002)
    const rack =
      input.rack instanceof ModularRack ? input.rack : new ModularRack(input.rack);
    rack.assertAllCylindersValidForOperation(opDate);

    // 2. Invariante de flujo en descargue: Pi > Pf (BR-DISPATCH-001)
    if (input.initialPressureBar <= input.cutoffPressureBar) {
      throw new InvalidFlowDirectionException(
        `En una operación de descargue la presión inicial (${input.initialPressureBar} bar) debe ser estrictamente mayor a la presión final de entrega (${input.cutoffPressureBar} bar).`
      );
    }

    // 3. Balance inicial (al llegar cargado)
    const initialState = engine.calculateMassAndVolume(
      {
        pressureBar: input.initialPressureBar,
        temperatureK: input.initialTemperatureK,
        volumeLiters: rack.nominalVolumeLiters,
      },
      input.chromatography
    );

    // 4. Balance final (tras descarga)
    const cutoffState = engine.calculateMassAndVolume(
      {
        pressureBar: input.cutoffPressureBar,
        temperatureK: input.cutoffTemperatureK,
        volumeLiters: rack.nominalVolumeLiters,
      },
      input.chromatography
    );

    const netMassTransferredKg = initialState.massKg - cutoffState.massKg;
    const netStandardVolumeSm3 = initialState.standardVolumeSm3 - cutoffState.standardVolumeSm3;

    if (netMassTransferredKg <= 0) {
      throw new InvalidFlowDirectionException(
        `En descargue la masa entregada debe ser positiva. Delta calculado: ${netMassTransferredKg.toFixed(2)} kg`
      );
    }

    return new DispatchOperation({
      consecutiveNumber: input.consecutiveNumber,
      stationCode: input.stationCode,
      operationType: 'UNLOADING_RECEIPT',
      rack,
      chromatography: input.chromatography,
      initialPressureBar: input.initialPressureBar,
      initialTemperatureK: input.initialTemperatureK,
      initialMassKg: initialState.massKg,
      initialStandardVolumeSm3: initialState.standardVolumeSm3,
      initialZFactor: initialState.zFactor,
      cutoffPressureBar: input.cutoffPressureBar,
      cutoffTemperatureK: input.cutoffTemperatureK,
      cutoffMassKg: cutoffState.massKg,
      cutoffStandardVolumeSm3: cutoffState.standardVolumeSm3,
      cutoffZFactor: cutoffState.zFactor,
      netMassTransferredKg,
      netStandardVolumeSm3,
      certificationStatus: 'CERTIFIED_AFT',
      isCertified: true,
      operationDate: opDate,
    });
  }
}
