import { notFound } from "next/navigation";
import { recipeRepository } from "@/infrastructure/repositories/recipe.repository";
import { FocusStepper } from "@/components/cooking/FocusStepper";
import { waitForUiTestDelay } from "@/infrastructure/ui/test-delay";

export const instant = false;

export default async function CookingModePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ servings?: string }>;
}) {
  await waitForUiTestDelay();
  const { id } = await params;
  const query = await searchParams;
  const recipe = recipeRepository.getRecipeById(id);

  if (!recipe) {
    notFound();
  }

  const initialServings =
    Number(query.servings) > 0
      ? Number(query.servings)
      : recipe.recommendedServings;

  return <FocusStepper recipe={recipe} initialServings={initialServings} />;
}
