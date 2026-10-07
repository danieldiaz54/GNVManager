import { Router } from 'express';
import { gasProfileController } from '../../../interfaces/controllers/gas-profile.controller';

const router = Router();

router.get('/', gasProfileController.getProfiles);
router.get('/:id', gasProfileController.getProfileById);
router.post('/', gasProfileController.createProfile);
router.put('/:id', gasProfileController.updateProfile);
router.delete('/:id', gasProfileController.deleteProfile);

export { router as gasProfileRoutes };
