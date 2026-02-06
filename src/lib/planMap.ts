import type { ProductKey } from "@/lib/catalog";

/**
 * Explicit mapping (highest priority). Add any plan/item_price_id here.
 * Example: "JIRA-Standard-USD-Monthly": "jira"
 */
export const planIdToProduct: Record<string, ProductKey> = {
  // Fill as you create Chargebee item prices
};

/**
 * Fallback mapping based on item_price_id prefixes/keywords.
 * This supports ids like: "JIRA-Standard-USD-Monthly"
 */
export function productFromItemPriceId(itemPriceId: string): ProductKey | null {
  const direct = planIdToProduct[itemPriceId];
  if (direct) return direct;

  const upper = itemPriceId.toUpperCase();
  if (upper.startsWith("JIRA")) return "jira";
  if (upper.startsWith("CONF") || upper.startsWith("CONFLUENCE"))
    return "confluence";
  if (upper.startsWith("LOOM")) return "loom";
  if (upper.includes("PACKAGE") || upper.includes("BUNDLE")) return "package";

  return null;
}

