type ChargebeeSiteConfig = {
  site: string; // e.g. "sudheer-test.chargebee.com"
  apiKey: string; // Chargebee API key (username); password is blank
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function debugEnabled() {
  return process.env.CHARGEBEE_DEBUG === "true";
}

function mustGetEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

function getChargebeeConfig(): ChargebeeSiteConfig {
  const site = process.env.CHARGEBEE_SITE ?? mustGetEnv("CHARGEBEE_SITE");
  const apiKey = process.env.CHARGEBEE_API_KEY ?? mustGetEnv("CHARGEBEE_API_KEY");
  return { site, apiKey };
}

function basicAuthHeader(apiKey: string) {
  // Chargebee uses HTTP Basic Auth with API key as username and blank password.
  const token = Buffer.from(`${apiKey}:`, "utf8").toString("base64");
  return `Basic ${token}`;
}

function safeJsonPreview(v: unknown, max = 2000) {
  try {
    const s = JSON.stringify(v);
    return s.length > max ? `${s.slice(0, max)}…(truncated)` : s;
  } catch {
    return String(v);
  }
}

async function chargebeeFetch(
  config: ChargebeeSiteConfig,
  path: string,
  init?: RequestInit,
): Promise<
  | { ok: true; data: unknown }
  | { ok: false; status: number; data: unknown }
> {
  const url = `https://${config.site}${path}`;
  const method = init?.method ?? "GET";

  if (debugEnabled()) {
    console.log(`[chargebee] → ${method} ${url}`);
  }

  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: basicAuthHeader(config.apiKey),
      ...(init?.headers ?? {}),
    },
    // avoid Next.js caching for dynamic merchant data
    cache: "no-store",
  });

  const text = await res.text();
  const data: unknown = text ? JSON.parse(text) : null;

  if (debugEnabled()) {
    console.log(
      `[chargebee] ← ${res.status} ${method} ${url} body=${safeJsonPreview(
        data,
      )}`,
    );
  }

  if (!res.ok) return { ok: false, status: res.status, data };
  return { ok: true, data };
}

export async function ensureCustomerExists(customerId: string) {
  const cfg = getChargebeeConfig();

  const getRes = await chargebeeFetch(
    cfg,
    `/api/v2/customers/${encodeURIComponent(customerId)}`,
    { method: "GET" },
  );

  if (getRes.ok) {
    const customer = isRecord(getRes.data) ? getRes.data["customer"] : null;
    return { created: false, customer };
  }

  const errorCode =
    isRecord(getRes.data) && typeof getRes.data["error_code"] === "string"
      ? (getRes.data["error_code"] as string)
      : undefined;
  const apiErrorCode =
    isRecord(getRes.data) && typeof getRes.data["api_error_code"] === "string"
      ? (getRes.data["api_error_code"] as string)
      : undefined;

  if (
    getRes.status !== 404 &&
    errorCode !== "resource_not_found" &&
    apiErrorCode !== "resource_not_found"
  ) {
    throw new Error(
      `Chargebee get customer failed (${getRes.status}): ${JSON.stringify(
        getRes.data,
      )}`,
    );
  }

  const body = new URLSearchParams({ id: customerId });
  const createRes = await chargebeeFetch(cfg, `/api/v2/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!createRes.ok) {
    throw new Error(
      `Chargebee create customer failed (${createRes.status}): ${JSON.stringify(
        createRes.data,
      )}`,
    );
  }

  const customer = isRecord(createRes.data) ? createRes.data["customer"] : null;
  return { created: true, customer };
}

export async function getCustomer(customerId: string): Promise<unknown | null> {
  const cfg = getChargebeeConfig();
  const res = await chargebeeFetch(
    cfg,
    `/api/v2/customers/${encodeURIComponent(customerId)}`,
    { method: "GET" },
  );

  if (res.ok) {
    return isRecord(res.data) ? res.data["customer"] : null;
  }

  const errorCode =
    isRecord(res.data) && typeof res.data["error_code"] === "string"
      ? (res.data["error_code"] as string)
      : undefined;
  const apiErrorCode =
    isRecord(res.data) && typeof res.data["api_error_code"] === "string"
      ? (res.data["api_error_code"] as string)
      : undefined;
  if (res.status === 404 && (errorCode === "resource_not_found" || apiErrorCode === "resource_not_found")) {
    return null;
  }

  throw new Error(
    `Chargebee get customer failed (${res.status}): ${JSON.stringify(res.data)}`,
  );
}

export async function createCustomer(params: {
  id: string;
  email: string;
  businessEntityId: string;
}): Promise<unknown> {
  const cfg = getChargebeeConfig();
  const body = new URLSearchParams();
  body.set("id", params.id);
  body.set("email", params.email);
  body.set("business_entity_id", params.businessEntityId);

  const res = await chargebeeFetch(cfg, `/api/v2/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    throw new Error(
      `Chargebee create customer failed (${res.status}): ${JSON.stringify(res.data)}`,
    );
  }

  return isRecord(res.data) ? (res.data["customer"] ?? res.data) : res.data;
}

