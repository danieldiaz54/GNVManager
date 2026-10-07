export interface ReconciliationRecordEntity {
  id?: string;
  createdAt?: Date;
  recordType?: string; // "INDIVIDUAL" | "RACK_PARENT" | "RACK_CHILD" | "MANIFOLD_PARENT" | "MANIFOLD_CHILD"
  moduleIdentifier?: string | null;
  positionNumber?: number | null;
  parentId?: string | null;
  children?: ReconciliationRecordEntity[];
  operationType?: string;
  moduleCapacityLiters: number;
  initialPressureBar: number;
  initialTempK: number;
  finalPressureBar: number;
  finalTempK: number;
  calculatedMassKg: number;
  calculatedVolumeSm3: number;
  events?: ReconciliationEventEntity[];
}

export interface ReconciliationEventEntity {
  id?: string;
  recordId: string;
  eventType: string;
  saleVolumeSm3?: number | null;
  createdAt?: Date;
}

export interface SaveRackDTO {
  parent: Omit<ReconciliationRecordEntity, 'id' | 'createdAt' | 'children'>;
  positions: Array<Omit<ReconciliationRecordEntity, 'id' | 'createdAt' | 'children' | 'parentId'>>;
}

export type SaveManifoldDTO = SaveRackDTO;

export interface IReconciliationRepository {
  save(record: ReconciliationRecordEntity): Promise<ReconciliationRecordEntity>;
  saveRack(dto: SaveRackDTO): Promise<ReconciliationRecordEntity>;
  saveManifold?(dto: SaveRackDTO): Promise<ReconciliationRecordEntity>;
  findById(id: string): Promise<ReconciliationRecordEntity | null>;
  findAll(): Promise<ReconciliationRecordEntity[]>;
  updateSaleVolume(id: string, saleVolumeSm3: number): Promise<ReconciliationRecordEntity>;
}
