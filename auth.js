// auth.js - OAuth 2.0 Authorization Code + PKCE pentru X (v2)
const crypto = require('crypto');
const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('node:process');

const clientId   = process.env.X_CLIENT_ID;
const redirectUri= process.env.X_REDIRECT_URI || 'https://example.com/callback';
const scopes     = ['tweet.read','tweet.write','users.read','offline.access'].join(' ');
const authBase   = 'https://x.com/i/oauth2/authorize';   // docs
const tokenUrl   = 'https://api.x.com/2/oauth2/token';    // docs

function b64url(buf){ return buf.toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }

const codeVerifier  = b64url(crypto.randomBytes(32));
const codeChallenge = b64url(crypto.createHash('sha256').update(codeVerifier).digest());
const state         = b64url(crypto.randomBytes(16));

const params = new URLSearchParams({
  response_type: 'code',
  client_id: clientId,
  redirect_uri: redirectUri,
  scope: scopes,
  state,
  code_challenge: codeChallenge,
  code_challenge_method: 'S256'
});

const authUrl = `${authBase}?${params.toString()}`;

(async () => {
  console.log('1) Deschide acest URL și autorizează accesul:\n');
  console.log(authUrl, '\n');

  const rl = readline.createInterface({ input, output });
  const redirected = await rl.question('2) Lipeste AICI URL-ul complet unde ai fost redirectionat: ');
  rl.close();

  const u = new URL(redirected);
  if (u.searchParams.get('state') !== state) {
    console.error('State mismatch. Reia pașii.');
    process.exit(1);
  }
  const code = u.searchParams.get('code');
  if (!code) { console.error('Nu am primit ?code=...'); process.exit(1); }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    redirect_uri: redirectUri,
    code,
    code_verifier: codeVerifier
  });

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type':'application/x-www-form-urlencoded' },
    body
  });
  const data = await res.json();
  console.log('\nTokens response:\n', data);
  console.log('\nIMPORTANT: salvează access_token și refresh_token.');
})();
