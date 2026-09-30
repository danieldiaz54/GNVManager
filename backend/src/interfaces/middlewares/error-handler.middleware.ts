// Middleware de manejo centralizado de errores
// Custodiado por: @integration-architect

import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ThermodynamicException } from '../../domain';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Error de validación en los parámetros enviados',
        details: err.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      },
    });
    return;
  }

  if (err instanceof ThermodynamicException) {
    res.status(422).json({
      success: false,
      error: {
        code: 'DOMAIN_ERROR',
        message: err.message,
      },
    });
    return;
  }

  console.error('[ServerError]', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: err.message || 'Error interno del servidor',
    },
  });
}
