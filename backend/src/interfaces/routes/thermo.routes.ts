// Rutas para servicios termodinámicos
// Custodiado por: @integration-architect

import { Router } from 'express';
import { ThermoController } from '../controllers/thermo.controller';

const router = Router();
const controller = new ThermoController();

router.post('/compressibility', controller.calculateCompressibility);
router.post('/calculate-state', controller.calculateState);
router.post('/isochoric-forecast', controller.isochoricForecast);

export default router;
