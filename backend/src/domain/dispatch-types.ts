// Tipos de Dominio para Topología de Activos y Despachos (Dominio 02)
// Custodiado por: @domain-architect & @data-architect

import { ChromatographyProfile } from './types';

export type RackType =
  | 'ELEVEN_CYLINDER_13497L'
  | 'TWELVE_CYLINDER_26950L'
  | 'CUSTOM_MODULE';

export type OperationType = 'LOADING_DISPATCH' | 'UNLOADING_RECEIPT';

export type AforoCertificationStatus =
  | 'CERTIFIED_AFT'
  | 'REJECTED_UNDERPRESSURE'
  | 'NON_COMPLIANT'
  | 'PENDING_THERMAL_STABILITY';

export interface CylinderProps {
  id: string;
  serialNumber: string;
  waterCapacityLiters: number;
  tareWeightKg: number;
  manufacturingDate: Date;
  hydrostaticTestDate: Date;
  nextHydrostaticDueDate: Date;
}

export interface ModularRackProps {
  id: string;
  plateCode: string;
  rackType: RackType;
  nominalVolumeLiters: number;
  maxWorkingPressureBar: number;
  cylinders: CylinderProps[];
}

export interface ExecuteLoadingInput {
  consecutiveNumber: string;
  stationCode: string;
  rack: ModularRackProps;
  chromatography: ChromatographyProfile;
  initialPressureBar: number;
  initialTemperatureK: number;
  cutoffPressureBar: number;
  cutoffTemperatureK: number;
  ambientTemperatureK: number;
  operationDate?: Date;
}

export interface ExecuteUnloadingInput {
  consecutiveNumber: string;
  stationCode: string;
  rack: ModularRackProps;
  chromatography: ChromatographyProfile;
  initialPressureBar: number;
  initialTemperatureK: number;
  cutoffPressureBar: number;
  cutoffTemperatureK: number;
  operationDate?: Date;
}
