import 'dotenv/config';

const XAI_URL = 'https://api.x.ai/v1/chat/completions';
const MODEL = 'grok-4';

const SYSTEM = `
say one surprising and literally true thing about Elon Musk
`.trim();

function clean(text) {
  let t = (text || '').replace(/\s+/g, ' ').trim();
  t = t.replace(/@\w+/g, '');              // fără mențiuni
  t = t.replace(/^"|"$|^'|'$/g, '');       // fără ghilimele la capete
  if (t.length > 280) t = t.slice(0, 280); // limită X
  return t;
}

export async function generateGokeLine() {
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
        { role: 'user', content: 'create one tweet line now.' }
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
