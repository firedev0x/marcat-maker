import 'dotenv/config';
import { TwitterApi } from 'twitter-api-v2';
import { generateGokeLine } from './generate.js';

const client = new TwitterApi({
  appKey: process.env.X_APP_KEY,
  appSecret: process.env.X_APP_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET,
});

try {
  const text = await generateGokeLine();
  if (!text || text.length < 5) throw new Error('draft gol sau prea scurt');
  const res = await client.v2.tweet(text);
  console.log('OK → Tweet ID:', res?.data?.id);
  console.log('Text:', text);
} catch (err) {
  console.error('Eroare:', err?.data ?? err?.message ?? err);
}
