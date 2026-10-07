import { IReconciliationRepository, ReconciliationRecordEntity } from '../../domain/repositories/IReconciliationRepository';

export class SaveReconciliationRecordUseCase {
  private repository: IReconciliationRepository;

  // Inyección de dependencias estricta
  constructor(repository: IReconciliationRepository) {
    this.repository = repository;
  }

  public async execute(data: Omit<ReconciliationRecordEntity, 'id' | 'createdAt'>): Promise<ReconciliationRecordEntity> {
    // Aquí podríamos agregar validaciones de negocio adicionales si fuera necesario
    // Ej: verificar si ya existe un registro con las mismas presiones en el último minuto.
    
    return await this.repository.save(data);
  }
}
