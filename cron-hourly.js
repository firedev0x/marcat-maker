import 'dotenv/config';
import { TwitterApi } from 'twitter-api-v2';
import { generateGokeLine } from './generate.js';

// panic switch din .env: GOKE_ENABLED=0/false/off -> nu postează
const ENABLED = (process.env.GOKE_ENABLED ?? '1').toString().toLowerCase();
if (ENABLED === '0' || ENABLED === 'false' || ENABLED === 'off') {
  console.log('skip: GOKE_ENABLED is off');
  process.exit(0);
}

const client = new TwitterApi({
  appKey: process.env.X_APP_KEY,
  appSecret: process.env.X_APP_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET,
});

(async () => {
  const text = await generateGokeLine();
  if (!text || text.length < 5) {
    console.log('skip: draft gol sau prea scurt');
    return;
  }
  const res = await client.v2.tweet(text);
  console.log('OK → Tweet ID:', res?.data?.id);
  console.log('Text:', text);
})();
