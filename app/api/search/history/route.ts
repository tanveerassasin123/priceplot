import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSearchHistory } from "@/lib/database/repos";
import { jsonError } from "@/lib/api/errors";

export async function GET() {
  try {
    const session = await auth();
    const history = await getSearchHistory(session?.user?.id);
    return NextResponse.json({ history });
  } catch (error) {
    return jsonError(error);
  }
}
