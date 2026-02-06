import { authOptions } from "@/lib/auth";
import { corsHeaders } from "@/lib/cors";
import { logJsonLine, safeForLog } from "@/lib/logging";
import { incrementConsumption } from "@/lib/consumptionStore";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const endpoint = "/api/consumption/increment";
  const headers = corsHeaders(req);

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "unauthorized", requestId }, { status: 401, headers });
  }

  const body = (await req.json().catch(() => ({}))) as {
    subscriptionId?: string;
    featureId?: string;
    delta?: number;
  };

  const subscriptionId = body.subscriptionId;
  const featureId = body.featureId;
  const delta = Number.isFinite(body.delta) ? Number(body.delta) : 1;

  if (!subscriptionId || !featureId) {
    return NextResponse.json(
      { error: "invalid_payload", requestId },
      { status: 400, headers },
    );
  }

  const item = await incrementConsumption({
    customerId: session.customer_id,
    subscriptionId,
    featureId,
    delta,
  });

  const payload = { subscriptionId, item, requestId };
  logJsonLine(`[consumption][${requestId}] → 200 ${endpoint}`, {
    endpoint,
    requestId,
    status: 200,
    response: safeForLog(payload),
  });

  return NextResponse.json(payload, { headers });
}

