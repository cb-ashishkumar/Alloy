import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-zinc-200 bg-white/60 p-8 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/40">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
            Alloy • Merchant POV
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            Billing that feels effortless
          </h1>
          <p className="mt-3 text-zinc-600 dark:text-zinc-300">
            Next up: Google sign-in, Chargebee customer auto-provisioning, and a
            subscription dashboard across Jira, Confluence, Loom, and the
            Package.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/signin"
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 active:scale-[0.99] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 active:scale-[0.99] dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              Go to dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

