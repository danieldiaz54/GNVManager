// Controlador HTTP para ReconciliationLedger y Auditoría de Mermas
// Custodiado por: @integration-architect

import { NextFunction, Request, Response } from 'express';
import {
  AnalyzeShrinkageSchema,
  LedgerApplicationService,
  RecordLedgerEntrySchema,
} from '../../application';

export class LedgerController {
  private service: LedgerApplicationService;

  constructor(service?: LedgerApplicationService) {
    this.service = service || LedgerApplicationService.getInstance();
  }

  public recordEntry = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      const validatedDto = RecordLedgerEntrySchema.parse(req.body);
      const entry = this.service.recordEntry(validatedDto);
      res.status(200).json({
        success: true,
        data: entry,
      });
    } catch (error) {
      next(error);
    }
  };

  public verifyIntegrity = (
    _req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      const result = this.service.verifyIntegrity();
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public analyzeShrinkage = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      const validatedDto = AnalyzeShrinkageSchema.parse(req.body);
      const result = this.service.analyzeShrinkage(validatedDto);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getAllEntries = (
    _req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      const entries = this.service.getAllEntries();
      res.status(200).json({
        success: true,
        data: entries,
      });
    } catch (error) {
      next(error);
    }
  };
}
