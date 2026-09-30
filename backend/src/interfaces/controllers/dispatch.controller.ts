// Controlador HTTP para operaciones de despacho y topología de racks
// Custodiado por: @integration-architect

import { NextFunction, Request, Response } from 'express';
import {
  DispatchApplicationService,
  ExecuteLoadingSchema,
  ExecuteUnloadingSchema,
  ValidateRackSchema,
} from '../../application';

export class DispatchController {
  private service: DispatchApplicationService;

  constructor(service?: DispatchApplicationService) {
    this.service = service || new DispatchApplicationService();
  }

  public validateRack = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      const validatedDto = ValidateRackSchema.parse(req.body);
      const result = this.service.validateRack(validatedDto);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public executeLoading = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      const validatedDto = ExecuteLoadingSchema.parse(req.body);
      const operation = this.service.executeLoading(validatedDto);
      res.status(200).json({
        success: true,
        data: operation,
      });
    } catch (error) {
      next(error);
    }
  };

  public executeUnloading = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      const validatedDto = ExecuteUnloadingSchema.parse(req.body);
      const operation = this.service.executeUnloading(validatedDto);
      res.status(200).json({
        success: true,
        data: operation,
      });
    } catch (error) {
      next(error);
    }
  };
}
