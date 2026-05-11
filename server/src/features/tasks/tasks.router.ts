import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import * as tasksController from './tasks.controller';

const router = Router();

router.use(authMiddleware);

router.post('/', tasksController.createTask);
router.get('/', tasksController.getMyTasks);
router.get('/specialists/overview', tasksController.getSpecialistOverview);
router.post('/:id/accept', tasksController.acceptTask);
router.patch('/:id/status', tasksController.updateStatus);

export default router;
