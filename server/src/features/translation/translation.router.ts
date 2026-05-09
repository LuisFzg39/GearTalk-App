import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { translationController } from './translation.controller';

const router = Router();

router.use(authMiddleware);
router.post('/translate', translationController.translate);

export default router;
