import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionMaxAge,
  createAdminSession,
  verifyFirebaseIdToken,
} from "@/lib/adminSession";

function clearCookie(response: NextResponse): NextResponse {
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function POST(request: Request) {
  let body: { idToken?: unknown } = {};
  try {
    body = (await request.json()) as { idToken?: unknown };
  } catch {
    body = {};
  }

  const idToken = typeof body.idToken === "string" ? body.idToken.trim() : "";
  if (!idToken) {
    return NextResponse.json(
      { error: "Token login tidak ditemukan. Silakan login ulang." },
      { status: 400 },
    );
  }

  const result = await verifyFirebaseIdToken(idToken);
  if (!result.ok) {
    console.error(`[admin-session] Verifikasi ID token gagal (${result.reason})`);
    return clearCookie(
      NextResponse.json({ error: result.message }, { status: 401 }),
    );
  }

  const response = NextResponse.json({ ok: true, email: result.email });
  response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSession(result.email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: adminSessionMaxAge,
  });
  return response;
}

export async function DELETE() {
  return clearCookie(NextResponse.json({ ok: true }));
}
