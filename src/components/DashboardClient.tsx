"use client";

import { PRODUCTS, REGIONS, type ProductKey, type RegionKey } from "@/lib/catalog";
import { productFromItemPriceId } from "@/lib/planMap";
import { ChargebeePricingTable } from "@/components/ChargebeePricingTable";
import { PRICING_TABLES } from "@/lib/pricingTables";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { regionFromBusinessEntityId } from "@/lib/businessEntities";
import { AlloyLogo, ConfluenceLogo, JiraLogo, LoomLogo } from "@/components/ProductLogos";
import { PortalEmbed } from "@/components/PortalEmbed";

type ChargebeePortalSession = {
  id?: string;
  token?: string;
  access_url?: string;
  customer_id?: string;
  object?: string;
  expires_at?: number;
};

type ChargebeePortalSections = {
  SUBSCRIPTION_DETAILS: string;
  ACCOUNT_DETAILS?: string;
  ADDRESS?: string;
  PAYMENT_SOURCES?: string;
  BILLING_HISTORY?: string;
};

type ChargebeePortal = {
  openSection: (
    options: {
      sectionType: string;
      params?: { subscriptionId?: string };
    },
    callbacks?: {
      loaded?: () => void;
      closed?: () => void;
      subscriptionCancelled?: (data: unknown) => void;
    },
  ) => void;
};

type ChargebeeInstance = {
  setPortalSession: (
    fn: () => Promise<ChargebeePortalSession> | ChargebeePortalSession,
  ) => void;
  createChargebeePortal: () => ChargebeePortal;
};

type ChargebeeSDK = {
  init: (opts: { site: string }) => ChargebeeInstance;
  getPortalSections: () => ChargebeePortalSections;
};

function isObjectLike(v: unknown): v is Record<string, unknown> {
  return (typeof v === "object" || typeof v === "function") && v !== null;
}

function isChargebeeSDK(v: unknown): v is ChargebeeSDK {
  return (
    isObjectLike(v) &&
    typeof v["init"] === "function" &&
    typeof v["getPortalSections"] === "function"
  );
}

type ChargebeeSubscriptionItem = {
  item_price_id?: string;
  quantity?: number;
  amount?: number;
};

type ChargebeeSubscription = {
  id?: string;
  currency_code?: string;
  current_term_start?: number;
  current_term_end?: number;
  cancelled_at?: number;
  cancel_schedule_created_at?: number;
  status?: string;
  subscription_items?: ChargebeeSubscriptionItem[];
};

type ChargebeeSubscriptionListEntry = {
  subscription?: ChargebeeSubscription;
};

type ChargebeeEntitlement = {
  subscription_entitlement?: {
    feature_id?: string;
    feature_name?: string;
    feature_unit?: string;
    feature_description?: string;
    feature_type?: string;
    value?: string;
    name?: string;
    is_overridden?: boolean;
    is_enabled?: boolean;
  };
};

type BootstrapResponse = {
  customer_id: string;
  business_entity_id?: string | null;
  customer: { created: boolean; customer: unknown };
  subscriptions: ChargebeeSubscriptionListEntry[];
};

type CancelledModal = {
  open: boolean;
  subscriptionId?: string;
  planId?: string;
  quantity?: number;
  amount?: number;
  currency?: string;
};

function formatMoney(cents: number, currency: string) {
  const value = cents / 100;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function ordinal(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n}st`;
  if (mod10 === 2 && mod100 !== 12) return `${n}nd`;
  if (mod10 === 3 && mod100 !== 13) return `${n}rd`;
  return `${n}th`;
}

function formatOrdinalDate(tsSeconds: number) {
  const d = new Date(tsSeconds * 1000);
  const day = ordinal(d.getDate());
  const month = d.toLocaleString("en-US", { month: "long" });
  const year = d.getFullYear();
  return `${day} ${month}, ${year}`;
}

function formatOrdinalDateTime(tsSeconds: number) {
  const d = new Date(tsSeconds * 1000);
  const date = formatOrdinalDate(tsSeconds);
  const time = d.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${date} • ${time}`;
}

