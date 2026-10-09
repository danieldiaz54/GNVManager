import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const modules = [
    // 1. Cascadas Estacionarias (Baterías de planta fijas - Video 3.2)
    {
      name: 'Cascada Estacionaria 10x150L',
      type: 'ESTACIONARIA',
      cylinderCount: 10,
      cylinderCapacityLiters: 150.0,
      totalCapacityLiters: 1500.0,
    },
    {
      name: 'Cascada Estacionaria 12x150L',
      type: 'ESTACIONARIA',
      cylinderCount: 12,
      cylinderCapacityLiters: 150.0,
      totalCapacityLiters: 1800.0,
    },
    {
      name: 'Cascada Estacionaria 16x150L',
      type: 'ESTACIONARIA',
      cylinderCount: 16,
      cylinderCapacityLiters: 150.0,
      totalCapacityLiters: 2400.0,
    },
    {
      name: 'Cascada Estacionaria 10x125L',
      type: 'ESTACIONARIA',
      cylinderCount: 10,
      cylinderCapacityLiters: 125.0,
      totalCapacityLiters: 1250.0,
    },
    {
      name: 'Cascada Estacionaria 16x125L',
      type: 'ESTACIONARIA',
      cylinderCount: 16,
      cylinderCapacityLiters: 125.0,
      totalCapacityLiters: 2000.0,
    },

    // 2. Módulos de Transporte (Tráilers Móviles de Carretera - Fichas Técnicas)
    {
      name: 'Tráiler Transporte 11 Tubos (26.95 m³)',
      type: 'TRANSPORTE',
      cylinderCount: 11,
      cylinderCapacityLiters: 2450.0,
      totalCapacityLiters: 26950.0,
    },
    {
      name: 'Tráiler Transporte 11 Tubos (25.52 m³)',
      type: 'TRANSPORTE',
      cylinderCount: 11,
      cylinderCapacityLiters: 2320.0,
      totalCapacityLiters: 25520.0,
    },
    {
      name: 'Tráiler Transporte 12 Tubos (27.84 m³)',
      type: 'TRANSPORTE',
      cylinderCount: 12,
      cylinderCapacityLiters: 2320.0,
      totalCapacityLiters: 27840.0,
    }
  ];

  for (const mod of modules) {
    await prisma.storageModule.upsert({
      where: { name: mod.name },
      update: {
        type: mod.type,
        cylinderCount: mod.cylinderCount,
        cylinderCapacityLiters: mod.cylinderCapacityLiters,
        totalCapacityLiters: mod.totalCapacityLiters,
      },
      create: mod,
    });
  }
  console.log('Módulos sembrados exitosamente (Estacionarios y Transporte).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
