// Controlador HTTP para certificación de aforos
// Custodiado por: @integration-architect

import { NextFunction, Request, Response } from 'express';
import {
  CertifyAforoSabanasSchema,
  ThermoApplicationService,
} from '../../application';

export class AforoController {
  private service: ThermoApplicationService;

  constructor(service?: ThermoApplicationService) {
    this.service = service || new ThermoApplicationService();
  }

  public certifySabanas = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      const validatedDto = CertifyAforoSabanasSchema.parse(req.body);
      const certification = this.service.certifyAforoSabanas(validatedDto);
      res.status(200).json({
        success: true,
        data: certification,
      });
    } catch (error) {
      next(error);
    }
  };
}
