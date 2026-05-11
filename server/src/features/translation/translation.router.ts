import { Router } from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../../middlewares/auth.middleware';
import { translationController } from './translation.controller';

const router = Router();

router.post('/ui-bundle', optionalAuthMiddleware, translationController.bundleUi);
router.use(authMiddleware);
router.post('/translate', translationController.translate);

export default router;
