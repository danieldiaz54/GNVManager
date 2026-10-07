import type { Request, Response } from 'express';
import { z } from 'zod';
import { CalculateThermodynamicTransferUseCase } from '../../application/use-cases/CalculateThermodynamicTransfer';
import { DivergenceException, PressureExceededException } from '../../domain/entities/Thermodynamics';

// Capa 3: Interface Adapters (Controllers)
// Valida entradas del mundo exterior (HTTP/JSON) y las traduce para la Capa de Aplicación.

const thermodynamicInputSchema = z.object({
  operationType: z.enum(['CARGUE', 'DESCARGUE']).optional(),
  gasProfileId: z.string().optional(),
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
      operationType: z.enum(['CARGUE', 'DESCARGUE']).optional(),
      gasProfileId: z.string().optional(),
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

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ThermodynamicController {
  private calculateUseCase: CalculateThermodynamicTransferUseCase;

  constructor() {
    this.calculateUseCase = new CalculateThermodynamicTransferUseCase();
  }

  private async getGasComposition(gasProfileId?: string) {
    if (!gasProfileId) return undefined;
    try {
      const profile = await prisma.gasProfile.findUnique({ where: { id: gasProfileId } });
      if (profile) {
        return {
          molarMass: profile.molarMass,
          criticalPressure: profile.criticalPressure,
          criticalTemperature: profile.criticalTemperature
        };
      }
    } catch (e) {
      console.warn('Could not fetch gas profile, falling back to default:', e);
    }
    return undefined;
  }

  public calculateTransfer = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = thermodynamicInputSchema.parse(req.body);
      const composition = await this.getGasComposition(validatedData.gasProfileId);

      const result = this.calculateUseCase.execute(
        validatedData.initial,
        validatedData.final,
        validatedData.volumeLiters,
        composition
      );

      const deltaP = Math.abs(validatedData.final.pressureBar - validatedData.initial.pressureBar);
      const aforo = this.calculateUseCase.certifyAforo(
        result.stabilizedPressureBar,
        result.volumeTransferredSm3,
        deltaP
      );

      res.status(200).json({
        success: true,
        data: {
          ...result,
          aforoCertification: aforo
        }
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: 'Datos de entrada inválidos', details: error.issues });
        return;
      }
      if (error instanceof DivergenceException || error instanceof PressureExceededException) {
        res.status(422).json({ success: false, error: error.message });
        return;
      }
      console.error(error);
      res.status(500).json({ success: false, error: 'Error interno calculando termodinámica' });
    }
  };

  public calculateBatch = async (req: Request, res: Response): Promise<void> => {
    try {
      const validatedData = batchThermodynamicInputSchema.parse(req.body);

      // Pre-cargar perfiles únicos solicitados para eficiencia
      const uniqueProfileIds = Array.from(new Set(validatedData.items.map(i => i.gasProfileId).filter(Boolean))) as string[];
      const profileMap = new Map<string, any>();
      if (uniqueProfileIds.length > 0) {
        const profiles = await prisma.gasProfile.findMany({ where: { id: { in: uniqueProfileIds } } });
        for (const p of profiles) {
          profileMap.set(p.id, {
            molarMass: p.molarMass,
            criticalPressure: p.criticalPressure,
            criticalTemperature: p.criticalTemperature
          });
        }
      }

      const results = validatedData.items.map(item => {
        const composition = item.gasProfileId ? profileMap.get(item.gasProfileId) : undefined;
        const res = this.calculateUseCase.execute(
          item.initial,
          item.final,
          item.volumeLiters,
          composition
        );
        const deltaP = Math.abs(item.final.pressureBar - item.initial.pressureBar);
        const aforo = this.calculateUseCase.certifyAforo(
          res.stabilizedPressureBar,
          res.volumeTransferredSm3,
          deltaP
        );

        return {
          id: item.id,
          result: {
            ...res,
            aforoCertification: aforo
          }
        };
      });

      res.status(200).json({
        success: true,
        data: results
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: 'Datos de entrada por lote inválidos', details: error.issues });
        return;
      }
      if (error instanceof DivergenceException || error instanceof PressureExceededException) {
        res.status(422).json({ success: false, error: error.message });
        return;
      }
      console.error(error);
      res.status(500).json({ success: false, error: 'Error interno calculando lote termodinámico' });
    }
  };
}
