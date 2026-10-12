import { connection, NextResponse } from "next/server";
import { getDb } from "@/infrastructure/db/client";

export async function GET() {
  await connection();
  try {
    getDb().prepare("SELECT 1").get();
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}
