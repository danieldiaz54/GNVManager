// Rutas para operaciones de despacho y aforo
// Custodiado por: @integration-architect

import { Router } from 'express';
import { DispatchController } from '../controllers/dispatch.controller';

const router = Router();
const controller = new DispatchController();

router.post('/validate-rack', controller.validateRack);
router.post('/execute-loading', controller.executeLoading);
router.post('/execute-unloading', controller.executeUnloading);

export default router;
