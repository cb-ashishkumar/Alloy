"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition",
        active
          ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
          : "border-zinc-200 bg-white/60 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200 dark:hover:bg-zinc-900",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function OnboardingClient({ initialEmail }: { initialEmail: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [businessEntityId, setBusinessEntityId] = useState<"US" | "EU" | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = useMemo(() => /\S+@\S+\.\S+/.test(email.trim()), [email]);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch(
        "/api/chargebee/customer",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          // Send region-like "US"/"EU"; backend maps to real Chargebee business_entity_id.
          body: JSON.stringify({ email, region: businessEntityId }),
        },
        { logEndpoint: "/api/chargebee/customer" },
      );
      const json: unknown = await res.json();
      if (!res.ok) {
        const msg =
          typeof json === "object" && json !== null
            ? String(
                (json as { message?: unknown; error?: unknown }).message ??
                  (json as { message?: unknown; error?: unknown }).error ??
                  "Failed",
              )
            : "Failed";
        throw new Error(msg);
      }
      router.replace("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-2xl border border-zinc-200 bg-white/60 p-8 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/40">
        <div className="text-sm text-zinc-600 dark:text-zinc-300">
          Alloy (All in one) • Setup
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Confirm region & contact
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          We’ll create your Chargebee customer. Region determines{" "}
          <code className="rounded bg-black/5 px-1 py-0.5 dark:bg-white/10">
            business_entity_id
          </code>{" "}
          and will be locked after setup.
        </p>

        <div className="mt-6 grid gap-4">
          <div>
            <div className="text-sm font-semibold">Work email</div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none ring-zinc-900/10 focus:ring-4 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-100"
              placeholder="name@company.com"
              inputMode="email"
            />
            {!emailValid && email.trim().length > 0 ? (
              <div className="mt-2 text-xs text-red-700 dark:text-red-300">
                Enter a valid email.
              </div>
            ) : null}
          </div>

          <div>
            <div className="text-sm font-semibold">Sales region</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Chip
                active={businessEntityId === "US"}
                onClick={() => setBusinessEntityId("US")}
              >
                US
              </Chip>
              <Chip
                active={businessEntityId === "EU"}
                onClick={() => setBusinessEntityId("EU")}
              >
                EU
              </Chip>
            </div>
            <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              US customers billed in USD • EU customers billed in EUR/GBP
            </div>
          </div>

          <button
            type="button"
            onClick={() => void submit()}
            disabled={submitting || !emailValid || !businessEntityId}
            className="mt-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            {submitting ? "Creating customer…" : "Continue"}
          </button>

          <AnimatePresence>
            {error ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200"
              >
                {error}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

