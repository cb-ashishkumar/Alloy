"use client";

import { onApiCall } from "@/lib/apiLog";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

type Chip = {
  id: string;
  endpoint: string;
};

function shortEndpoint(s: string) {
  // Keep only the endpoint part (no origin). We already pass paths, but be safe.
  try {
    if (s.startsWith("http")) {
      const u = new URL(s);
      return u.pathname;
    }
  } catch {
    // ignore
  }
  return s;
}

export function ApiCallChips() {
  const [chips, setChips] = useState<Chip[]>([]);
  const timers = useRef<Map<string, number>>(new Map());

  const maxChips = 6;
  const ttlMs = 4500;

  const accent = useMemo(
    () => [
      "border-indigo-200 bg-indigo-50 text-indigo-900 dark:border-indigo-900/40 dark:bg-indigo-950/40 dark:text-indigo-200",
      "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200",
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200",
    ],
    [],
  );

  useEffect(() => {
    return onApiCall(({ endpoint }) => {
      const id = crypto.randomUUID();
      const chip: Chip = { id, endpoint: shortEndpoint(endpoint) };
      setChips((prev) => [chip, ...prev].slice(0, maxChips));

      const t = window.setTimeout(() => {
        setChips((prev) => prev.filter((c) => c.id !== id));
        timers.current.delete(id);
      }, ttlMs);
      timers.current.set(id, t);
    });
  }, []);

  useEffect(() => {
    const map = timers.current;
    return () => {
      for (const [, t] of map) window.clearTimeout(t);
      map.clear();
    };
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-5 left-5 z-[60] w-[min(520px,calc(100vw-2.5rem))]">
      <div className="pointer-events-auto space-y-2">
        <AnimatePresence initial={false}>
          {chips.map((c, idx) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, x: -10, y: 6 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: -10, y: 6 }}
              transition={{ duration: 0.18 }}
              className={[
                "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-sm backdrop-blur",
                "text-base font-semibold tracking-tight",
                accent[idx % accent.length],
              ].join(" ")}
            >
              <div className="min-w-0">
                <div className="text-[13px] font-medium opacity-80">
                  API call
                </div>
                <div className="truncate font-mono text-[15px]">{c.endpoint}</div>
              </div>
              <button
                type="button"
                onClick={() => setChips((prev) => prev.filter((x) => x.id !== c.id))}
                className="rounded-lg border border-black/10 bg-white/30 px-2 py-1 text-sm font-semibold text-black/70 hover:bg-white/50 dark:border-white/10 dark:bg-black/20 dark:text-white/70 dark:hover:bg-black/30"
              >
                Close
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

