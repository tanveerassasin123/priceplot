import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/factory";
import { jsonError } from "@/lib/api/errors";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import { runSearch } from "@/lib/search/pipeline";

export async function POST(request: Request) {
  try {
    if (!rateLimit(`image:${clientKey(request.headers)}`, 10)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    const form = await request.formData();
    const file = form.get("image");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Upload a product image." }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const ai = getAIProvider();
    const identified = ai.identifyImage
      ? await ai.identifyImage(buffer.toString("base64"), file.type || "image/jpeg")
      : { product: file.name, confidence: 0.2 };

    const guess = [identified.brand, identified.product, identified.variant]
      .filter(Boolean)
      .join(" ");
    const needsConfirm = (identified.confidence ?? 0) < 0.75;
    const search = guess ? await runSearch(guess) : null;

    return NextResponse.json({
      identified,
      needsConfirm,
      confirmMessage: needsConfirm
        ? `We think this is: ${guess || "an unknown product"}. Is this correct?`
        : null,
      search,
    });
  } catch (error) {
    return jsonError(error);
  }
}
