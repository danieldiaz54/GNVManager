import { IReconciliationRepository, ReconciliationRecordEntity, SaveRackDTO } from '../../domain/repositories/IReconciliationRepository';

export class SaveRackReconciliationUseCase {
  private repository: IReconciliationRepository;

  constructor(repository: IReconciliationRepository) {
    this.repository = repository;
  }

  public async execute(dto: SaveRackDTO): Promise<ReconciliationRecordEntity> {
    if (!dto.positions || dto.positions.length === 0) {
      throw new Error('Un registro de rack debe contener al menos una posición.');
    }

    return await this.repository.saveRack(dto);
  }
}
