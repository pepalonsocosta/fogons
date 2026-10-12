import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  isValidAdminSession,
  ADMIN_SESSION_COOKIE,
} from "@/infrastructure/auth/admin-auth";

const allowedTypes: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function isAdmin(request: Request) {
  return isValidAdminSession(
    request.headers
      .get("cookie")
      ?.split("; ")
      .find((value) => value.startsWith(`${ADMIN_SESSION_COOKIE}=`))
      ?.split("=")[1],
  );
}

export async function POST(request: Request) {
  if (!isAdmin(request))
    return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File))
    return NextResponse.json({ error: "Falta la imatge." }, { status: 400 });
  if (!allowedTypes[file.type])
    return NextResponse.json(
      { error: "Format no vàlid. Utilitza JPG, PNG o WebP." },
      { status: 400 },
    );
  if (file.size > 5 * 1024 * 1024)
    return NextResponse.json(
      { error: "La imatge no pot superar els 5 MB." },
      { status: 400 },
    );

  const extension = allowedTypes[file.type];
  const filename = `${randomUUID()}.${extension}`;
  const uploadDirectory = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(
    path.join(uploadDirectory, filename),
    Buffer.from(await file.arrayBuffer()),
  );

  return NextResponse.json({ success: true, url: `/uploads/${filename}` });
}
