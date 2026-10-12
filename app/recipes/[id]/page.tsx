import { notFound } from "next/navigation";
import { recipeRepository } from "@/infrastructure/repositories/recipe.repository";
import { RecipeDetailClient } from "@/components/recipe/RecipeDetailClient";
import { waitForUiTestDelay } from "@/infrastructure/ui/test-delay";

export const instant = false;

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await waitForUiTestDelay();
  const { id } = await params;
  const recipe = recipeRepository.getRecipeById(id);

  if (!recipe) {
    notFound();
  }

  return <RecipeDetailClient recipe={recipe} />;
}
