// Servicio de Aplicación para el Libro Mayor de Conciliación (Dominio 04)
// Custodiado por: @data-architect & @integration-architect

import {
  LedgerIntegrityResult,
  ReconciliationEntry,
  ReconciliationLedger,
  ShrinkageAnalysisResult,
  ShrinkageAnalyzer,
} from '../../domain';
import {
  AnalyzeShrinkageDto,
  RecordLedgerEntryDto,
} from '../dtos/ledger.dto';
import { ThermoApplicationService } from './thermo-application.service';

export class LedgerApplicationService {
  private static instance: LedgerApplicationService;
  private readonly ledger: ReconciliationLedger;
  private readonly thermoService: ThermoApplicationService;

  constructor(
    ledger?: ReconciliationLedger,
    thermoService?: ThermoApplicationService
  ) {
    this.ledger = ledger || new ReconciliationLedger();
    this.thermoService = thermoService || new ThermoApplicationService();
  }

  public static getInstance(): LedgerApplicationService {
    if (!LedgerApplicationService.instance) {
      LedgerApplicationService.instance = new LedgerApplicationService();
    }
    return LedgerApplicationService.instance;
  }

  /**
   * Registra un asiento inmutable en el ledger
   */
  public recordEntry(dto: RecordLedgerEntryDto): ReconciliationEntry {
    const profile = this.thermoService.resolveChromatography(dto.chromatography);

    return this.ledger.appendEntry({
      transactionType: dto.transactionType,
      facilityCode: dto.facilityCode,
      dispatchConsecutive: dto.dispatchConsecutive,
      standardVolumeSm3: dto.standardVolumeSm3,
      massKg: dto.massKg,
      chromatography: profile,
      apparentMermaSm3: dto.apparentMermaSm3,
      physicalMermaSm3: dto.physicalMermaSm3,
      mermaPercentage: dto.mermaPercentage,
      recordedAt: dto.recordedAt,
    });
  }

  /**
   * Audita la integridad criptográfica de la cadena SHA-256
   */
  public verifyIntegrity(): LedgerIntegrityResult {
    return this.ledger.verifyLedgerIntegrity();
  }

  /**
   * Analiza la merma física en tránsito segregándola de la aparente térmica
   */
  public analyzeShrinkage(dto: AnalyzeShrinkageDto): ShrinkageAnalysisResult {
    return ShrinkageAnalyzer.analyzeTransitLoss({
      dispatchConsecutive: dto.dispatchConsecutive,
      receiptConsecutive: dto.receiptConsecutive,
      loadedMassKg: dto.loadedMassKg,
      receivedMassKg: dto.receivedMassKg,
      apparentThermalLossSm3: dto.apparentThermalLossSm3,
    });
  }

  /**
   * Obtiene todos los asientos asentados en el ledger
   */
  public getAllEntries(): ReconciliationEntry[] {
    return this.ledger.getAllEntries();
  }
}
