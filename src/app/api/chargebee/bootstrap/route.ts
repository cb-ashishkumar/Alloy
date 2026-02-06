import { authOptions } from "@/lib/auth";
import { getCustomer, listSubscriptionsByCustomer } from "@/lib/chargebee";
import { logJsonLine, safeForLog } from "@/lib/logging";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export async function GET() {
  const requestId = crypto.randomUUID();
  const endpoint = "/api/chargebee/bootstrap";
  logJsonLine(`[bootstrap][${requestId}] ← GET ${endpoint}`, {
    endpoint,
    requestId,
  });
  const session = await getServerSession(authOptions);
  if (!session) {
    logJsonLine(`[bootstrap][${requestId}] → 401 ${endpoint}`, {
      endpoint,
      requestId,
      status: 401,
      error: "unauthorized",
    });
    return NextResponse.json({ error: "unauthorized", requestId }, { status: 401 });
  }

  try {
    const customerId = session.customer_id;
    logJsonLine(`[bootstrap][${requestId}] start`, {
      endpoint,
      requestId,
      customer_id: customerId,
      site: process.env.CHARGEBEE_SITE ?? "unset",
    });
    const customer = await getCustomer(customerId);
    if (!customer) {
      const payload = { error: "customer_not_found", customer_id: customerId, requestId };
      logJsonLine(`[bootstrap][${requestId}] → 404 ${endpoint}`, {
        endpoint,
        requestId,
        status: 404,
        response: safeForLog(payload),
      });
      return NextResponse.json(payload, { status: 404 });
    }
    const subscriptions = await listSubscriptionsByCustomer(customerId);

    const businessEntityId =
      isRecord(customer) && typeof customer["business_entity_id"] === "string"
        ? (customer["business_entity_id"] as string)
        : null;

    const payload = {
      customer_id: customerId,
      business_entity_id: businessEntityId,
      customer,
      subscriptions,
      requestId,
    };
    logJsonLine(`[bootstrap][${requestId}] → 200 ${endpoint}`, {
      endpoint,
      requestId,
      status: 200,
      subscriptions_count: subscriptions.length,
      business_entity_id: businessEntityId,
      response: safeForLog(payload),
    });
    return NextResponse.json(payload);
  } catch (err) {
    const payload = {
      error: "chargebee_error",
      message: err instanceof Error ? err.message : String(err),
      requestId,
    };
    logJsonLine(`[bootstrap][${requestId}] → 500 ${endpoint}`, {
      endpoint,
      requestId,
      status: 500,
      response: safeForLog(payload),
    });
    return NextResponse.json(payload, { status: 500 });
  }
}

