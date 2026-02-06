import type { RegionKey } from "@/lib/catalog";

/**
 * Chargebee Business Entity IDs (source of truth).
 * UI shows RegionKey (us/eu) as "US"/"EU", but API calls must use these IDs.
 */
export const BUSINESS_ENTITY_ID_BY_REGION: Record<RegionKey, string> = {
  us: "AzyeBNVANOcnj1ND2",
  eu: "EU",
};

export function regionFromBusinessEntityId(id: string | null | undefined): RegionKey | null {
  if (!id) return null;
  if (id === BUSINESS_ENTITY_ID_BY_REGION.us) return "us";
  if (id === BUSINESS_ENTITY_ID_BY_REGION.eu) return "eu";
  // Backward-compat if older customers used plain "US"
  if (id.toUpperCase?.() === "US") return "us";
  if (id.toUpperCase?.() === "EU") return "eu";
  return null;
}

