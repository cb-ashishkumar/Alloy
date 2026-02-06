"use client";

import { signIn } from "next-auth/react";

export default function SignInPage() {
  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-md">
        <div className="rounded-2xl border border-zinc-200 bg-white/60 p-8 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/40">
          <div className="text-sm text-zinc-600 dark:text-zinc-300">
            Alloy (All in one) • Merchant POV
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Use Google to continue. We’ll generate your <code>customer_id</code>{" "}
            and sync your subscriptions from Chargebee.
          </p>

          <button
            onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
            className="mt-6 w-full rounded-2xl bg-zinc-900 px-5 py-3 text-base font-semibold text-white transition hover:bg-zinc-800 active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            Continue with Google
          </button>
        </div>
      </div>
    </main>
  );
}

