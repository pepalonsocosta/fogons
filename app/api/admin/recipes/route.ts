import { NextResponse } from "next/server";
import {
  isValidAdminSession,
  ADMIN_SESSION_COOKIE,
} from "@/infrastructure/auth/admin-auth";
import { recipeRepository } from "@/infrastructure/repositories/recipe.repository";
import { AdminRecipeInput } from "@/domain/recipe/admin-types";

function isAdmin(request: Request) {
  return isValidAdminSession(
    request.headers
      .get("cookie")
      ?.split("; ")
      .find((value) => value.startsWith(`${ADMIN_SESSION_COOKIE}=`))
      ?.split("=")[1],
  );
}

function isValidInput(input: AdminRecipeInput) {
  return Boolean(
    input.title.trim() &&
    input.tagline.trim() &&
    input.baseServings > 0 &&
    input.ingredients.length > 0 &&
    input.ingredients.every(
      (ingredient) => ingredient.name.trim() && ingredient.amount > 0,
    ) &&
    input.steps.length > 0 &&
    input.steps.every((step) => step.title.trim() && step.instruction.trim()),
  );
}

export async function POST(request: Request) {
  if (!isAdmin(request))
    return NextResponse.json({ error: "No autoritzat" }, { status: 401 });

  const input = (await request.json()) as AdminRecipeInput;
  if (!isValidInput(input)) {
    return NextResponse.json(
      {
        error: "Completa el títol, les racions, els ingredients i els passos.",
      },
      { status: 400 },
    );
  }

  const recipe = recipeRepository.createRecipe(input);
  return NextResponse.json({ success: true, data: recipe }, { status: 201 });
}
