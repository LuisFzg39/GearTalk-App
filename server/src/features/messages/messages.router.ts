import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { messagesController } from './messages.controller';

const router = Router();

router.use(authMiddleware);

router.get('/tasks/:taskId/messages', messagesController.listForTask);
router.post('/tasks/:taskId/messages', messagesController.createForTask);

export default router;
