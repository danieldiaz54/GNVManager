import { Router } from 'express';
import { storageModuleController } from '../../../interfaces/controllers/storage-module.controller';

const router = Router();

router.get('/', storageModuleController.getStorageModules);
router.post('/', storageModuleController.createStorageModule);

export { router as storageModuleRoutes };
