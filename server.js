import 'dotenv/config';
import express from 'express';
import { TwitterApi } from 'twitter-api-v2';
import { generateTweetAndImage } from './grok-image.js'; // noul fișier

const app = express();
const PORT = process.env.PORT || 3000;
const POST_KEY = process.env.GOKE_POST_KEY;

const client = new TwitterApi({
  appKey: process.env.X_APP_KEY,
  appSecret: process.env.X_APP_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET,
});

// conexiune media v1.1 (obligatoriu pentru imagini)
const rwClient = client.readWrite;

// funcția modernizată pentru un singur post
async function postOnce() {
  // 1) generăm tweet + imagine
  const referenceImagePath = './assets/character.png'; // schimbă dacă e nevoie
  const { tweetText, imagePath } = await generateTweetAndImage(referenceImagePath);

  if (!tweetText || tweetText.length < 5) {
    throw new Error('Tweet gol sau prea scurt');
  }

  // 2) încărcăm imaginea
  const mediaId = await rwClient.v1.uploadMedia(imagePath);

  // 3) postăm tweet-ul cu media
  const res = await rwClient.v2.tweet({
    text: tweetText,
    media: { media_ids: [mediaId] }
  });

  return {
    id: res?.data?.id,
    text: tweetText,
    image: imagePath
  };
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
