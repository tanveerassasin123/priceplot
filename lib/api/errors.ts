import { NextResponse } from "next/server";
import { AppError } from "@/lib/offers/types";
import { logError } from "@/lib/observability/metrics";

export function jsonError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  logError("api.unhandled", error);
  return NextResponse.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 },
  );
}
