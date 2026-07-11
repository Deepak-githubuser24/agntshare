const baseUrl = "http://localhost:3000";

async function run() {
  console.log("========== 1. INVITE CODE GATE ==========");
  
  async function attemptLogin(email, password, inviteCode) {
    const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
    const { csrfToken } = await csrfRes.json();
    const cookies = csrfRes.headers.get("set-cookie")?.split(';')[0]; // Extract authjs.csrf-token

    const params = new URLSearchParams({
      csrfToken,
      email,
      password,
      redirect: "false"
    });
    if (inviteCode) params.append("inviteCode", inviteCode);

    const res = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": cookies
      },
      body: params.toString(),
      redirect: "manual"
    });
    
    const location = res.headers.get("Location");
    if (location) {
      if (location.includes("error")) return `REJECTED (Redirected to ${location})`;
      return `SUCCESS (Redirected to ${location})`;
    }
    
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      if (data.url && data.url.includes("error")) return "FAILED (Redirect to error)";
      return "SUCCESS (Session granted)";
    } catch {
      return "SUCCESS (Session granted HTML)";
    }
  }

  console.log("[+] Attempting signup WITHOUT invite code...");
  console.log("Response:", await attemptLogin("newuser1@example.com", "password123"));

  console.log("\n[+] Attempting signup WITH wrong invite code...");
  console.log("Response:", await attemptLogin("newuser2@example.com", "password123", "WRONG"));

  console.log("\n[+] Attempting signup WITH CORRECT invite code...");
  console.log("Response:", await attemptLogin("newuser3@example.com", "password123", "XYZ123"));

  console.log("\n[+] Attempting LOGIN for existing user WITHOUT invite code...");
  console.log("Response:", await attemptLogin("test@example.com", "password"));
}

run().catch(console.error);
