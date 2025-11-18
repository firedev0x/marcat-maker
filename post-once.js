import 'dotenv/config';
import { TwitterApi } from 'twitter-api-v2';

const client = new TwitterApi({
  appKey: process.env.X_APP_KEY,
  appSecret: process.env.X_APP_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET,
});

try {
  const text = 'grok online. this is an automated test.';
  const res = await client.v2.tweet(text);
  console.log('Tweet ID:', res?.data?.id);
  console.log('OK. Caută-l pe profilul tău de X.');
} catch (err) {
  console.error('Eroare la postare:', err?.data ?? err?.message ?? err);
}
