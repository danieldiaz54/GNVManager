import { Router } from 'express';
import { ThermodynamicController } from '../../../interfaces/controllers/thermodynamic.controller';
import { requireAuth } from '../middlewares/auth.middleware';

// Capa 4: Frameworks & Drivers (Web/Routes)
// Conecta el framework de Express con los Controladores.
const router = Router();
const thermodynamicController = new ThermodynamicController();

// Ruta protegida (requireAuth) para calcular la transferencia termodinámica
// En un inicio, para pruebas desde el Frontend, podríamos quitar requireAuth temporalmente,
// pero dejaremos la ruta abierta por ahora para asegurar que el Frontend pueda conectarse
// sin necesidad de hacer el flujo de login completo aún.
router.post('/calculate', thermodynamicController.calculateTransfer);
router.post('/calculate-batch', thermodynamicController.calculateBatch);

export default router;
