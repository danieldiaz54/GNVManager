import { PrismaClient } from '@prisma/client';
import { IReconciliationRepository, ReconciliationRecordEntity, SaveRackDTO } from '../../domain/repositories/IReconciliationRepository';

const prisma = new PrismaClient();

export class PrismaReconciliationRepository implements IReconciliationRepository {
  
  async save(record: ReconciliationRecordEntity): Promise<ReconciliationRecordEntity> {
    const saved = await prisma.reconciliationRecord.create({
      data: {
        recordType: record.recordType || 'INDIVIDUAL',
        moduleIdentifier: record.moduleIdentifier,
        positionNumber: record.positionNumber,
        parentId: record.parentId,
        moduleCapacityLiters: record.moduleCapacityLiters,
        initialPressureBar: record.initialPressureBar,
        initialTempK: record.initialTempK,
        finalPressureBar: record.finalPressureBar,
        finalTempK: record.finalTempK,
        calculatedMassKg: record.calculatedMassKg,
        calculatedVolumeSm3: record.calculatedVolumeSm3,
        saleVolumeSm3: record.saleVolumeSm3
      }
    });
    
    return saved as ReconciliationRecordEntity;
  }

  async saveRack(dto: SaveRackDTO): Promise<ReconciliationRecordEntity> {
    return await prisma.$transaction(async (tx) => {
      // 1. Crear el registro Padre Consolidado (Rack)
      const parentRecord = await tx.reconciliationRecord.create({
        data: {
          recordType: dto.parent.recordType || 'RACK_PARENT',
          moduleIdentifier: dto.parent.moduleIdentifier || 'RACK-11P',
          moduleCapacityLiters: dto.parent.moduleCapacityLiters,
          initialPressureBar: dto.parent.initialPressureBar,
          initialTempK: dto.parent.initialTempK,
          finalPressureBar: dto.parent.finalPressureBar,
          finalTempK: dto.parent.finalTempK,
          calculatedMassKg: dto.parent.calculatedMassKg,
          calculatedVolumeSm3: dto.parent.calculatedVolumeSm3,
          saleVolumeSm3: dto.parent.saleVolumeSm3
        }
      });

      // 2. Crear los registros Hijos asociados (Posiciones del Rack)
      for (const pos of dto.positions) {
        await tx.reconciliationRecord.create({
          data: {
            recordType: 'RACK_CHILD',
            moduleIdentifier: dto.parent.moduleIdentifier || 'RACK-11P',
            positionNumber: pos.positionNumber,
            parentId: parentRecord.id,
            moduleCapacityLiters: pos.moduleCapacityLiters,
            initialPressureBar: pos.initialPressureBar,
            initialTempK: pos.initialTempK,
            finalPressureBar: pos.finalPressureBar,
            finalTempK: pos.finalTempK,
            calculatedMassKg: pos.calculatedMassKg,
            calculatedVolumeSm3: pos.calculatedVolumeSm3,
            saleVolumeSm3: null
          }
        });
      }

      // Retornar el registro padre con sus hijos incluidos
      const fullRecord = await tx.reconciliationRecord.findUnique({
        where: { id: parentRecord.id },
        include: {
          children: {
            orderBy: { positionNumber: 'asc' }
          }
        }
      });

      return fullRecord as ReconciliationRecordEntity;
    });
  }

  async saveManifold(dto: SaveRackDTO): Promise<ReconciliationRecordEntity> {
    return this.saveRack(dto);
  }

  async findById(id: string): Promise<ReconciliationRecordEntity | null> {
    const record = await prisma.reconciliationRecord.findUnique({
      where: { id },
      include: {
        children: {
          orderBy: { positionNumber: 'asc' }
        }
      }
    });
    return record ? (record as ReconciliationRecordEntity) : null;
  }

  async findAll(): Promise<ReconciliationRecordEntity[]> {
    // Solo traemos registros de nivel superior (INDIVIDUAL, RACK_PARENT o MANIFOLD_PARENT), con sus hijos anidados
    const records = await prisma.reconciliationRecord.findMany({
      where: {
        parentId: null
      },
      include: {
        children: {
          orderBy: { positionNumber: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return records as ReconciliationRecordEntity[];
  }

  async updateSaleVolume(id: string, saleVolumeSm3: number): Promise<ReconciliationRecordEntity> {
    const updated = await prisma.reconciliationRecord.update({
      where: { id },
      data: { saleVolumeSm3 },
      include: {
        children: {
          orderBy: { positionNumber: 'asc' }
        }
      }
    });
    return updated as ReconciliationRecordEntity;
  }
}
