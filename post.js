import 'dotenv/config';
import { TwitterApi } from 'twitter-api-v2';
import { generateTweetAndImage } from './grok-image.js'; // noul tău fișier

const client = new TwitterApi({
  appKey: process.env.X_APP_KEY,
  appSecret: process.env.X_APP_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET,
});

// conexiune media v1.1
const rwClient = client.readWrite;

try {
  // 1) generăm tweet + imagine
  const referenceImagePath = './assets/character.png'; // schimbă cu imaginea ta
  const { tweetText, imagePath } = await generateTweetAndImage(referenceImagePath);

  if (!tweetText || tweetText.length < 5) {
    throw new Error('tweet gol sau prea scurt');
  }

  console.log('Tweet text:', tweetText);
  console.log('Imagine generată:', imagePath);

  // 2) încărcăm imaginea în Twitter
  const mediaId = await rwClient.v1.uploadMedia(imagePath);

  // 3) publicăm tweet-ul cu imagine
  const res = await rwClient.v2.tweet({
    text: tweetText,
    media: { media_ids: [mediaId] }
  });

  console.log('OK → Tweet ID:', res?.data?.id);

} catch (err) {
  console.error('Eroare:', err?.data ?? err?.message ?? err);
}
