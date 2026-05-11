import express from 'express';
import { CLIENT_URL, missingEnv } from './config';
import { errorMiddleware } from './middlewares/error.middleware';
import authRouter from './features/auth/auth.router';
import tasksRouter from './features/tasks/tasks.router';
import translationRouter from './features/translation/translation.router';
import messagesRouter from './features/messages/messages.router';

const app = express();

const normalizeOrigin = (value: string): string => {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const configuredOrigins = CLIENT_URL.split(',')
  .map(normalizeOrigin)
  .filter(Boolean);

const isAllowedVercelPreview = (origin: string): boolean => {
  try {
    const { hostname, protocol } = new URL(origin);
    return protocol === 'https:' && hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
};

const isAllowedOrigin = (origin: string): boolean => {
  const normalizedOrigin = normalizeOrigin(origin);
  return (
    configuredOrigins.length === 0 ||
    configuredOrigins.includes(normalizedOrigin) ||
    isAllowedVercelPreview(normalizedOrigin)
  );
};

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (typeof origin === 'string' && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', normalizeOrigin(origin));
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader(
      'Access-Control-Allow-Headers',
      req.headers['access-control-request-headers'] ?? 'Content-Type, Authorization'
    );
    res.setHeader(
      'Access-Control-Allow-Methods',
      req.headers['access-control-request-method'] ?? 'GET,POST,PATCH,OPTIONS'
    );
  }

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
