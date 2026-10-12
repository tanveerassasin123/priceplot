import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { MOCK_CATALOG } from "@/lib/providers/mock-catalog";
import { analyzeDealSafety } from "@/lib/sellers/analyzer";
import { rankDeals } from "@/lib/ranking/engine";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const offers = MOCK_CATALOG.filter((o) => o.productId === id).map((o) =>
      analyzeDealSafety(o, MOCK_CATALOG.filter((x) => x.productId === id)),
    );
    if (!offers.length) {
      return NextResponse.json({ error: "Price information is currently unavailable." }, { status: 404 });
    }
    return NextResponse.json({ offers, ranked: rankDeals(offers) });
  } catch (error) {
    return jsonError(error);
  }
}
