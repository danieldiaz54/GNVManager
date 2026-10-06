import { Router } from 'express';
import { AuthController } from '../../../interfaces/controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();
const authController = new AuthController();

// Ruta pública: Login (devuelve JWT)
router.post('/login', authController.login);

// Ruta protegida: Perfil del usuario (Requiere JWT)
router.get('/me', requireAuth, authController.getProfile);

export default router;
