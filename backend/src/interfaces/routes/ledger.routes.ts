// Rutas para el Libro Mayor de Conciliación y Mermas
// Custodiado por: @integration-architect

import { Router } from 'express';
import { LedgerController } from '../controllers/ledger.controller';

const router = Router();
const controller = new LedgerController();

router.post('/record-entry', controller.recordEntry);
router.get('/verify-integrity', controller.verifyIntegrity);
router.post('/analyze-shrinkage', controller.analyzeShrinkage);
router.get('/entries', controller.getAllEntries);

export default router;
