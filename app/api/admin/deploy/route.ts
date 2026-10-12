import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  isValidAdminSession,
} from "@/infrastructure/auth/admin-auth";
import { startDeployJob } from "@/infrastructure/deploy/deploy-agent";

function isAdmin(request: Request): boolean {
  const session = request.headers
    .get("cookie")
    ?.split("; ")
    .find((value) => value.startsWith(`${ADMIN_SESSION_COOKIE}=`))
    ?.split("=")[1];
  return isValidAdminSession(session);
}

export async function POST(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
  }

  const result = await startDeployJob();
  return NextResponse.json(result.body, { status: result.status });
}
