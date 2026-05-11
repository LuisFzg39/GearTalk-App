import express from 'express';
import cors from 'cors';
import { CLIENT_URL, missingEnv } from './config';
import { errorMiddleware } from './middlewares/error.middleware';
import authRouter from './features/auth/auth.router';
import tasksRouter from './features/tasks/tasks.router';
import translationRouter from './features/translation/translation.router';
import messagesRouter from './features/messages/messages.router';

const app = express();

app.use(
  cors({
    origin: CLIENT_URL || true,
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
      messages: '/api/messages',
    },
    client: CLIENT_URL,
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: missingEnv.length === 0 ? 'ok' : 'misconfigured',
    missingEnv,
  });
});

app.use('/api/auth', authRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/translation', translationRouter);
app.use('/api/messages', messagesRouter);

app.use(errorMiddleware);

export default app;
export { app };
