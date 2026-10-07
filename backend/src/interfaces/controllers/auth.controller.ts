import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../infrastructure/webserver/middlewares/auth.middleware';
import { LoginUserUseCase } from '../../application/use-cases/LoginUser';
import { PrismaUserRepository } from '../../infrastructure/database/PrismaUserRepository';

// 1. Zod Schema: Validación estricta de los datos de entrada (Previene Inyección)
const loginSchema = z.object({
  username: z.string().min(3, "El usuario debe tener al menos 3 caracteres").max(50),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres")
});

export class AuthController {
  private loginUseCase: LoginUserUseCase;

  constructor() {
    const userRepository = new PrismaUserRepository();
    this.loginUseCase = new LoginUserUseCase(userRepository);
  }
  
  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      // Zod lanzará una excepción si el body tiene scripts, tipos incorrectos o longitud inválida
      const validatedData = loginSchema.parse(req.body);

      const result = await this.loginUseCase.execute(validatedData.username, validatedData.password);

      res.status(200).json({
        message: 'Autenticación exitosa',
        token: result.token,
        user: result.user
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        // ZodError contiene los detalles precisos de qué campo falló
        res.status(400).json({ error: 'Datos de entrada inválidos', details: error.errors });
        return;
      }
      if (error instanceof Error && error.message === 'Credenciales inválidas') {
        res.status(401).json({ error: 'Credenciales inválidas' });
        return;
      }
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  public getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    // Si llegamos aquí, el middleware `requireAuth` ya validó el JWT
    res.status(200).json({
      message: 'Acceso autorizado al perfil',
      user: req.user
    });
  };
}
