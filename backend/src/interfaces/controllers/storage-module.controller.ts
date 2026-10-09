import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const storageModuleSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['ESTACIONARIA', 'TRANSPORTE']),
  cylinderCount: z.number().int().positive(),
  cylinderCapacityLiters: z.number().positive(),
  // Parámetros Operativos
  workingPressureBar: z.number().positive().default(250.0),
  testPressureBar: z.number().positive().default(375.0),
  safetyReliefPressureBar: z.number().positive().default(273.0),
  minOperatingTempC: z.number().default(-50.0),
  maxOperatingTempC: z.number().default(60.0),
  // Pesaje y Logística
  tareWeightKg: z.number().positive().optional().nullable(),
  maxPayloadKg: z.number().positive().optional().nullable(),
  grossWeightKg: z.number().positive().optional().nullable(),
  chassisType: z.string().optional().nullable(),
  // Especificaciones Mecánicas
  tubeMaterial: z.string().optional().nullable(),
  tubeOuterDiameterMm: z.number().positive().optional().nullable(),
  tubeLengthMm: z.number().positive().optional().nullable(),
  plugConfiguration: z.string().optional().nullable(),
  valveManufacturer: z.string().optional().nullable(),
  // Normativa
  manufacturingStandard: z.string().optional().nullable(),
  certificationAgency: z.string().optional().nullable(),
  designLifeYears: z.number().int().positive().optional().default(15),
});

export const storageModuleController = {
  async getStorageModules(req: Request, res: Response): Promise<void> {
    try {
      const modules = await prisma.storageModule.findMany({
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json(modules);
    } catch (error) {
      console.error('Error fetching storage modules:', error);
      res.status(500).json({ error: 'Internal server error while fetching storage modules' });
    }
  },

  async createStorageModule(req: Request, res: Response): Promise<void> {
    try {
      const data = storageModuleSchema.parse(req.body);
      const totalCapacityLiters = data.cylinderCount * data.cylinderCapacityLiters;

      const newModule = await prisma.storageModule.create({
        data: {
          ...data,
          totalCapacityLiters,
        },
      });
      res.status(201).json(newModule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Datos inválidos', details: error.issues });
        return;
      }
      console.error('Error creating storage module:', error);
      res.status(500).json({ error: 'Internal server error creating storage module' });
    }
  }
};
