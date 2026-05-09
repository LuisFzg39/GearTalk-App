import express from 'express';
import cors from 'cors';
import { PORT, CLIENT_URL } from './config';
import { errorMiddleware } from './middlewares/error.middleware';
import authRouter from './features/auth/auth.router';
import tasksRouter from './features/tasks/tasks.router';
import translationRouter from './features/translation/translation.router';

const app = express();

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    name: 'GearTalk API',
    health: '/api/health',
    routes: {
      auth: '/api/auth',
      tasks: '/api/tasks',
      translation: '/api/translation',
    },
    client: CLIENT_URL,
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/translation', translationRouter);
// TODO Person 2: mount messages router here

app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

export { app };
