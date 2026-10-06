import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IUserRepository, UserEntity } from '../../domain/repositories/IUserRepository';

export interface LoginResult {
  token: string;
  user: {
    username: string;
    role: string;
  };
}

export class LoginUserUseCase {
  private repository: IUserRepository;

  constructor(repository: IUserRepository) {
    this.repository = repository;
  }

  public async execute(username: string, passwordPlain: string): Promise<LoginResult> {
    const user = await this.repository.findByUsername(username);

    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    const isValidPassword = await bcrypt.compare(passwordPlain, user.passwordHash);

    if (!isValidPassword) {
      throw new Error('Credenciales inválidas');
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const token = jwt.sign(
      { id: user.id, role: user.role },
      secret,
      { expiresIn: process.env.JWT_EXPIRATION || '8h' }
    );

    return {
      token,
      user: {
        username: user.username,
        role: user.role
      }
    };
  }
}
