import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { syncExpiredPendingOrders } from "@/lib/orders/expiration";

function secureEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.INTERNAL_CRON_SECRET?.trim();

  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";
  const headerToken = request.headers.get("x-cron-secret")?.trim() ?? "";

  return (
    (bearerToken.length > 0 && secureEqual(bearerToken, secret)) ||
    (headerToken.length > 0 && secureEqual(headerToken, secret))
  );
}

async function handleSync(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const syncedOrders = await syncExpiredPendingOrders();
  return NextResponse.json(
    {
      success: true,
      syncedOrders,
      ranAt: new Date().toISOString(),
    },
    { status: 200 },
  );
}

export async function GET(request: NextRequest) {
  return handleSync(request);
}

export async function POST(request: NextRequest) {
  return handleSync(request);
}
