import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

function mustGetNonEmptyEnv(name: string) {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(
      `Missing ${name}. Add it to .env.local (do not leave it blank).`,
    );
  }
  return v;
}

function toCustomerId(input: string) {
  const safe = input.trim().replace(/[^a-zA-Z0-9_-]/g, "_");
  return `alloy_${safe}`;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: mustGetNonEmptyEnv("GOOGLE_CLIENT_ID"),
      clientSecret: mustGetNonEmptyEnv("GOOGLE_CLIENT_SECRET"),
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account }) {
      // Prefer the stable Google account id when available.
      const stable =
        account?.providerAccountId ?? token.sub ?? token.email ?? "unknown";

      token.customer_id = toCustomerId(stable);
      return token;
    },
    async session({ session, token }) {
      session.customer_id = (token.customer_id as string) ?? "";
      return session;
    },
  },
  secret: mustGetNonEmptyEnv("NEXTAUTH_SECRET"),
};

