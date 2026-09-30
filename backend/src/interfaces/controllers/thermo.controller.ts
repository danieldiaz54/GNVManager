// Controlador HTTP para servicios termodinámicos
// Custodiado por: @integration-architect

import { NextFunction, Request, Response } from 'express';
import {
  CalculateCompressibilitySchema,
  CalculateStateSchema,
  IsochoricForecastSchema,
  ThermoApplicationService,
} from '../../application';

export class ThermoController {
  private service: ThermoApplicationService;

  constructor(service?: ThermoApplicationService) {
    this.service = service || new ThermoApplicationService();
  }

  public calculateCompressibility = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      const validatedDto = CalculateCompressibilitySchema.parse(req.body);
      const result = this.service.calculateCompressibility(validatedDto);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public calculateState = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      const validatedDto = CalculateStateSchema.parse(req.body);
      const result = this.service.calculateState(validatedDto);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public isochoricForecast = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      const validatedDto = IsochoricForecastSchema.parse(req.body);
      const result = this.service.isochoricForecast(validatedDto);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
