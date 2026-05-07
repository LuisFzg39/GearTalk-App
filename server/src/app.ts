import express from 'express';
import cors from 'cors';
import { PORT, CLIENT_URL } from './config';
import { errorMiddleware } from './middlewares/error.middleware';

const app = express();

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// TODO Person 1: mount auth router here
// TODO Person 1: mount tasks router here
// TODO Person 2: mount messages router here
// TODO Person 2: mount translation router here

app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

export { app };
