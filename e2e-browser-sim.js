const fs = require('fs');
const path = require('path');

const baseUrl = 'http://localhost:3000';

async function runE2E() {
  console.log('--- E2E Browser Simulation ---');
  
  // 1. Get CSRF token
  console.log('\n[1] Fetching CSRF token...');
  const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  const csrfCookie = csrfRes.headers.get('set-cookie').split(';')[0];
  console.log(`✓ Got CSRF token: ${csrfToken.substring(0, 8)}...`);

  // 2. Sign in via /login (simulated via callback)
  console.log('\n[2] Submitting login credentials (test@example.com / password)...');
  const loginBody = new URLSearchParams({
    csrfToken,
    email: 'test@example.com',
    password: 'password',
    json: 'true',
  });
  const loginRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': csrfCookie,
    },
    body: loginBody.toString(),
  });
  
  if (loginRes.status !== 302) {
    console.error('Login failed (no redirect):', loginRes.status);
    process.exit(1);
  }
  
  const setCookies = loginRes.headers.getSetCookie();
  const sessionCookieStr = setCookies.find(c => c.startsWith('authjs.session-token='));
  if (!sessionCookieStr) {
    console.error('Login failed (no session cookie):', setCookies);
    process.exit(1);
  }
  
  const sessionCookie = sessionCookieStr.split(';')[0];
  console.log(`✓ Signed in successfully. Session cookie received.`);

  // 3. Upload a file
  console.log('\n[3] Requesting upload URL...');
  const uploadPayload = {
    filename: 'test-doc.txt',
    contentType: 'text/plain',
    sizeBytes: 12
  };
  const uploadRes = await fetch(`${baseUrl}/api/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie
    },
    body: JSON.stringify(uploadPayload)
  });
  
  if (!uploadRes.ok) {
    console.error('Upload request failed:', await uploadRes.text());
    process.exit(1);
  }
  const { uploadUrl, assetId } = await uploadRes.json();
  console.log(`✓ Got upload URL for asset ${assetId}`);

  console.log('\n[4] PUTting real file to S3...');
  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'text/plain' },
    body: 'Hello World!'
  });
  if (!putRes.ok) {
    console.error('S3 PUT failed:', await putRes.text());
    process.exit(1);
  }
  console.log('✓ File uploaded successfully.');

  // 4. Mint a token
  console.log('\n[5] Minting token...');
  const tokenRes = await fetch(`${baseUrl}/api/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie
    },
    body: JSON.stringify({ assetId })
  });
  if (!tokenRes.ok) {
    console.error('Token mint failed:', await tokenRes.text());
    process.exit(1);
  }
  const { shareUrl } = await tokenRes.json();
  const token = shareUrl.split('/').pop();
  console.log(`✓ Minted token: ${token}`);

  // 5. Resolve it from an "incognito" window (no cookies)
  console.log('\n[6] Resolving token from incognito window (no cookies)...');
  const resolveRes = await fetch(`${baseUrl}/api/resolve/${token}`);
  if (!resolveRes.ok) {
    console.error('Resolve failed:', await resolveRes.text());
    process.exit(1);
  }
  const { streamUrl } = await resolveRes.json();
  console.log(`✓ Resolved token to presigned GET URL.`);

  // 6. Confirm stream
  console.log('\n[7] Confirming file actually streams...');
  const streamRes = await fetch(streamUrl);
  const text = await streamRes.text();
  console.log(`✓ Stream response: "${text}"`);

  if (text === 'Hello World!') {
    console.log('\n🎉 ALL E2E STEPS VERIFIED SUCCESSFULLY.');
  } else {
    console.error('Stream content mismatch!');
    process.exit(1);
  }
}

runE2E().catch(console.error);
