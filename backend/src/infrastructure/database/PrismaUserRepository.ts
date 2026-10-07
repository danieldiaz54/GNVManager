import { PrismaClient } from '@prisma/client';
import { IUserRepository, UserEntity } from '../../domain/repositories/IUserRepository';

const prisma = new PrismaClient();

export class PrismaUserRepository implements IUserRepository {
  async findByUsername(username: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: { username }
    });
    return user ? (user as UserEntity) : null;
  }
}
