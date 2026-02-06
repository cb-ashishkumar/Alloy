import { authOptions } from "@/lib/auth";
import { corsHeaders } from "@/lib/cors";
import { createCustomer, getCustomer } from "@/lib/chargebee";
import { logJsonLine, safeForLog } from "@/lib/logging";
import { BUSINESS_ENTITY_ID_BY_REGION } from "@/lib/businessEntities";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function GET(req: Request) {
  const requestId = crypto.randomUUID();
  const endpoint = "/api/chargebee/customer";
  const headers = corsHeaders(req);

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "unauthorized", requestId }, { status: 401, headers });
  }

  const customer = await getCustomer(session.customer_id);
  const be =
    typeof customer === "object" &&
    customer !== null &&
    "business_entity_id" in customer
      ? String((customer as { business_entity_id?: unknown }).business_entity_id ?? "")
      : null;

  const payload = {
    exists: Boolean(customer),
    customer_id: session.customer_id,
    business_entity_id: be,
    customer,
    requestId,
  };

  logJsonLine(`[customer][${requestId}] → 200 ${endpoint}`, {
    endpoint,
    requestId,
    status: 200,
    response: safeForLog(payload),
  });

  return NextResponse.json(payload, { headers });
}

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const endpoint = "/api/chargebee/customer";
  const headers = corsHeaders(req);

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "unauthorized", requestId }, { status: 401, headers });
  }

  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    business_entity_id?: string;
    region?: "US" | "EU"; // UI alias
  };

  const email = body.email?.trim();
  const businessEntityIdRaw = body.business_entity_id ?? body.region;
  if (!email || !businessEntityIdRaw) {
    return NextResponse.json(
      { error: "invalid_payload", requestId },
      { status: 400, headers },
    );
  }

  // Normalize: if UI sent "US"/"EU", map to Chargebee IDs.
  const businessEntityId =
    businessEntityIdRaw === "US"
      ? BUSINESS_ENTITY_ID_BY_REGION.us
      : businessEntityIdRaw === "EU"
        ? BUSINESS_ENTITY_ID_BY_REGION.eu
        : businessEntityIdRaw;

  // If customer already exists, don't allow changing region (requirement).
  const existing = await getCustomer(session.customer_id);
  if (existing) {
    return NextResponse.json(
      { error: "customer_already_exists", requestId },
      { status: 409, headers },
    );
  }

  const created = await createCustomer({
    id: session.customer_id,
    email,
    businessEntityId,
  });

  const payload = {
    created: true,
    customer_id: session.customer_id,
    business_entity_id: businessEntityId,
    customer: created,
    requestId,
  };

  logJsonLine(`[customer][${requestId}] → 201 ${endpoint}`, {
    endpoint,
    requestId,
    status: 201,
    response: safeForLog(payload),
  });

  return NextResponse.json(payload, { status: 201, headers });
}

