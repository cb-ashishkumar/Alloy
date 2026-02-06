import { authOptions } from "@/lib/auth";
import { corsHeaders } from "@/lib/cors";
import { logJsonLine, safeForLog } from "@/lib/logging";
import { getConsumptionBulk } from "@/lib/consumptionStore";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const endpoint = "/api/consumption/bulk";
  const headers = corsHeaders(req);

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "unauthorized", requestId }, { status: 401, headers });
  }

  const body = (await req.json().catch(() => ({}))) as {
    subscriptionId?: string;
    featureIds?: string[];
  };

  const subscriptionId = body.subscriptionId;
  const featureIds = Array.isArray(body.featureIds) ? body.featureIds.filter(Boolean) : [];

  if (!subscriptionId || featureIds.length === 0) {
    return NextResponse.json(
      { error: "invalid_payload", requestId },
      { status: 400, headers },
    );
  }

  const items = await getConsumptionBulk({
    customerId: session.customer_id,
    subscriptionId,
    featureIds,
  });

  const payload = { subscriptionId, items, requestId };
  logJsonLine(`[consumption][${requestId}] → 200 ${endpoint}`, {
    endpoint,
    requestId,
    status: 200,
    response: safeForLog(payload),
  });

  return NextResponse.json(payload, { headers });
}

