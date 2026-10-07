import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const gasProfileSchema = z.object({
  name: z.string().min(1),
  reportDate: z.string().optional().nullable().transform(str => str ? new Date(str) : null),
  reportNumber: z.string().optional().nullable(),
  methanePercentage: z.number().min(0).max(100),
  ethanePercentage: z.number().min(0).max(100).optional().nullable(),
  propanePercentage: z.number().min(0).max(100).optional().nullable(),
  isoButanePercentage: z.number().min(0).max(100).optional().nullable(),
  normalButanePercentage: z.number().min(0).max(100).optional().nullable(),
  isoPentanePercentage: z.number().min(0).max(100).optional().nullable(),
  normalPentanePercentage: z.number().min(0).max(100).optional().nullable(),
  hexanesPlusPercentage: z.number().min(0).max(100).optional().nullable(),
  nitrogenPercentage: z.number().min(0).max(100).optional().nullable(),
  carbonDioxidePercentage: z.number().min(0).max(100).optional().nullable(),
  oxygenPercentage: z.number().min(0).max(100).optional().nullable(),
  grossCalorificValue: z.number().optional().nullable(),
  specificGravity: z.number().positive(),
  molarMass: z.number().positive(),
  compressibilityFactor: z.number().optional().nullable(),
  wobbeIndex: z.number().optional().nullable(),
  criticalPressure: z.number().positive(),
  criticalTemperature: z.number().positive(),
});

export const gasProfileController = {
  async getProfiles(req: Request, res: Response): Promise<void> {
    try {
      const profiles = await prisma.gasProfile.findMany({
        orderBy: { name: 'asc' }
      });
      res.status(200).json(profiles);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error while fetching gas profiles' });
    }
  },

  async getProfileById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const profile = await prisma.gasProfile.findUnique({ where: { id } });
      if (!profile) {
        res.status(404).json({ error: 'Perfil no encontrado' });
        return;
      }
      res.status(200).json(profile);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error interno obteniendo perfil' });
    }
  },

  async createProfile(req: Request, res: Response): Promise<void> {
    try {
      const data = gasProfileSchema.parse(req.body);
      
      const existing = await prisma.gasProfile.findUnique({ where: { name: data.name } });
      if (existing) {
        res.status(400).json({ error: 'Ya existe un perfil con este nombre' });
        return;
      }

      const newProfile = await prisma.gasProfile.create({ data });
      res.status(201).json(newProfile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Datos inválidos', details: error.issues });
        return;
      }
      console.error(error);
      res.status(500).json({ error: 'Error interno creando perfil' });
    }
  },

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data = gasProfileSchema.parse(req.body);

      const existing = await prisma.gasProfile.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ error: 'Perfil no encontrado' });
        return;
      }

      const updated = await prisma.gasProfile.update({
        where: { id },
        data
      });
      res.status(200).json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Datos inválidos', details: error.issues });
        return;
      }
      console.error(error);
      res.status(500).json({ error: 'Error interno actualizando perfil' });
    }
  },

  async deleteProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const existing = await prisma.gasProfile.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ error: 'Perfil no encontrado' });
        return;
      }

      await prisma.gasProfile.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error interno eliminando perfil' });
    }
  }
};
