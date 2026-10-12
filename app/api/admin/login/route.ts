import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSession,
  isValidAdminPassword,
} from "@/infrastructure/auth/admin-auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { password?: unknown };
  if (
    typeof body.password !== "string" ||
    !isValidAdminPassword(body.password)
  ) {
    return NextResponse.json(
      { error: "Contrasenya incorrecta" },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSession(), {
    httpOnly: true,
    maxAge: 60 * 60 * 12,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
