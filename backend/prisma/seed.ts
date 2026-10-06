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
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
