export type ProductKey = "jira" | "confluence" | "loom" | "package";

export type RegionKey = "us" | "eu";

export const REGIONS: Record<
  RegionKey,
  {
    key: RegionKey;
    label: string;
    legalEntity: string;
    office: string;
    currencies: string[];
  }
> = {
  us: {
    key: "us",
    label: "US",
    legalEntity: "Atlassiancom",
    office: "San Francisco (SF)",
    currencies: ["USD"],
  },
  eu: {
    key: "eu",
    label: "EU",
    legalEntity: "Atlassian.EU",
    office: "Paris",
    currencies: ["EUR", "GBP"],
  },
};

export const PRODUCTS: Array<{
  key: ProductKey;
  label: string;
  tagline: string;
  pricingUrl: string;
}> = [
  {
    key: "jira",
    label: "Jira",
    tagline: "Product development lifecycle management",
    pricingUrl: "https://www.atlassian.com/software/jira/pricing",
  },
  {
    key: "confluence",
    label: "Confluence",
    tagline: "Document management",
    pricingUrl: "https://www.atlassian.com/software/confluence/pricing",
  },
  {
    key: "loom",
    label: "Loom",
    tagline: "Video management",
    pricingUrl: "https://www.atlassian.com/software/loom/pricing",
  },
  {
    key: "package",
    label: "Alloy",
    tagline: "All products bundle (priced at 150% of Jira pricing)",
    pricingUrl: "https://www.atlassian.com/software/jira/pricing",
  },
];

