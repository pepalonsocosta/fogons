import { notFound } from "next/navigation";
import { requireAdminSession } from "@/infrastructure/auth/admin-auth";
import { recipeRepository } from "@/infrastructure/repositories/recipe.repository";
import { RecipeDetailClient } from "@/components/recipe/RecipeDetailClient";

export default async function AdminRecipePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSession();
  const { id } = await params;
  const recipe = recipeRepository.getRecipeById(id, true);
  if (!recipe) notFound();
  return <RecipeDetailClient recipe={recipe} />;
}
