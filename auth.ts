import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { query } from "./lib/db/client";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Mock Credentials (MVP)",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "test@example.com" },
        password: { label: "Password", type: "password", placeholder: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;

        // In MVP, if the user doesn't exist, we just create them for seamless local testing.
        // In production, this would be a strict check against hashed passwords.
        let users = await query<{ id: string; email: string }>(
          "SELECT id, email FROM users WHERE email = $1",
          [email]
        );

        if (users.length === 0) {
           await query("INSERT INTO users (email, auth_provider) VALUES ($1, $2)", [email, "credentials"]);
           users = await query<{ id: string; email: string }>(
            "SELECT id, email FROM users WHERE email = $1",
            [email]
          );
        }

        const user = users[0];
        return { id: user.id, email: user.email, name: email.split("@")[0] };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
