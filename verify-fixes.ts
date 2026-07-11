import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { generateApiKey, storeApiKey } from "./lib/auth/api-keys";
import { query } from "./lib/db/client";

async function run() {
  console.log("========== 1. API KEY AUTH VULNERABILITY ==========");
  const [user] = await query("SELECT id FROM users LIMIT 1");
  const { rawKey, keyHash } = generateApiKey();
  await storeApiKey(user.id, keyHash, "Test Key");
  const apiKey = rawKey;
  console.log(`[+] Generated real API Key for user ${user.id}`);
  
  const uploadPayload = { filename: 'test.txt', contentType: 'text/plain', sizeBytes: 12 };
  
  console.log("\n[+] Hitting /api/upload with VALID key...");
  const res1 = await fetch("http://localhost:3000/api/upload", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(uploadPayload)
  });
  console.log(`Status: ${res1.status}`);
  console.log(`Response:`, await res1.json());
  
  console.log("\n[+] Hitting /api/upload with INVALID key...");
  const res2 = await fetch("http://localhost:3000/api/upload", {
    method: "POST",
    headers: { "Authorization": `Bearer api-wrongkey123456`, "Content-Type": "application/json" },
    body: JSON.stringify(uploadPayload)
  });
  console.log(`Status: ${res2.status}`);
  console.log(`Response:`, await res2.json());

  console.log("\n========== 2. RATE LIMITER ==========");
  console.log("[+] Spamming /api/upload to trigger 429 Too Many Requests...");
  let rateLimited = false;
  for (let i = 0; i < 200; i++) {
    const res = await fetch("http://localhost:3000/api/upload", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(uploadPayload)
    });
    if (res.status === 429) {
      console.log(`[+] Hit rate limit at request #${i + 1}`);
      console.log(`Status: ${res.status}`);
      console.log(`Response:`, await res.json());
      rateLimited = true;
      break;
    }
  }
  
  console.log("\n========== 3. /api/events LOCKDOWN ==========");
  console.log("[+] Hitting /api/events UNAUTHENTICATED...");
  const eventsPayload = { events: [{ name: "test_event", properties: { foo: "bar" } }] };
  const res3 = await fetch("http://localhost:3000/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventsPayload)
  });
  console.log(`Status: ${res3.status}`);
  console.log(`Response:`, await res3.text());
  
  console.log("\n[+] Hitting /api/events with OVERSIZED properties payload...");
  const hugeProperties: any = {};
  for(let i=0; i<10000; i++) { hugeProperties[`key_${i}`] = "value_value_value"; }
  const bigEventsPayload = { events: [{ name: "test_event", properties: hugeProperties }] };
  
  const res4 = await fetch("http://localhost:3000/api/events", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(bigEventsPayload)
  });
  console.log(`Status: ${res4.status}`);
  console.log(`Response:`, await res4.text());
  
  console.log("\n========== 4. /login PAGE RENDER ==========");
  console.log("[+] Fetching /login HTML...");
  const loginRes = await fetch("http://localhost:3000/login");
  const loginHtml = await loginRes.text();
  console.log(`Status: ${loginRes.status}`);
  console.log(`HTML contains form? ${loginHtml.includes('<form')}`);
}

run().catch(console.error).finally(() => process.exit(0));
