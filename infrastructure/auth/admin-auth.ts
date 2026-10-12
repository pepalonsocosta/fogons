import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const ADMIN_SESSION_COOKIE = "fogons_admin_session";

function getSessionSecret() {
  const secret = process.env.FOGONS_ADMIN_SESSION_SECRET;
  if (!secret)
    throw new Error("FOGONS_ADMIN_SESSION_SECRET is not configured");
  return secret;
}

function getAdminPassword() {
  const password = process.env.FOGONS_ADMIN_PASSWORD;
  if (!password) throw new Error("FOGONS_ADMIN_PASSWORD is not configured");
  return password;
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

export function isValidAdminPassword(password: string) {
  const expected = Buffer.from(getAdminPassword());
  const received = Buffer.from(password);
  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}

export function createAdminSession() {
  const value = "admin";
  return `${value}.${sign(value)}`;
}

export function isValidAdminSession(value: string | undefined) {
  if (!value) return false;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return false;
  const expected = sign(payload);
  const received = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return (
    expectedBuffer.length === received.length &&
    timingSafeEqual(expectedBuffer, received)
  );
}

export async function requireAdminSession() {
  const cookieStore = await cookies();
  if (!isValidAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)) {
    redirect("/admin/login");
  }
}
