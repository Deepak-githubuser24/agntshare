import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { query } from "./lib/db/client";
import { authConfig } from "./auth.config";

const BCRYPT_ROUNDS = 12;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        inviteCode: { label: "Invite Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;
        const inviteCode = credentials.inviteCode as string | undefined;

        if (!email || !password || password.length < 8) return null;

        const users = await query<{
          id: string;
          email: string;
          password_hash: string | null;
        }>("SELECT id, email, password_hash FROM users WHERE email = $1", [
          email,
        ]);

        if (users.length === 0) {
          // First-time sign-up: check for beta invite code
          if (!process.env.BETA_INVITE_CODE || inviteCode !== process.env.BETA_INVITE_CODE) {
            return null; // Reject sign-up if invite code is missing or wrong
          }
          
          // Hash password, create account.
          const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
          await query(
            "INSERT INTO users (email, password_hash, auth_provider) VALUES ($1, $2, $3)",
            [email, passwordHash, "credentials"]
          );
          const [newUser] = await query<{ id: string; email: string }>(
            "SELECT id, email FROM users WHERE email = $1",
            [email]
          );
          return {
            id: newUser.id,
            email: newUser.email,
            name: email.split("@")[0],
          };
        }

        const user = users[0];

        // If the user was created before password hashing was added
        // (legacy account), deny login until they reset.
        if (!user.password_hash) {
          return null;
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return null;

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
