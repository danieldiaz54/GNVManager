// Servicio de Dominio: Analizador y Segregador de Mermas (Aparentes vs Físicas)
// Custodiado por: @domain-architect & @data-architect
// Especificación: .specs/04-reconciliation-ledger/reconciliation-ledger.spec.md

import { ShrinkageAnalysisInput, ShrinkageAnalysisResult } from './ledger-types';

export class ShrinkageAnalyzer {
  public static readonly MAXIMUM_TOLERATED_TRANSIT_LOSS_PERCENT = 0.5;

  /**
   * Analiza la discrepancia entre el cargue en estación base y el recibo en EDS
   * Segrega la merma aparente térmica del balance de pérdida de masa física en ruta
   */
  public static analyzeTransitLoss(
    input: ShrinkageAnalysisInput
  ): ShrinkageAnalysisResult {
    const {
      dispatchConsecutive,
      receiptConsecutive,
      loadedMassKg,
      receivedMassKg,
      apparentThermalLossSm3,
    } = input;

    // Pérdida física real = masa despachada - masa recibida
    const physicalLossMassKg = Math.max(0, loadedMassKg - receivedMassKg);
    const lossPercentage = (physicalLossMassKg / loadedMassKg) * 100.0;

    const isLossTolerated =
      lossPercentage <= this.MAXIMUM_TOLERATED_TRANSIT_LOSS_PERCENT;

    let status: 'OPTIMAL' | 'TOLERATED_PURGE' | 'ANOMALY_PHYSICAL_LOSS' =
      'OPTIMAL';

    if (physicalLossMassKg > 0) {
      status = isLossTolerated ? 'TOLERATED_PURGE' : 'ANOMALY_PHYSICAL_LOSS';
    }

    return {
      dispatchConsecutive,
      receiptConsecutive,
      loadedMassKg,
      receivedMassKg,
      physicalLossMassKg,
      lossPercentage,
      isLossTolerated,
      status,
      apparentThermalLossSm3,
    };
  }
}
