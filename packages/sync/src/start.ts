import sync from './sync';
import express from 'express';

export const start = async () => {
  await sync();
};

const app = express();

app.get('/ping', (_req, res) => {
  res.send('pong');
});

app.get('/git-commit', (_req, res) => {
  res.send(process.env.RENDER_GIT_COMMIT);
});

app.listen(4000);

start();
