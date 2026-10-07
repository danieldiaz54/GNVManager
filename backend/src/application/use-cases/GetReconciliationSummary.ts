import { IReconciliationRepository, ReconciliationRecordEntity } from '../../domain/repositories/IReconciliationRepository';
import { RecordNotFoundError } from '../../domain/exceptions/RecordNotFoundError';
import { InvalidReconciliationDataError } from '../../domain/exceptions/InvalidReconciliationDataError';

export interface GetReconciliationSummaryResponse {
  totalDispensed: number;
  variationSm3: number;
  certified: boolean;
  aforoSm3PerBar: number;
}

export class GetReconciliationSummary {
  constructor(private readonly reconciliationRepository: IReconciliationRepository) {}

  async execute(reconciliationId: string): Promise<GetReconciliationSummaryResponse> {
    const record = await this.reconciliationRepository.findById(reconciliationId);
    
    if (!record) {
      throw new RecordNotFoundError(`ReconciliationRecord with ID ${reconciliationId} not found`);
    }

    const totalDispensed = (record.events || [])
      .filter(event => event.eventType === 'SALE_DISPENSED')
      .reduce((sum, event) => sum + (event.saleVolumeSm3 || 0), 0);

    const calculatedVolumeSm3 = record.calculatedVolumeSm3 || 0;
    // Variación (Sm³) = Ventas Facturadas - Volumen Consolidado Despachado
    const variationSm3 = totalDispensed - calculatedVolumeSm3;

    const pressureDelta = record.initialPressureBar - record.finalPressureBar;
    if (pressureDelta <= 0) {
      throw new InvalidReconciliationDataError(`Invalid pressure delta: ${pressureDelta}. Initial pressure must be greater than final pressure.`);
    }

    const aforoSm3PerBar = calculatedVolumeSm3 / pressureDelta;

    // Sabanas Rule: If variance is within 2%, it is certified
    const variancePercentage = calculatedVolumeSm3 !== 0 
      ? Math.abs(variationSm3 / calculatedVolumeSm3) 
      : 0;
    const certified = variancePercentage <= 0.02;

    return {
      totalDispensed,
      variationSm3,
      certified,
      aforoSm3PerBar
    };
  }
}
