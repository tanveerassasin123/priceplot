import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { createUser, findUserByEmail } from "@/lib/database/repos";
import { jsonError } from "@/lib/api/errors";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import { registerBodySchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    if (!rateLimit(`register:${clientKey(request.headers)}`, 10)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    const body = registerBodySchema.parse(await request.json());
    const existing = await findUserByEmail(body.email);
    if (existing) {
      return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
    }
    const passwordHash = await hash(body.password, 12);
    const user = await createUser({
      email: body.email,
      name: body.name,
      passwordHash,
    });
    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
  } catch (error) {
    return jsonError(error);
  }
}