export async function listSubscriptionsByCustomer(customerId: string) {
  const cfg = getChargebeeConfig();
  const qs = new URLSearchParams();
  qs.set("customer_id[is]", customerId);
  const res = await chargebeeFetch(
    cfg,
    `/api/v2/subscriptions?${qs.toString()}`,
    { method: "GET" },
  );

  if (!res.ok) {
    throw new Error(
      `Chargebee list subscriptions failed (${res.status}): ${JSON.stringify(
        res.data,
      )}`,
    );
  }

  if (!isRecord(res.data) || !Array.isArray(res.data["list"])) return [];
  return res.data["list"];
}

export async function listSubscriptionEntitlements(subscriptionId: string) {
  const cfg = getChargebeeConfig();
  const res = await chargebeeFetch(
    cfg,
    `/api/v2/subscriptions/${encodeURIComponent(
      subscriptionId,
    )}/subscription_entitlements`,
    { method: "GET" },
  );

  if (!res.ok) {
    throw new Error(
      `Chargebee entitlements failed (${res.status}): ${JSON.stringify(
        res.data,
      )}`,
    );
  }

  if (!isRecord(res.data) || !Array.isArray(res.data["list"])) return [];
  return res.data["list"];
}

export async function createPortalSession(customerId: string) {
  const cfg = getChargebeeConfig();
  const body = new URLSearchParams();
  body.set("customer[id]", customerId);

  const res = await chargebeeFetch(cfg, `/api/v2/portal_sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    throw new Error(
      `Chargebee create portal session failed (${res.status}): ${JSON.stringify(
        res.data,
      )}`,
    );
  }

  return isRecord(res.data) ? res.data["portal_session"] : null;
}

export async function createPricingPageSessionForNewSubscription(
  pricingPageId: string,
  businessEntityId?: string | null,
  customerId?: string | null,
  autoSelectLocalCurrency: boolean = true,
) {
  const cfg = getChargebeeConfig();
  const body = new URLSearchParams();
  body.set("pricing_page[id]", pricingPageId);
  if (businessEntityId) body.set("business_entity_id", businessEntityId);
  if (customerId) body.set("customer[id]", customerId);
  body.set("auto_select_local_currency", autoSelectLocalCurrency ? "true" : "false");

  const res = await chargebeeFetch(
    cfg,
    `/api/v2/pricing_page_sessions/create_for_new_subscription`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    },
  );

  if (!res.ok) {
    throw new Error(
      `Chargebee create pricing page session failed (${res.status}): ${JSON.stringify(
        res.data,
      )}`,
    );
  }

  return isRecord(res.data) ? res.data["pricing_page_session"] : null;
}

export async function createPricingPageSessionForExistingSubscription(
  pricingPageId: string,
  subscriptionId: string,
  businessEntityId?: string | null,
) {
  const cfg = getChargebeeConfig();
  const body = new URLSearchParams();
  body.set("pricing_page[id]", pricingPageId);
  body.set("subscription[id]", subscriptionId);
  if (businessEntityId) body.set("business_entity_id", businessEntityId);

  const res = await chargebeeFetch(
    cfg,
    `/api/v2/pricing_page_sessions/create_for_existing_subscription`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    },
  );

  if (!res.ok) {
    throw new Error(
      `Chargebee create pricing page session (existing subscription) failed (${
        res.status
      }): ${JSON.stringify(res.data)}`,
    );
  }

  return isRecord(res.data) ? res.data["pricing_page_session"] : null;
}

