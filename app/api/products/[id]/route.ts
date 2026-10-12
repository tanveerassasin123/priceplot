import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { MOCK_CATALOG } from "@/lib/providers/mock-catalog";
import { getProductOffers } from "@/lib/database/repos";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const offers = [
      ...MOCK_CATALOG.filter((o) => o.productId === id),
      ...(await getProductOffers(id)),
    ];
    const unique = [...new Map(offers.map((o) => [o.id, o])).values()];
    if (unique.length === 0) {
      return NextResponse.json({ error: "No products found." }, { status: 404 });
    }
    const sample = unique[0];
    return NextResponse.json({
      id,
      title: sample.title,
      brand: sample.brand,
      model: sample.model,
      variant: sample.variant,
      offers: unique,
    });
  } catch (error) {
    return jsonError(error);
  }
}
