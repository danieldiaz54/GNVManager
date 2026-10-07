import { Router } from 'express';
import { gasProfileController } from '../../../interfaces/controllers/gas-profile.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, gasProfileController.getProfiles);

export { router as gasProfileRoutes };
