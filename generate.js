import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import FormData from 'form-data';

const XAI_URL = 'https://api.x.ai/v1/chat/completions';
const MODEL = 'grok-4';

// OpenAI
const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_IMAGES_URL = 'https://api.openai.com/v1/images/edits';

const SYSTEM = `
You are about to see an image called “Marcat Maker.”  
It is a cat built entirely from trading candlesticks.  
Its personality: chaotic, sarcastic, unpredictable, obsessed with charts, and always “making the market” instead of trading it.
TASK:Analyze the image and understand the mascot’s vibe.
Create a short meme caption for X (Twitter) based on the mascot.
The meme must be crypto-themed, funny, and formatted as a standalone tweet. Do NOT explain the joke. Deliver only the meme caption.
Keep it under 280 characters.
Tone: chaotic crypto humor + trading irony. no emoji.
`.trim();

function clean(text) {
  let t = (text || '').replace(/\s+/g, ' ').trim();
  t = t.replace(/@\w+/g, '');              // fără mențiuni
  t = t.replace(/^"|"$|^'|'$/g, '');       // fără ghilimele la capete
  if (t.length > 280) t = t.slice(0, 280); // limită X
  return t;
}

/**
 * 1) Generează linia de tweet cu Grok
 */
export async function generateGrokLine() {
  const r = await fetch(XAI_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: 'Generate the tweet line now.' }
      ],
      temperature: 0.8,
      stream: false
    })
  });

  if (!r.ok) {
    const text = await r.text();
    throw new Error(`xAI error ${r.status}: ${text}`);
  }

  const data = await r.json();
  const raw = data?.choices?.[0]?.message?.content || '';
  return clean(raw);
}

/**
 * 2) Construiește un prompt de imagine pe baza tweet-ului,
 *    folosind ChatGPT (OpenAI Chat API)
 */
async function buildImagePromptFromTweet(tweetText) {
  const r = await fetch(OPENAI_CHAT_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini', // poți schimba modelul dacă vrei
      messages: [
        {
          role: 'system',
          content: `
You turn short crypto tweets into vivid, single-sentence image prompts.
Rules:
- Describe only the visual scene, no text to be written inside the image.
- Mention that the main character is the same character from the reference image (a recurring meme character).
- Focus on mood, action and setting, not on words.
`.trim()
        },
        {
          role: 'user',
          content: `
Tweet:
"${tweetText}"

Create one sentence that describes a meme-style illustration that fits this tweet.
Do NOT ask any questions, just output the image description.
`.trim()
        }
      ],
      temperature: 0.8,
      stream: false
    })
  });

  if (!r.ok) {
    const text = await r.text();
    throw new Error(`OpenAI chat error ${r.status}: ${text}`);
  }

  const data = await r.json();
  const prompt = data?.choices?.[0]?.message?.content?.trim() || '';
  return prompt;
}

/**
 * 3) Generează imaginea folosind OpenAI Images API + imagine de referință
 *    - referenceImagePath: path local la imaginea personajului tău (PNG/JPG)
 *    - întoarce calea fișierului generat (de ex. ./output/image-xxx.png)
 */
async function generateImageFromPrompt(prompt, referenceImagePath, outputPath = './output/tweet-image.png') {
  const form = new FormData();

  // model gpt-image-1 este noul model de imagine al OpenAI
  form.append('model', 'gpt-image-1');
  form.append('prompt', prompt);
  form.append('image', fs.createReadStream(referenceImagePath));
  form.append('size', '1024x1024'); // poți schimba dacă vrei alt format

  const r = await fetch(OPENAI_IMAGES_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      ...form.getHeaders()
    },
    body: form
  });

  if (!r.ok) {
    const text = await r.text();
    throw new Error(`OpenAI image error ${r.status}: ${text}`);
  }

  const data = await r.json();
  const b64 = data?.data?.[0]?.b64_json;

  if (!b64) {
    throw new Error('No image returned from OpenAI.');
  }

  const buffer = Buffer.from(b64, 'base64');
  // te asiguri că folderul ./output există
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buffer);

  return outputPath;
}

/**
 * 4) Funcție high-level:
 *    - cere linia de la Grok
 *    - construiește promptul de imagine cu ChatGPT
 *    - generează imaginea finală folosind imaginea ta de referință
 *
 *  returnează:
 *    { tweetText, imagePath }
 */
export async function generateTweetAndImage(referenceImagePath) {
  // 1. textul de la Grok
  const tweetText = await generateGrokLine();

  // 2. prompt de imagine din tweet (ChatGPT)
  const imagePrompt = await buildImagePromptFromTweet(tweetText);

  // 3. imaginea finală folosind personajul tău de referință
  const imagePath = await generateImageFromPrompt(imagePrompt, referenceImagePath);

  return { tweetText, imagePath };
}
