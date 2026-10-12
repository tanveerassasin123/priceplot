import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { jsonError } from "@/lib/api/errors";
import { createAlert, listAlerts } from "@/lib/database/repos";
import { alertBodySchema } from "@/lib/validation/schemas";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Sign in to view alerts." }, { status: 401 });
    }
    const alerts = await listAlerts(session.user.id);
    return NextResponse.json({ alerts });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Sign in to create alerts." }, { status: 401 });
    }
    if (!rateLimit(`alerts:${session.user.id}:${clientKey(request.headers)}`, 20)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    const body = alertBodySchema.parse(await request.json());
    const alert = await createAlert(session.user.id, body.productId, body.targetPrice);
    return NextResponse.json({ alert });
  } catch (error) {
    return jsonError(error);
  }
}
