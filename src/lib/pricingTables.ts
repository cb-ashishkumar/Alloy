import type { ProductKey, RegionKey } from "@/lib/catalog";

type Common = {
  /** Chargebee site slug used by chargebee.js (e.g. "hp-demo-test") */
  site: string;
  viewportDefaultHeight?: string;
  autoSelectLocalCurrency?: boolean;
};

export type PricingTableConfig =
  | (Common & {
      integration: "api";
      /** AtomicPricing/Retention siteId (same across products for you) */
      siteId: string;
      /** Growth Pricing Page ID (varies per product) */
      pricingPageId: string;
      /**
       * Optional host override for Growth pricing table runtime (from docs).
       * Example: "https://app.retention.chargebee.com"
       */
      pricingTableHost?: string;
    })
  | (Common & {
      integration: "static";
      /** Pricing table site id */
      pricingTableSiteId: string;
      /** Pricing table id */
      pricingTableId: string;
    });

export function getHostedPricingPageUrl(product: ProductKey, cfg: PricingTableConfig) {
  if (cfg.integration !== "api") return null;
  // Hosted Growth Pricing Pages (current format you shared)
  return `https://hosted.atomicpricing.com/sites/${cfg.siteId}/pricing/${cfg.pricingPageId}`;
}

const SITE_ID = "01KGMYNNDETQJPZPFPBBV1WATN";

const alloyPricingConfig: PricingTableConfig = {
  site: "hp-demo-test",
  integration: "api",
  siteId: SITE_ID,
  pricingPageId: "01KGMZ9F5F881GAS44AYP19WCB",
  viewportDefaultHeight: "992px",
};

/**
 * Map Chargebee pricing-table embeds per product/region.
 * For API integration (pricingTable.open), we use `siteId` + `pricingPageId`.
 */
export const PRICING_TABLES: Partial<
  Record<RegionKey, Partial<Record<ProductKey, PricingTableConfig>>>
> = {
  us: {
    jira: {
      site: "hp-demo-test",
      integration: "api",
      siteId: SITE_ID,
      pricingPageId: "01KGMZ5GR7A05EXMCD2F36TC0M",
      viewportDefaultHeight: "992px",
    },
    confluence: {
      site: "hp-demo-test",
      integration: "api",
      siteId: SITE_ID,
      pricingPageId: "01KGMZ7A1TYW2NJ7GGA0YRYJH0",
      viewportDefaultHeight: "992px",
    },
    loom: {
      site: "hp-demo-test",
      integration: "api",
      siteId: SITE_ID,
      pricingPageId: "01KGMYSKVQCEDDYHFNXETJSQP7",
      viewportDefaultHeight: "992px",
    },
    package: alloyPricingConfig,
  },
  eu: {
    jira: {
      site: "hp-demo-test",
      integration: "api",
      siteId: SITE_ID,
      pricingPageId: "01KGMZ5GR7A05EXMCD2F36TC0M",
      viewportDefaultHeight: "992px",
    },
    confluence: {
      site: "hp-demo-test",
      integration: "api",
      siteId: SITE_ID,
      pricingPageId: "01KGMZ7A1TYW2NJ7GGA0YRYJH0",
      viewportDefaultHeight: "992px",
    },
    loom: {
      site: "hp-demo-test",
      integration: "api",
      siteId: SITE_ID,
      pricingPageId: "01KGMYSKVQCEDDYHFNXETJSQP7",
      viewportDefaultHeight: "992px",
    },
    package: alloyPricingConfig,
  },
};

