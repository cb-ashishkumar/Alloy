"use client";

import { apiFetch } from "@/lib/apiFetch";
import { useEffect, useState } from "react";

type Props = {
  subscriptionId: string;
  height?: number;
};

export function PortalEmbed({ subscriptionId, height = 760 }: Props) {
  const [accessUrl, setAccessUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      setAccessUrl(null);
      try {
        const res = await apiFetch(
          "/api/chargebee/portal-session",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          },
          { logEndpoint: "/api/chargebee/portal-session" },
        );
        const json: unknown = await res.json();
        if (!res.ok) throw new Error("Failed to create portal session");

        const ps =
          typeof json === "object" && json !== null && "portal_session" in json
            ? (json as { portal_session?: { access_url?: string } }).portal_session
            : null;
        const url = ps?.access_url ?? null;
        if (!url) throw new Error("Missing portal_session.access_url");

        if (!cancelled) setAccessUrl(url);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [subscriptionId]);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/70 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/40">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <div>
          <div className="text-base font-semibold">Manage in Portal</div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Subscription:{" "}
            <code className="rounded bg-black/5 px-1.5 py-0.5 text-xs dark:bg-white/10">
              {subscriptionId}
            </code>
          </div>
        </div>
        {accessUrl ? (
          <a
            href={accessUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Open in new tab ↗
          </a>
        ) : null}
      </div>

      <div className="p-4">
        {loading ? (
          <div className="rounded-xl border border-zinc-200 bg-white px-4 py-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-300">
            Loading portal…
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        ) : accessUrl ? (
          <iframe
            title="Chargebee Portal"
            src={accessUrl}
            className="w-full rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950/40"
            style={{ height }}
          />
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-white px-4 py-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-300">
            Portal is not available.
          </div>
        )}
      </div>
    </div>
  );
}