function getSubscriptionSummary(sub: ChargebeeSubscriptionListEntry) {
  const s = sub.subscription ?? {};
  const items = s.subscription_items ?? [];
  const item0 = items[0] ?? {};
  return {
    id: String(s.id ?? ""),
    currency: String(s.currency_code ?? ""),
    termStart: Number(s.current_term_start ?? 0),
    termEnd: Number(s.current_term_end ?? 0),
    cancelledAt: Number(s.cancelled_at ?? 0),
    cancelScheduleCreatedAt: Number(s.cancel_schedule_created_at ?? 0),
    status: String(s.status ?? ""),
    planId: String(item0.item_price_id ?? ""),
    quantity: Number(item0.quantity ?? 0),
    amount: Number(item0.amount ?? 0),
  };
}

function Chip({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition",
        disabled ? "cursor-not-allowed opacity-60 blur-[0.3px]" : "",
        active
          ? "border-zinc-900 bg-zinc-900 text-white shadow-sm dark:border-white dark:bg-white dark:text-zinc-900"
          : "border-zinc-200 bg-white/70 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200 dark:hover:bg-zinc-900",
      ].join(" ")}
      type="button"
    >
      {children}
    </button>
  );
}

function ProductMark({ product }: { product: ProductKey }) {
  const wrap = "grid h-7 w-7 place-items-center rounded-xl";
  const icon = "h-5 w-5";
  switch (product) {
    case "jira":
      return (
        <div className={`${wrap} bg-blue-600/15 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200`}>
          <JiraLogo className={icon} />
        </div>
      );
    case "confluence":
      return (
        <div className={`${wrap} bg-purple-600/15 text-purple-700 dark:bg-purple-500/15 dark:text-purple-200`}>
          <ConfluenceLogo className={icon} />
        </div>
      );
    case "loom":
      return (
        <div className={`${wrap} bg-amber-500/20 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200`}>
          <LoomLogo className={icon} />
        </div>
      );
    case "package":
      return (
        <div className={`${wrap} bg-zinc-900/5 text-zinc-900 dark:bg-white/10 dark:text-white`}>
          <AlloyLogo className={icon} />
        </div>
      );
  }
}

