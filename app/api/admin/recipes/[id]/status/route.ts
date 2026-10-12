import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  isValidAdminSession,
} from "@/infrastructure/auth/admin-auth";
import { recipeRepository } from "@/infrastructure/repositories/recipe.repository";
import { RecipeStatus } from "@/domain/recipe/types";

function isAdmin(request: Request) {
  return isValidAdminSession(
    request.headers
      .get("cookie")
      ?.split("; ")
      .find((value) => value.startsWith(`${ADMIN_SESSION_COOKIE}=`))
      ?.split("=")[1],
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdmin(request))
    return NextResponse.json({ error: "No autoritzat" }, { status: 401 });
  const { id } = await params;
  const body = (await request.json()) as { status?: unknown };
  if (body.status !== "draft" && body.status !== "published") {
    return NextResponse.json({ error: "Estat no vàlid" }, { status: 400 });
  }
  try {
    recipeRepository.updateRecipeStatus(id, body.status as RecipeStatus);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No s’ha pogut actualitzar l’estat.",
      },
      { status: 400 },
    );
  }
  return NextResponse.json({ success: true });
}
