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
  // URL patterns you shared (AtomicPricing / Growth Pricing Pages)
  return product === "loom"
    ? `https://hosted.atomicpricing.com/sites/${cfg.siteId}/pricing/${cfg.pricingPageId}`
    : `https://app.atomicpricing.com/sites/${cfg.siteId}/pricing-pages/${cfg.pricingPageId}`;
}

const ALLOY_PRICING_PAGE_ID = process.env.NEXT_PUBLIC_ALLOY_PRICING_PAGE_ID;

const alloyPricingConfig: PricingTableConfig = ALLOY_PRICING_PAGE_ID
  ? {
      site: "hp-demo-test",
      integration: "api",
      siteId: "01KGN2S3P3H3XH57CNWYWWWWDN",
      pricingPageId: ALLOY_PRICING_PAGE_ID,
      viewportDefaultHeight: "992px",
    }
  : {
      site: "hp-demo-test",
      integration: "static",
      pricingTableSiteId: "01KGN2S3P3H3XH57CNWYWWWWDN",
      pricingTableId: "01KGQM2V5N3V0CHDAR1099CN8F",
      viewportDefaultHeight: "633px",
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
      siteId: "01KGN2S3P3H3XH57CNWYWWWWDN",
      pricingPageId: "01KGQBZPB2TF3ZNSAHMY87XBZY",
      viewportDefaultHeight: "992px",
    },
    confluence: {
      site: "hp-demo-test",
      integration: "api",
      siteId: "01KGN2S3P3H3XH57CNWYWWWWDN",
      pricingPageId: "01KGQBXNQDPSFD5TG50Q8RKNDT",
      viewportDefaultHeight: "992px",
    },
    loom: {
      site: "hp-demo-test",
      integration: "api",
      siteId: "01KGN2S3P3H3XH57CNWYWWWWDN",
      pricingPageId: "01KGQBRMCFFNZZB2CKH0PZJ9DB",
      viewportDefaultHeight: "992px",
    },
    package: alloyPricingConfig,
  },
  eu: {
    jira: {
      site: "hp-demo-test",
      integration: "api",
      siteId: "01KGN2S3P3H3XH57CNWYWWWWDN",
      pricingPageId: "01KGQBZPB2TF3ZNSAHMY87XBZY",
      viewportDefaultHeight: "992px",
    },
    confluence: {
      site: "hp-demo-test",
      integration: "api",
      siteId: "01KGN2S3P3H3XH57CNWYWWWWDN",
      pricingPageId: "01KGQBXNQDPSFD5TG50Q8RKNDT",
      viewportDefaultHeight: "992px",
    },
    loom: {
      site: "hp-demo-test",
      integration: "api",
      siteId: "01KGN2S3P3H3XH57CNWYWWWWDN",
      pricingPageId: "01KGQBRMCFFNZZB2CKH0PZJ9DB",
      viewportDefaultHeight: "992px",
    },
    package: alloyPricingConfig,
  },
};

