import { IReconciliationRepository, ReconciliationRecordEntity } from '../../domain/repositories/IReconciliationRepository';

export class UpdateSaleVolumeUseCase {
  private repository: IReconciliationRepository;

  constructor(repository: IReconciliationRepository) {
    this.repository = repository;
  }

  public async execute(id: string, saleVolumeSm3: number): Promise<ReconciliationRecordEntity> {
    const record = await this.repository.findById(id);
    
    if (!record) {
      throw new Error(`Registro con ID ${id} no encontrado.`);
    }

    if (saleVolumeSm3 < 0) {
      throw new Error('El volumen de venta no puede ser negativo.');
    }

    return await this.repository.updateSaleVolume(id, saleVolumeSm3);
  }
}
