"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

type ChargebeePricingTableInstance = {
  open: (options: {
    pricingTable: () => Promise<unknown>;
  }) => void;
  setVisitor: (data: Record<string, unknown>, options?: unknown) => void;
  init?: () => void;
};

type ChargebeeInstance = {
  pricingTable: () => Promise<ChargebeePricingTableInstance>;
};

type ChargebeeSDK = {
  init: (opts: { site: string; businessEntityId?: string }) => ChargebeeInstance;
};

type Props = {
  /** Chargebee site slug used by chargebee.js (e.g. "hp-demo-test") */
  site: string;
  integration: "api" | "static";
  // api integration
  pricingPageId?: string;
  pricingTableHost?: string;
  // static integration
  pricingTableSiteId?: string;
  pricingTableId?: string;
  viewportDefaultHeight?: string;
  autoSelectLocalCurrency?: boolean;
  productKey: "jira" | "confluence" | "loom" | "package";
  regionKey: "us" | "eu";
  subscriptionId?: string | null;
  visitor?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    customerId?: string;
    businessEntityId?: string;
  };
};

function getChargebeeGlobal(): ChargebeeSDK | null {
  const v = window.Chargebee;
  // Chargebee global may be a function with properties (typeof === "function")
  if ((typeof v !== "object" && typeof v !== "function") || v === null) return null;
  if (
    !("init" in (v as Record<string, unknown>)) ||
    typeof (v as Record<string, unknown>).init !== "function"
  ) {
    return null;
  }
  return v as ChargebeeSDK;
}

export function ChargebeePricingTable({
  site,
  integration,
  pricingPageId,
  pricingTableHost,
  viewportDefaultHeight = "633px",
  autoSelectLocalCurrency = true,
  pricingTableSiteId,
  pricingTableId,
  productKey,
  regionKey,
  subscriptionId,
  visitor,
}: Props) {
  const [scriptReady, setScriptReady] = useState(false);

  // Chargebee embed snippet uses this exact id; some versions rely on it.
  const containerId = useMemo(() => "chargebee-pricing-table", []);

  // If the script is already present (Next Script dedupes), mark ready on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.Chargebee) setScriptReady(true);
  }, []);

  // If script is injected elsewhere, it may become ready after mount.
  useEffect(() => {
    if (scriptReady) return;
    let tries = 0;
    const handle = window.setInterval(() => {
      tries += 1;
      if (window.Chargebee) {
        setScriptReady(true);
        window.clearInterval(handle);
      } else if (tries > 50) {
        window.clearInterval(handle);
      }
    }, 100);
    return () => window.clearInterval(handle);
  }, [scriptReady]);

  useEffect(() => {
    if (!scriptReady) return;

    let cancelled = false;
    async function init() {
      const Chargebee = getChargebeeGlobal();
      if (!Chargebee) return;

      try {
        // Ensure the container exists in DOM before init runs.
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        if (cancelled) return;
        const el = document.getElementById(containerId);
        if (!el) return;

        // Helpful debug markers in console
        console.log("[pricing] init", {
          productKey,
          regionKey,
          site,
          integration,
          pricingPageId,
          pricingTableId,
        });

        const chargebee = Chargebee.init({
          site,
          businessEntityId: visitor?.businessEntityId,
        });
        const pricingTable = await chargebee.pricingTable();
        if (cancelled) return;

        // Pass visitor/customer context (demo: include customer_id as custom field)
        if (visitor?.email || visitor?.customerId) {
          pricingTable.setVisitor({
            firstName: visitor?.firstName,
            lastName: visitor?.lastName,
            email: visitor?.email,
            customFields: visitor?.customerId
              ? { customer_id: visitor.customerId }
              : undefined,
          });
        }

        if (integration === "static") {
          if (!pricingTable.init) {
            throw new Error("Chargebee pricingTable.init() not available.");
          }
          pricingTable.init();
        } else {
          if (!pricingPageId) {
            throw new Error("Missing pricingPageId for API integration.");
          }
          // Session/API integration
          pricingTable.open({
            pricingTable: function () {
              console.log("[pricing] creating pricing_page_session", {
                pricingPageId,
                subscriptionId,
              });
              return apiFetch(
                "/api/chargebee/pricing-page-session",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({
                    pricingPageId,
                    businessEntityId: visitor?.businessEntityId ?? null,
                    subscriptionId: subscriptionId ?? null,
                  }),
                },
                { logEndpoint: "/api/chargebee/pricing-page-session" },
              )
                .then((r) => r.json())
                .then((json: unknown) => {
                  const session =
                    typeof json === "object" &&
                    json !== null &&
                    "pricing_page_session" in json
                      ? (json as { pricing_page_session?: unknown })
                          .pricing_page_session
                      : null;
                  if (!session) {
                    throw new Error(
                      `Missing pricing_page_session in response: ${JSON.stringify(
                        json,
                      )}`,
                    );
                  }
                  return session;
                });
            },
          });
        }
      } catch (e) {
        console.error("[chargebee-embed] init failed", e);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [
    scriptReady,
    site,
    integration,
    pricingPageId,
    pricingTableSiteId,
    pricingTableId,
    productKey,
    regionKey,
    subscriptionId,
    visitor,
    containerId,
  ]);

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950/40">
      <div
        id={containerId}
        data-pricing-table-integration-type={integration === "api" ? "api" : undefined}
        data-pricing-table-host={integration === "api" ? pricingTableHost : undefined}
        data-pricing-table-site={
          integration === "static" ? pricingTableSiteId : undefined
        }
        data-pricing-table-id={integration === "static" ? pricingTableId : undefined}
        data-pricing-table-viewport-default-height={viewportDefaultHeight}
        data-pricing-table-auto-select-local-currency={
          autoSelectLocalCurrency ? "true" : "false"
        }
      />
    </div>
  );
}

