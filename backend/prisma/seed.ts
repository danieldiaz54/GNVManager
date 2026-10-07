import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminExists = await prisma.user.findUnique({
    where: { username: 'gerente_gnv' }
  });

  const passwordHash = await bcrypt.hash('seguridad123', 10);
  
  if (!adminExists) {
    const user = await prisma.user.create({
      data: {
        username: 'gerente_gnv',
        fullName: 'Fernando Diaz Benavides',
        passwordHash,
        role: 'admin'
      }
    });
    console.log(`Usuario administrador creado con ID: ${user.id}`);
  } else {
    await prisma.user.update({
      where: { username: 'gerente_gnv' },
      data: { fullName: 'Fernando Diaz Benavides' }
    });
    console.log('El usuario administrador ya existe. Actualizado con nombre completo.');
  }

  // Seed Gas Profiles con datos oficiales de los certificados Surtigas 2026
  const profiles = [
    {
      name: 'EDS GNC La Sabana (Bonga - Mamey)',
      methanePercentage: 96.3666,
      nitrogenPercentage: 2.5379,
      grossCalorificValue: 8884.2562,
      specificGravity: 0.5756,
      molarMass: 16.6708, // 0.5756 * 28.9625
      criticalPressure: 46.0,
      criticalTemperature: 191.0
    },
    {
      name: 'EDS GNC Candilejas (Canacol 2)',
      methanePercentage: 99.1685,
      nitrogenPercentage: 0.3994,
      grossCalorificValue: 8940.7667,
      specificGravity: 0.5600,
      molarMass: 16.2190, // 0.5600 * 28.9625
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
