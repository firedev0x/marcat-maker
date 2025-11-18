import 'dotenv/config';
import express from 'express';
import { TwitterApi } from 'twitter-api-v2';
import { generateGokeLine } from './generate.js';

const app = express();
const PORT = process.env.PORT || 3000;
const POST_KEY = process.env.GOKE_POST_KEY;

const client = new TwitterApi({
  appKey: process.env.X_APP_KEY,
  appSecret: process.env.X_APP_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET,
});

async function postOnce() {
  const text = await generateGokeLine();
  if (!text || text.length < 5) throw new Error('draft gol sau prea scurt');
  const res = await client.v2.tweet(text);
  return { id: res?.data?.id, text };
}

// healthcheck simplu
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'goke-bot', tz: 'Europe' });
});

// trigger manual protejat prin ?key=
app.get('/post-now', async (req, res) => {
  try {
    if (!POST_KEY || req.query.key !== POST_KEY) {
      return res.status(403).send('forbidden');
    }
    const out = await postOnce();
    res.json({ ok: true, ...out });
  } catch (err) {
    const msg = err?.data ?? err?.message ?? String(err);
    res.status(500).json({ ok: false, error: msg });
  }
});

app.listen(PORT, () => {
  console.log(`goke bot running on http://localhost:${PORT}`);
});
