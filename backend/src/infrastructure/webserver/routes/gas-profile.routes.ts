import { Router } from 'express';
import { gasProfileController } from '../../../interfaces/controllers/gas-profile.controller';

const router = Router();

router.get('/', gasProfileController.getProfiles);

export { router as gasProfileRoutes };
