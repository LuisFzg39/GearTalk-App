import express from 'express';
import { CLIENT_URL, missingEnv } from './config';
import { errorMiddleware } from './middlewares/error.middleware';
import authRouter from './features/auth/auth.router';
import tasksRouter from './features/tasks/tasks.router';
import translationRouter from './features/translation/translation.router';
import messagesRouter from './features/messages/messages.router';

const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    req.headers['access-control-request-headers'] ?? 'Content-Type, Authorization'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    req.headers['access-control-request-method'] ?? 'GET,POST,PATCH,OPTIONS'
  );
  res.setHeader('Vary', 'Access-Control-Request-Headers, Access-Control-Request-Method');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
});
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
