// Rutas para aforos y certificaciones operacionales
// Custodiado por: @integration-architect

import { Router } from 'express';
import { AforoController } from '../controllers/aforo.controller';

const router = Router();
const controller = new AforoController();

router.post('/certify-sabanas', controller.certifySabanas);

export default router;
