import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const gasProfileController = {
  async getProfiles(req: Request, res: Response) {
    try {
      const profiles = await prisma.gasProfile.findMany({
        orderBy: { name: 'asc' }
      });
      res.status(200).json(profiles);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error while fetching gas profiles' });
    }
  }
};
