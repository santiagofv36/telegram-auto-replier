import express from 'express';
import { client } from './telegram';

const app = express();

app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

app.get('/debug/chats', async (req, res) => {
  const token = req.headers['x-debug-key'];

  if (!token || token !== process.env.DEBUG_API_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const dialogs = await client.getDialogs({});

  const groups = dialogs
    .map((d) => d.entity)
    .filter((e: any) => e.className === 'Chat' || e.className === 'Channel')
    .map((g: any) => ({
      title: g.title,
      id: g.id.toString(),
      type: g.className,
    }));

  res.json(groups);
});

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`Listening ${port}`);
});
