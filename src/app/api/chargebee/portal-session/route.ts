import { authOptions } from "@/lib/auth";
import { corsHeaders } from "@/lib/cors";
import { createPortalSession } from "@/lib/chargebee";
import { logJsonLine, safeForLog } from "@/lib/logging";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const endpoint = "/api/chargebee/portal-session";
  const headers = corsHeaders(req);

  const session = await getServerSession(authOptions);
  if (!session) {
    logJsonLine(`[portal-session][${requestId}] → 401 ${endpoint}`, {
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

  try {
    const customerId = session.customer_id;
    const portalSession = await createPortalSession(customerId);

    const payload = { portal_session: portalSession, requestId };
    logJsonLine(`[portal-session][${requestId}] → 200 ${endpoint}`, {
      endpoint,
      requestId,
      status: 200,
      customer_id: customerId,
      response: safeForLog(payload),
    });

    return NextResponse.json(payload, { headers });
  } catch (err) {
    const payload = {
      error: "chargebee_error",
      message: err instanceof Error ? err.message : String(err),
      requestId,
    };
    logJsonLine(`[portal-session][${requestId}] → 500 ${endpoint}`, {
      endpoint,
      requestId,
      status: 500,
      response: safeForLog(payload),
    });
    return NextResponse.json(payload, { status: 500, headers });
  }
}

