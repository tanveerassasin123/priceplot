import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/errors";
import { runSearch, summarizeQuery } from "@/lib/search/pipeline";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import { searchBodySchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    if (!rateLimit(`search:${clientKey(request.headers)}`, 20)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    const body = searchBodySchema.parse(await request.json());
    const result = await runSearch(body.q);
    return NextResponse.json({
      ...result,
      title: summarizeQuery(result.query),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  return POST(
    new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify({ q }),
    }),
  );
}
