"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        inviteCode,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password.");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B0F13] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="font-mono text-sm tracking-tight text-[#EDEAE3]">
            agentshare
          </span>
          <h1 className="mt-4 text-2xl font-medium text-[#EDEAE3]">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-[#9AA4B2]">
            First time? Your account will be created automatically.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-medium text-[#9AA4B2]"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-[#2A323C] bg-[#10151B] px-3 py-2.5 text-sm text-[#EDEAE3] placeholder-[#5C6675] outline-none focus:border-[#5EEAD4] focus:ring-1 focus:ring-[#5EEAD4]"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-medium text-[#9AA4B2]"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-[#2A323C] bg-[#10151B] px-3 py-2.5 text-sm text-[#EDEAE3] placeholder-[#5C6675] outline-none focus:border-[#5EEAD4] focus:ring-1 focus:ring-[#5EEAD4]"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label
              htmlFor="inviteCode"
              className="mb-1.5 block text-xs font-medium text-[#9AA4B2]"
            >
              Invite Code (New Signups Only)
            </label>
            <input
              id="inviteCode"
              type="text"
              autoComplete="off"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="w-full rounded-md border border-[#2A323C] bg-[#10151B] px-3 py-2.5 text-sm text-[#EDEAE3] placeholder-[#5C6675] outline-none focus:border-[#5EEAD4] focus:ring-1 focus:ring-[#5EEAD4]"
              placeholder="If you have an invite..."
            />
          </div>

          {error && (
            <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-[#5EEAD4] px-4 py-2.5 text-sm font-medium text-[#0B0F13] hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#5C6675]">
          By signing in, you agree to the AgentShare terms of service.
        </p>
      </div>
    </main>
  );
}
