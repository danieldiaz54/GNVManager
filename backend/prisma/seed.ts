import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminExists = await prisma.user.findUnique({
    where: { username: 'gerente_gnv' }
  });

  if (!adminExists) {
    const passwordHash = await bcrypt.hash('seguridad123', 10);
    const user = await prisma.user.create({
      data: {
        username: 'gerente_gnv',
        passwordHash,
        role: 'admin'
      }
    });
    console.log(`Usuario administrador creado con ID: ${user.id}`);
  } else {
    console.log('El usuario administrador ya existe.');
  }

  // Seed Gas Profiles
  const profiles = [
    {
      name: 'Bonga-Mamey',
      methanePercentage: 96.3666,
      nitrogenPercentage: 2.5379,
      grossCalorificValue: 8884.25,
      specificGravity: 0.5756,
      molarMass: 0.5756 * 28.9625,
      criticalPressure: 46.0,
      criticalTemperature: 191.0
    },
    {
      name: 'Candilejas',
      methanePercentage: 99.1685,
      nitrogenPercentage: null,
      grossCalorificValue: 8940.76,
      specificGravity: 0.5600,
      molarMass: 0.5600 * 28.9625,
      criticalPressure: 46.0,
      criticalTemperature: 191.0
    }
  ];

  for (const profile of profiles) {
    const existingProfile = await prisma.gasProfile.findUnique({
      where: { name: profile.name }
    });

    if (!existingProfile) {
      await prisma.gasProfile.create({ data: profile });
      console.log(`Perfil de gas creado: ${profile.name}`);
    } else {
      await prisma.gasProfile.update({
        where: { name: profile.name },
        data: profile
      });
      console.log(`Perfil de gas actualizado: ${profile.name}`);
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
