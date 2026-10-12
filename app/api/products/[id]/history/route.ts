import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { getPriceHistory } from "@/lib/database/repos";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const days = Number(new URL(request.url).searchParams.get("days") ?? "90");
    const allowed = [7, 30, 90, 365];
    const range = allowed.includes(days) ? days : 90;
    const history = await getPriceHistory(id, range);
    return NextResponse.json({ history, range, fabricated: false });
  } catch (error) {
    return jsonError(error);
  }
}
