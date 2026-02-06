import { authOptions } from "@/lib/auth";
import { corsHeaders } from "@/lib/cors";
import {
  createPricingPageSessionForExistingSubscription,
  createPricingPageSessionForNewSubscription,
} from "@/lib/chargebee";
import { logJsonLine, safeForLog } from "@/lib/logging";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const endpoint = "/api/chargebee/pricing-page-session";
  const headers = corsHeaders(req);

  const session = await getServerSession(authOptions);
  if (!session) {
    logJsonLine(`[pricing-page-session][${requestId}] → 401 ${endpoint}`, {
      endpoint,
      requestId,
      status: 401,
      error: "unauthorized",
    });
    return NextResponse.json(
      { error: "unauthorized", requestId },
      { status: 401, headers },
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    pricingPageId?: string;
    businessEntityId?: string | null;
    subscriptionId?: string | null;
  };
  const pricingPageId = body.pricingPageId;
  if (!pricingPageId) {
    logJsonLine(`[pricing-page-session][${requestId}] → 400 ${endpoint}`, {
      endpoint,
      requestId,
      status: 400,
      error: "missing_pricingPageId",
    });
    return NextResponse.json(
      { error: "missing_pricingPageId", requestId },
      { status: 400, headers },
    );
  }

  try {
    const pricingPageSession = body.subscriptionId
      ? await createPricingPageSessionForExistingSubscription(
          pricingPageId,
          body.subscriptionId,
          body.businessEntityId ?? null,
        )
      : await createPricingPageSessionForNewSubscription(
          pricingPageId,
          body.businessEntityId ?? null,
          session.customer_id,
          true,
        );

    const payload = {
      pricing_page_session: pricingPageSession,
      requestId,
      // debug-friendly context (also helps verify customer_id usage)
      customer_id: session.customer_id,
      mode: body.subscriptionId ? "existing_subscription" : "new_subscription",
    };
    logJsonLine(`[pricing-page-session][${requestId}] → 200 ${endpoint}`, {
      endpoint,
      requestId,
      status: 200,
      customer_id: session.customer_id,
      pricingPageId,
      business_entity_id: body.businessEntityId ?? null,
      subscription_id: body.subscriptionId ?? null,
      mode: body.subscriptionId ? "existing_subscription" : "new_subscription",
      auto_select_local_currency: body.subscriptionId ? null : true,
      response: safeForLog(payload),
    });
    return NextResponse.json(payload, { headers });
  } catch (err) {
    const payload = {
      error: "chargebee_error",
      message: err instanceof Error ? err.message : String(err),
      requestId,
    };
    logJsonLine(`[pricing-page-session][${requestId}] → 500 ${endpoint}`, {
      endpoint,
      requestId,
      status: 500,
      pricingPageId,
      business_entity_id: body.businessEntityId ?? null,
      subscription_id: body.subscriptionId ?? null,
      response: safeForLog(payload),
    });
    return NextResponse.json(payload, { status: 500, headers });
  }
}

