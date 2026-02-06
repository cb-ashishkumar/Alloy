import { authOptions } from "@/lib/auth";
import { listSubscriptionEntitlements } from "@/lib/chargebee";
import { logJsonLine, safeForLog } from "@/lib/logging";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ subscriptionId: string }> },
) {
  const requestId = crypto.randomUUID();
  const endpoint =
    "/api/chargebee/subscriptions/:subscriptionId/entitlements";
  logJsonLine(`[entitlements][${requestId}] ← GET ${endpoint}`, {
    endpoint,
    requestId,
  });
  const session = await getServerSession(authOptions);
  if (!session) {
    logJsonLine(`[entitlements][${requestId}] → 401 ${endpoint}`, {
      endpoint,
      requestId,
      status: 401,
      error: "unauthorized",
    });
    return NextResponse.json({ error: "unauthorized", requestId }, { status: 401 });
  }

  const { subscriptionId } = await params;

  try {
    logJsonLine(`[entitlements][${requestId}] start`, {
      endpoint,
      requestId,
      subscription_id: subscriptionId,
    });
    const entitlements = await listSubscriptionEntitlements(subscriptionId);
    const payload = { subscription_id: subscriptionId, entitlements, requestId };
    logJsonLine(`[entitlements][${requestId}] → 200 ${endpoint}`, {
      endpoint,
      requestId,
      status: 200,
      subscription_id: subscriptionId,
      entitlements_count: entitlements.length,
      response: safeForLog(payload),
    });
    return NextResponse.json(payload);
  } catch (err) {
    const payload = {
      error: "chargebee_error",
      message: err instanceof Error ? err.message : String(err),
      requestId,
    };
    logJsonLine(`[entitlements][${requestId}] → 500 ${endpoint}`, {
      endpoint,
      requestId,
      status: 500,
      subscription_id: subscriptionId,
      response: safeForLog(payload),
    });
    return NextResponse.json(payload, { status: 500 });
  }
}

