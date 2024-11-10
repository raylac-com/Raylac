import sync from './sync';
import express from 'express';

export const start = async () => {
  await sync();
};

const app = express();

app.get('/ping', (_req, res) => {
  res.send('pong');
});

app.listen(4000);

start();