export function DashboardClient() {
  const { data: session } = useSession();
  const [region, setRegion] = useState<RegionKey>("us");
  const [tab, setTab] = useState<ProductKey | "overview">("overview");
  const [portalOpening, setPortalOpening] = useState<string | null>(null);
  const [pricingRedirectLoading, setPricingRedirectLoading] = useState(false);
  const [cancelledModal, setCancelledModal] = useState<CancelledModal>({
    open: false,
  });

  const [loading, setLoading] = useState(true);
  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorRequestId, setErrorRequestId] = useState<string | null>(null);

  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [entitlements, setEntitlements] = useState<unknown[] | null>(null);
  const [entitlementsLoading, setEntitlementsLoading] = useState(false);
  const [consumptionByFeatureId, setConsumptionByFeatureId] = useState<
    Record<string, number>
  >({});
  const [consumptionLoading, setConsumptionLoading] = useState(false);

  async function refreshBootstrap() {
    setLoading(true);
    setError(null);
    setErrorRequestId(null);
    try {
      const res = await fetch("/api/chargebee/bootstrap", { cache: "no-store" });
      const json: unknown = await res.json();
      if (!res.ok) {
        const msg =
          typeof json === "object" && json !== null && "message" in json
            ? String((json as { message?: unknown }).message ?? "Failed to load")
            : "Failed to load";
        const rid =
          typeof json === "object" && json !== null && "requestId" in json
            ? String((json as { requestId?: unknown }).requestId ?? "")
            : "";
        if (rid) setErrorRequestId(rid);
        throw new Error(msg);
      }
      setBootstrap(json as BootstrapResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      setErrorRequestId(null);
      try {
      const res = await apiFetch(
        "/api/chargebee/bootstrap",
        { cache: "no-store" },
        { logEndpoint: "/api/chargebee/bootstrap" },
      );
        const json: unknown = await res.json();
        if (!res.ok) {
          if (
            res.status === 404 &&
            typeof json === "object" &&
            json !== null &&
            "error" in json &&
            (json as { error?: unknown }).error === "customer_not_found"
          ) {
            window.location.href = "/onboarding";
            return;
          }
          const msg =
            typeof json === "object" && json !== null && "message" in json
              ? String((json as { message?: unknown }).message ?? "Failed to load")
              : "Failed to load";
          const rid =
            typeof json === "object" && json !== null && "requestId" in json
              ? String((json as { requestId?: unknown }).requestId ?? "")
              : "";
          if (rid) setErrorRequestId(rid);
          throw new Error(msg);
        }
        if (!cancelled) setBootstrap(json as BootstrapResponse);
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
  }, []);

  useEffect(() => {
    const r = regionFromBusinessEntityId(bootstrap?.business_entity_id);
    if (r) setRegion(r);
  }, [bootstrap?.business_entity_id]);

  const lockedRegion: RegionKey | null = useMemo(() => {
    return regionFromBusinessEntityId(bootstrap?.business_entity_id);
  }, [bootstrap?.business_entity_id]);

  const subscriptionSummaries = useMemo(() => {
    const subs = bootstrap?.subscriptions ?? [];
    return subs.map(getSubscriptionSummary).filter((s) => s.id);
  }, [bootstrap]);

  const subscribedProducts = useMemo(() => {
    const set = new Set<ProductKey>();
    for (const s of subscriptionSummaries) {
      if (s.status === "cancelled") continue;
      const p = productFromItemPriceId(s.planId);
      if (p) set.add(p);
    }
    return set;
  }, [subscriptionSummaries]);

  const hasActiveIndividualSubscription = useMemo(() => {
    for (const s of subscriptionSummaries) {
      if (s.status !== "active") continue;
      const p = productFromItemPriceId(s.planId);
      if (p === "jira" || p === "confluence" || p === "loom") return true;
    }
    return false;
  }, [subscriptionSummaries]);

  const subscriptionIdByProduct = useMemo(() => {
    const out: Partial<Record<ProductKey, { id: string; rank: number }>> = {};
    for (const s of subscriptionSummaries) {
      const p = productFromItemPriceId(s.planId);
      if (!p || !s.id) continue;
      const rank =
        s.status === "active"
          ? 3
          : s.status === "non_renewing"
            ? 2
            : s.status === "cancelled"
              ? 0
              : 1;
      const current = out[p];
      if (!current || rank > current.rank) out[p] = { id: s.id, rank };
    }
    return out;
  }, [subscriptionSummaries]);

  const chargebeeSite =
    process.env.NEXT_PUBLIC_CHARGEBEE_JS_SITE ?? "hp-demo-test";

  const [chargebeeReady, setChargebeeReady] = useState(false);
  useEffect(() => {
    let tries = 0;
    const handle = window.setInterval(() => {
      tries += 1;
      if (isChargebeeSDK(window.Chargebee)) {
        setChargebeeReady(true);
        window.clearInterval(handle);
      } else if (tries > 50) {
        window.clearInterval(handle);
      }
    }, 100);
    return () => window.clearInterval(handle);
  }, []);

  async function redirectToPricingPage(
    pricingPageId: string,
    subscriptionId?: string | null,
  ) {
    setPricingRedirectLoading(true);
    setError(null);
    setErrorRequestId(null);
    try {
      const res = await apiFetch(
        "/api/chargebee/pricing-page-session",
        {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          pricingPageId,
          businessEntityId: bootstrap?.business_entity_id ?? null,
          subscriptionId: subscriptionId ?? null,
        }),
        },
        { logEndpoint: "/api/chargebee/pricing-page-session" },
      );
      // (log the call)
      const json: unknown = await res.json();
      if (!res.ok) {
        const msg =
          typeof json === "object" && json !== null && "message" in json
            ? String((json as { message?: unknown }).message ?? "Failed")
            : "Failed";
        const rid =
          typeof json === "object" && json !== null && "requestId" in json
            ? String((json as { requestId?: unknown }).requestId ?? "")
            : "";
        if (rid) setErrorRequestId(rid);
        throw new Error(msg);
      }

      const pps =
        typeof json === "object" && json !== null && "pricing_page_session" in json
          ? (json as { pricing_page_session?: { url?: string } })
              .pricing_page_session
          : null;
      const url = pps?.url;
      if (!url) throw new Error("Missing pricing_page_session.url");

      // helpful presentation/debug log
      console.log("[pricing redirect]", {
        customer_id:
          typeof json === "object" && json !== null && "customer_id" in json
            ? (json as { customer_id?: unknown }).customer_id
            : undefined,
        mode:
          typeof json === "object" && json !== null && "mode" in json
            ? (json as { mode?: unknown }).mode
            : undefined,
      });

      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPricingRedirectLoading(false);
    }
  }

  async function openCancelPortal(subscriptionId: string) {
    setPortalOpening(subscriptionId);
    setError(null);
    setErrorRequestId(null);
    try {
      if (
        !chargebeeReady ||
        typeof window === "undefined" ||
        !window.Chargebee
      ) {
        throw new Error("Chargebee.js not ready yet. Please try again in a moment.");
      }

      const ChargebeeUnknown = window.Chargebee;
      if (!isChargebeeSDK(ChargebeeUnknown)) {
        throw new Error("Chargebee.js loaded but SDK shape is unexpected.");
      }
      const Chargebee = ChargebeeUnknown;
      // Ensure instance exists (your script tag with data-cb-site should also create it).
      const chargebee =
        (window.__alloyChargebee as ChargebeeInstance | undefined) ??
        ((window.__alloyChargebee = Chargebee.init({
          site: chargebeeSite,
        })) as ChargebeeInstance);

      // Provide portal session to the SDK
      chargebee.setPortalSession(() => {
        return apiFetch(
          "/api/chargebee/portal-session",
          {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          },
          { logEndpoint: "/api/chargebee/portal-session" },
        )
          .then((r) => r.json())
          .then((json: unknown) => {
            const ps =
              typeof json === "object" &&
              json !== null &&
              "portal_session" in json
                ? (json as { portal_session?: ChargebeePortalSession })
                    .portal_session
                : undefined;
            if (!ps) throw new Error("Failed to create portal session");
            return ps;
          });
      });

      const portal = chargebee.createChargebeePortal();

      portal.openSection(
        {
          sectionType: Chargebee.getPortalSections().SUBSCRIPTION_DETAILS,
          params: { subscriptionId },
        },
        {
          subscriptionCancelled: (data: unknown) => {
            const cancelledId =
              (data as { subscription?: { id?: string } } | null)?.subscription
                ?.id ?? subscriptionId;
            const summary = subscriptionSummaries.find((s) => s.id === cancelledId);
            setCancelledModal({
              open: true,
              subscriptionId: cancelledId,
              planId: summary?.planId,
              quantity: summary?.quantity,
              amount: summary?.amount,
              currency: summary?.currency,
            });
          },
        },
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPortalOpening(null);
    }
  }

  async function loadEntitlements(subscriptionId: string) {
    setSelectedSubId(subscriptionId);
    setEntitlements(null);
    setEntitlementsLoading(true);
    try {
      const summary = subscriptionSummaries.find((s) => s.id === subscriptionId);
      if (summary?.status === "cancelled") {
        setEntitlementsLoading(false);
        setEntitlements(null);
        setConsumptionByFeatureId({});
        return;
      }

      const res = await apiFetch(
        `/api/chargebee/subscriptions/${encodeURIComponent(
          subscriptionId,
        )}/entitlements`,
        { cache: "no-store" },
        { logEndpoint: "/api/chargebee/subscriptions/:id/entitlements" },
      );
      const json: unknown = await res.json();
      if (!res.ok) {
        const msg =
          typeof json === "object" && json !== null && "message" in json
            ? String(
                (json as { message?: unknown }).message ??
                  "Failed to load entitlements",
              )
            : "Failed to load entitlements";
        const rid =
          typeof json === "object" && json !== null && "requestId" in json
            ? String((json as { requestId?: unknown }).requestId ?? "")
            : "";
        if (rid) setErrorRequestId(rid);
        throw new Error(msg);
      }
      const ents =
        typeof json === "object" && json !== null && "entitlements" in json
          ? (json as { entitlements?: unknown }).entitlements
          : [];
      setEntitlements((ents as unknown[]) ?? []);
      setConsumptionByFeatureId({});
    } catch (e) {
      setEntitlements([]);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setEntitlementsLoading(false);
    }
  }

  useEffect(() => {
    async function loadConsumption() {
      if (!selectedSubId) return;
      if (!entitlements || entitlements.length === 0) return;

      const featureIds: string[] = [];
      for (const e of entitlements) {
        const ent = (e as ChargebeeEntitlement | null)?.subscription_entitlement ?? null;
        if (!ent) continue;
        if (ent.feature_type !== "QUANTITY") continue;
        if (!ent.feature_id) continue;
        featureIds.push(ent.feature_id);
      }
      if (featureIds.length === 0) return;

      setConsumptionLoading(true);
      try {
        const res = await apiFetch(
          "/api/consumption/bulk",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ subscriptionId: selectedSubId, featureIds }),
          },
          { logEndpoint: "/api/consumption/bulk" },
        );
        const json: unknown = await res.json();
        if (!res.ok) return;

        const items =
          typeof json === "object" && json !== null && "items" in json
            ? (json as { items?: unknown }).items
            : [];
        if (Array.isArray(items)) {
          const next: Record<string, number> = {};
          for (const it of items) {
            const fid = (it as { featureId?: unknown }).featureId;
            const consumed = (it as { consumed?: unknown }).consumed;
            if (typeof fid === "string") next[fid] = Number(consumed ?? 0);
          }
          setConsumptionByFeatureId(next);
        }
      } finally {
        setConsumptionLoading(false);
      }
    }
    void loadConsumption();
  }, [selectedSubId, entitlements]);

  async function incrementFeature(subscriptionId: string, featureId: string, delta = 1) {
    const res = await apiFetch(
      "/api/consumption/increment",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ subscriptionId, featureId, delta }),
      },
      { logEndpoint: "/api/consumption/increment" },
    );
    const json: unknown = await res.json();
    if (!res.ok) return;
    const item =
      typeof json === "object" && json !== null && "item" in json
        ? (json as { item?: { featureId?: string; consumed?: number } }).item
        : null;
    if (item?.featureId) {
      setConsumptionByFeatureId((prev) => ({
        ...prev,
        [item.featureId as string]: Number(item.consumed ?? 0),
      }));
    }
  }

  return (
    <div className="mx-auto max-w-screen-xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
            Alloy (All in one) • Merchant POV
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Merchant dashboard
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            <span className="text-zinc-500 dark:text-zinc-400">customer_id</span>
            <code className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1 font-mono text-sm font-semibold text-zinc-800 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-100">
              {session?.customer_id ?? "-"}
            </code>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-1 text-xs text-zinc-500 dark:text-zinc-400">
            Region
          </div>
          {(Object.keys(REGIONS) as RegionKey[]).map((k) => (
            <Chip
              key={k}
              active={(lockedRegion ?? region) === k}
              disabled={lockedRegion !== null && lockedRegion !== k}
              onClick={() => {
                setRegion(k);
              }}
            >
              {REGIONS[k].label}
            </Chip>
          ))}
          <Link
            href="/api/auth/signout"
            className="ml-auto rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Sign out
          </Link>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Chip active={tab === "overview"} onClick={() => setTab("overview")}>
          <span className="text-[13px] uppercase tracking-wide opacity-80">
            Overview
          </span>
        </Chip>
        {PRODUCTS.map((p) => (
          <Chip
            key={p.key}
            active={tab === p.key}
            disabled={p.key === "package" && hasActiveIndividualSubscription}
            onClick={() => setTab(p.key)}
          >
            <ProductMark product={p.key} />
            <span className="text-[15px]">{p.label}</span>
            {subscribedProducts.has(p.key) ? (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                Subscribed
              </span>
            ) : null}
          </Chip>
        ))}
      </div>

      <div className="mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="grid gap-4"
          >
            {tab === "overview" ? (
              <>
                <div className="rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50/60 via-white/60 to-emerald-50/40 p-6 shadow-sm backdrop-blur dark:border-indigo-900/30 dark:from-indigo-950/30 dark:via-zinc-950/40 dark:to-emerald-950/20">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold">Subscriptions</div>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                        Loaded from Chargebee on login (auto-creates customer if
                        missing).
                      </p>
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {loading ? "Loading…" : `${subscriptionSummaries.length} found`}
                    </div>
                  </div>

                  {error ? (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
                      <div className="font-medium">Request failed</div>
                      <div className="mt-1">{error}</div>
                      {errorRequestId ? (
                        <div className="mt-2 text-xs opacity-80">
                          requestId:{" "}
                          <code className="rounded bg-black/5 px-1 py-0.5 dark:bg-white/10">
                            {errorRequestId}
                          </code>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-4 grid gap-2">
                    {loading ? (
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        Fetching Chargebee data…
                      </div>
                    ) : subscriptionSummaries.length === 0 ? (
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        No subscriptions yet. (You can add one via the pricing tabs.)
                      </div>
                    ) : (
                      subscriptionSummaries.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => loadEntitlements(s.id)}
                          className={[
                            "w-full rounded-xl border px-4 py-3 text-left transition",
                            selectedSubId === s.id
                              ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                              : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:bg-zinc-900",
                          ].join(" ")}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-sm font-semibold">
                              {s.planId || "Subscription"}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-xs opacity-80">{s.id}</div>
                                {s.status === "cancelled" ? (
                                  <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200">
                                    Cancelled
                                  </div>
                                ) : s.cancelScheduleCreatedAt ? (
                                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                                    Cancels on{" "}
                                    {formatOrdinalDateTime(
                                      s.cancelledAt ||
                                        s.termEnd ||
                                        s.cancelScheduleCreatedAt,
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(ev) => {
                                      ev.stopPropagation();
                                      void openCancelPortal(s.id);
                                    }}
                                    disabled={portalOpening === s.id}
                                    className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-zinc-800 transition hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:bg-zinc-900"
                                  >
                                    {portalOpening === s.id
                                      ? "Opening…"
                                      : "Manage subscription"}
                                  </button>
                                )}
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-85">
                            <div>
                              Qty <span className="font-semibold">{s.quantity}</span>
                            </div>
                            <div>
                              Amount{" "}
                              <span className="font-semibold">
                                {formatMoney(s.amount, s.currency || "USD")}
                              </span>
                            </div>
                            {s.termStart ? (
                              <div>
                                Term{" "}
                                <span className="font-semibold">
                                  {formatOrdinalDateTime(s.termStart)} →{" "}
                                  {formatOrdinalDateTime(s.termEnd)}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/50 via-white/60 to-amber-50/30 p-6 shadow-sm backdrop-blur dark:border-emerald-900/30 dark:from-emerald-950/20 dark:via-zinc-950/40 dark:to-amber-950/10">
                  <div className="text-base font-semibold">Entitlements</div>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                    Select a subscription to view the features included in the plan.
                  </p>

                  <div className="mt-4">
                    {entitlementsLoading ? (
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        Loading entitlements…
                      </div>
                    ) : !selectedSubId ? (
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        No subscription selected.
                      </div>
                    ) : subscriptionSummaries.find((s) => s.id === selectedSubId)
                        ?.status === "cancelled" ? (
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200">
                        Entitlements are not available for{" "}
                        <span className="font-semibold">cancelled</span>{" "}
                        subscriptions.
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        {(entitlements ?? []).length === 0 ? (
                          <div className="text-sm text-zinc-500 dark:text-zinc-400">
                            No entitlements returned for this subscription.
                          </div>
                        ) : (
                          (entitlements ?? []).map((e, idx) => {
                            const ent =
                              (e as ChargebeeEntitlement | null)
                                ?.subscription_entitlement ?? null;
                            const featureId = ent?.feature_id ?? "";
                            const isQuantity = ent?.feature_type === "QUANTITY";
                            const limit = isQuantity ? Number(ent?.value ?? 0) : 0;
                            const consumed = featureId
                              ? Number(consumptionByFeatureId[featureId] ?? 0)
                              : 0;
                            const pct =
                              isQuantity && limit > 0
                                ? Math.min(100, Math.round((consumed / limit) * 100))
                                : 0;
                            return (
                              <div
                                key={`${ent?.feature_id ?? "ent"}-${idx}`}
                                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-950/40"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="font-semibold">
                                    {ent?.feature_name ?? ent?.feature_id ?? "Feature"}
                                  </div>
                                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {ent?.is_enabled ? "Enabled" : "Disabled"}
                                  </div>
                                </div>
                                <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                                  {ent?.name ?? ent?.value ?? "-"}
                                </div>
                                {ent?.feature_description ? (
                                  <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                    {ent.feature_description}
                                  </div>
                                ) : null}

                                {selectedSubId && isQuantity && limit > 0 ? (
                                  <div className="mt-3">
                                    <div className="flex items-center justify-between gap-3 text-xs text-zinc-600 dark:text-zinc-300">
                                      <div className="font-medium">
                                        Consumption{" "}
                                        {consumptionLoading ? "(loading…)" : ""}
                                      </div>
                                      <div className="font-mono">
                                        {consumed} / {limit}
                                      </div>
                                    </div>
                                    <div className="mt-2 flex items-center gap-3">
                                      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                                        <div
                                          className="h-full rounded-full bg-emerald-500 transition-[width]"
                                          style={{ width: `${pct}%` }}
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          void incrementFeature(
                                            selectedSubId,
                                            featureId,
                                            10,
                                          )
                                        }
                                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-900 hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200 dark:hover:bg-emerald-950/50"
                                      >
                                        +10
                                      </button>
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-zinc-200 bg-white/60 p-6 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/40">
                {(() => {
                  const p = PRODUCTS.find((x) => x.key === tab);
                  if (!p) return null;
                  const tableCfg = PRICING_TABLES[region]?.[p.key];
                  const alloyDisabled =
                    p.key === "package" && hasActiveIndividualSubscription;
                  const preferredStatuses = [
                    "active",
                    "non_renewing",
                    "in_trial",
                    "future",
                    "paused",
                    "cancelled",
                    "expired",
                  ];

                  const managedSubForProduct =
                    preferredStatuses
                      .map((st) =>
                        subscriptionSummaries.find(
                          (s) =>
                            s.status === st &&
                            productFromItemPriceId(s.planId) === p.key &&
                            s.id,
                        ),
                      )
                      .find(Boolean) ??
                    subscriptionSummaries.find(
                      (s) => productFromItemPriceId(s.planId) === p.key && s.id,
                    ) ??
                    null;

                  const managedSubIdForProduct = managedSubForProduct?.id ?? null;
                  return (
                    <>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium">{p.label} pricing</div>
                          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                            {p.tagline} • Region:{" "}
                            <span className="font-medium">
                              {REGIONS[region].label}
                            </span>{" "}
                            ({REGIONS[region].currencies.join(", ")})
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {tableCfg && !managedSubIdForProduct ? (
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                if (alloyDisabled) return;
                                if (tableCfg.integration === "api") {
                                  void redirectToPricingPage(
                                    tableCfg.pricingPageId,
                                    subscriptionIdByProduct[p.key]?.id ?? null,
                                  );
                                }
                              }}
                              aria-disabled={pricingRedirectLoading}
                              className={[
                                "rounded-xl px-3 py-2 text-sm font-medium transition",
                                alloyDisabled
                                  ? "cursor-not-allowed border border-zinc-200 bg-zinc-100 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400"
                                  : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100",
                              ].join(" ")}
                            >
                              {alloyDisabled
                                ? "Alloy disabled (active product plan)"
                                : pricingRedirectLoading
                                ? "Creating session…"
                                : "Go to pricing page ↗"}
                            </a>
                          ) : null}
                          <a
                            href={p.pricingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
                          >
                            Atlassian pricing ↗
                          </a>
                        </div>
                      </div>

                      <div className="mt-4">
                        {alloyDisabled && !managedSubIdForProduct ? (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                            Alloy is disabled because you already have an{" "}
                            <span className="font-semibold">active</span>{" "}
                            subscription to Jira/Confluence/Loom.
                          </div>
                        ) : null}
                        {managedSubIdForProduct ? (
                          <PortalEmbed subscriptionId={managedSubIdForProduct} />
                        ) : tableCfg ? (
                          <ChargebeePricingTable
                            site={tableCfg.site}
                            integration={tableCfg.integration}
                            pricingPageId={
                              tableCfg.integration === "api"
                                ? tableCfg.pricingPageId
                                : undefined
                            }
                            pricingTableHost={
                              tableCfg.integration === "api"
                                ? tableCfg.pricingTableHost
                                : undefined
                            }
                            pricingTableSiteId={
                              tableCfg.integration === "static"
                                ? tableCfg.pricingTableSiteId
                                : undefined
                            }
                            pricingTableId={
                              tableCfg.integration === "static"
                                ? tableCfg.pricingTableId
                                : undefined
                            }
                            viewportDefaultHeight={tableCfg.viewportDefaultHeight}
                            autoSelectLocalCurrency={tableCfg.autoSelectLocalCurrency}
                            productKey={p.key}
                            regionKey={region}
                            subscriptionId={subscriptionIdByProduct[p.key]?.id ?? null}
                            visitor={{
                              email: session?.user?.email ?? undefined,
                              firstName: session?.user?.name?.split(" ")?.[0],
                              lastName: session?.user?.name
                                ?.split(" ")
                                ?.slice(1)
                                .join(" "),
                              customerId: session?.customer_id ?? undefined,
                              businessEntityId:
                                bootstrap?.business_entity_id ?? undefined,
                            }}
                          />
                        ) : (
                          <div className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                            <div className="font-medium text-zinc-800 dark:text-zinc-100">
                              Missing pricing table config
                            </div>
                            <p className="mt-1">
                              Add the Chargebee pricing-table ids for{" "}
                              <span className="font-medium">{p.label}</span> in{" "}
                              <code className="rounded bg-black/5 px-1 py-0.5 dark:bg-white/10">
                                src/lib/pricingTables.ts
                              </code>
                              .
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {cancelledModal.open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
            onClick={() => {
              setCancelledModal({ open: false });
              void refreshBootstrap();
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-sm text-zinc-600 dark:text-zinc-300">
                Subscription cancelled
              </div>
              <div className="mt-2 text-base font-semibold">
                {cancelledModal.planId ?? "Subscription"}
              </div>
              <div className="mt-3 grid gap-1 text-sm text-zinc-700 dark:text-zinc-200">
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400">id:</span>{" "}
                  <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-900">
                    {cancelledModal.subscriptionId}
                  </code>
                </div>
                {typeof cancelledModal.quantity === "number" ? (
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      quantity:
                    </span>{" "}
                    {cancelledModal.quantity}
                  </div>
                ) : null}
                {typeof cancelledModal.amount === "number" ? (
                  <div>
                    <span className="text-zinc-500 dark:text-zinc-400">amount:</span>{" "}
                    {formatMoney(
                      cancelledModal.amount,
                      cancelledModal.currency || "USD",
                    )}
                  </div>
                ) : null}
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCancelledModal({ open: false });
                    void refreshBootstrap();
                  }}
                  className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

