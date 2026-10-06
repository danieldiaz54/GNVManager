import { Request, Response } from 'express';
import { z } from 'zod';
import { CalculateThermodynamicTransferUseCase } from '../../application/use-cases/CalculateThermodynamicTransfer';

// Capa 3: Interface Adapters (Controllers)
// Valida entradas del mundo exterior (HTTP/JSON) y las traduce para la Capa de Aplicación.

const thermodynamicInputSchema = z.object({
  initial: z.object({
    pressureBar: z.number().nonnegative(),
    temperatureK: z.number().positive(),
  }),
  final: z.object({
    pressureBar: z.number().nonnegative(),
    temperatureK: z.number().positive(),
  }),
  volumeLiters: z.number().positive(),
});

const batchThermodynamicInputSchema = z.object({
  items: z.array(
    z.object({
      id: z.union([z.number(), z.string()]),
      initial: z.object({
        pressureBar: z.number().nonnegative(),
        temperatureK: z.number().positive(),
      }),
      final: z.object({
        pressureBar: z.number().nonnegative(),
        temperatureK: z.number().positive(),
      }),
      volumeLiters: z.number().positive(),
    })
  ).min(1).max(50),
});

export class ThermodynamicController {
  private calculateUseCase: CalculateThermodynamicTransferUseCase;

  constructor() {
    this.calculateUseCase = new CalculateThermodynamicTransferUseCase();
  }

  public calculateTransfer = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = thermodynamicInputSchema.parse(req.body);

      const result = this.calculateUseCase.execute(
        validatedData.initial,
        validatedData.final,
        validatedData.volumeLiters
      );

      res.status(200).json({
        success: true,
        data: result
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: 'Datos de entrada inválidos', details: error.issues });
        return;
      }
      console.error(error);
      res.status(500).json({ success: false, error: 'Error interno calculando termodinámica' });
    }
  };

  public calculateBatch = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = batchThermodynamicInputSchema.parse(req.body);

      const results = validatedData.items.map(item => ({
        id: item.id,
        result: this.calculateUseCase.execute(
          item.initial,
          item.final,
          item.volumeLiters
        )
      }));

      res.status(200).json({
        success: true,
        data: results
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: 'Datos de entrada por lote inválidos', details: error.issues });
        return;
      }
      console.error(error);
      res.status(500).json({ success: false, error: 'Error interno calculando lote termodinámico' });
    }
  };
}
