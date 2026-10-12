import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { jsonError } from "@/lib/api/errors";
import { deleteAlert, getAlertById } from "@/lib/database/repos";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }
    const { id } = await context.params;
    const existing = await getAlertById(id);
    if (existing && existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Not allowed." }, { status: 403 });
    }
    const ok = await deleteAlert(session.user.id, id);
    if (!ok) return NextResponse.json({ error: "Alert not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
