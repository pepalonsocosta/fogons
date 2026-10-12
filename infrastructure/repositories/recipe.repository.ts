import { getDb } from "../db/client";
import { AdminRecipeInput } from "@/domain/recipe/admin-types";
import {
  RecipeSummary,
  RecipeDetail,
  RecipeIngredient,
  RecipeStep,
  RecipeCompletionPayload,
  MetricUnit,
  RecipeDifficulty,
  RecipeStatus,
  StepPhase,
} from "@/domain/recipe/types";

interface RecipeRow {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: string;
  difficulty: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  total_time_minutes: number;
  recommended_servings: number;
  image_url: string;
  tags_json: string;
  status: string;
}

interface IngredientRow {
  id: string;
  recipe_id: string;
  name: string;
  amount_per_serving: number;
  unit: string;
  prep_note: string | null;
  category: string | null;
  is_optional: number;
}

interface StepRow {
  recipe_id: string;
  step_number: number;
  title: string;
  phase: string;
  instruction: string;
  tip: string | null;
  timer_seconds: number;
  ingredients_json: string;
}

export const recipeRepository = {
  getAdminRecipes(): RecipeSummary[] {
    const db = getDb();
    const rows = db
      .prepare(
        `
      SELECT id, title, tagline, category, difficulty,
             prep_time_minutes, cook_time_minutes, total_time_minutes,
             recommended_servings, image_url, tags_json, status
      FROM recipes
      ORDER BY created_at DESC
    `,
      )
      .all() as unknown as RecipeRow[];

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      tagline: row.tagline,
      category: row.category,
      difficulty: row.difficulty as RecipeDifficulty,
      prepTimeMinutes: row.prep_time_minutes,
      cookTimeMinutes: row.cook_time_minutes,
      totalTimeMinutes: row.total_time_minutes,
      recommendedServings: row.recommended_servings,
      imageUrl: row.image_url,
      tags: JSON.parse(row.tags_json),
      status: row.status as RecipeStatus,
    }));
  },

  updateRecipeStatus(id: string, status: RecipeStatus): void {
    const db = getDb();
    if (status === "published") {
      const recipe = db
        .prepare("SELECT image_url FROM recipes WHERE id = ?")
        .get(id) as { image_url?: string } | undefined;
      if (!recipe?.image_url)
        throw new Error("A published recipe needs an image");
    }
    db.prepare("UPDATE recipes SET status = ? WHERE id = ?").run(status, id);
  },

  createRecipe(input: AdminRecipeInput): RecipeDetail {
    const db = getDb();
    const idBase = input.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const id = `${idBase || "recepta"}-${Date.now()}`;
    const totalTimeMinutes = input.prepTimeMinutes + input.cookTimeMinutes;
    const ingredients = input.ingredients.map((ingredient, index) => ({
      id: `${id}-ingredient-${index + 1}`,
      name: ingredient.name.trim(),
      amountPerServing: ingredient.amount / input.baseServings,
      unit: ingredient.unit,
      prepNote: ingredient.prepNote?.trim() || undefined,
      isOptional: ingredient.isOptional,
    }));
    const steps = input.steps.map((step, index) => ({
      stepNumber: index + 1,
      title: step.title.trim(),
      phase: step.phase,
      instruction: step.instruction.trim(),
      tip: step.tip?.trim() || undefined,
      timerSeconds: step.timerSeconds || 0,
      ingredientsUsed: step.ingredientsUsed
        .map((usage) => ({
          ingredientId: ingredients[usage.ingredientIndex]?.id || "",
          amountPerServing: usage.amount / input.baseServings,
          unit: usage.unit,
        }))
        .filter((usage) => usage.ingredientId),
    }));

    db.exec("BEGIN");
    try {
      db.prepare(
        `
        INSERT INTO recipes (
          id, title, tagline, description, category, difficulty,
          prep_time_minutes, cook_time_minutes, total_time_minutes,
          recommended_servings, image_url, tags_json, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ).run(
        id,
        input.title.trim(),
        input.tagline.trim(),
        input.description?.trim() || "",
        "",
        "easy",
        input.prepTimeMinutes,
        input.cookTimeMinutes,
        totalTimeMinutes,
        input.baseServings,
        input.imageUrl?.trim() || "",
        "[]",
        input.status,
      );

      const ingredientStatement = db.prepare(`
        INSERT INTO recipe_ingredients (
          id, recipe_id, name, amount_per_serving, unit, prep_note, category, is_optional
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      ingredients.forEach((ingredient) =>
        ingredientStatement.run(
          ingredient.id,
          id,
          ingredient.name,
          ingredient.amountPerServing,
          ingredient.unit,
          ingredient.prepNote || null,
          null,
          ingredient.isOptional ? 1 : 0,
        ),
      );

      const stepStatement = db.prepare(`
        INSERT INTO recipe_steps (
          recipe_id, step_number, title, phase, instruction, tip, timer_seconds, ingredients_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      steps.forEach((step) =>
        stepStatement.run(
          id,
          step.stepNumber,
          step.title,
          step.phase,
          step.instruction,
          step.tip || null,
          step.timerSeconds,
          JSON.stringify(step.ingredientsUsed),
        ),
      );

      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }

    return {
      id,
      title: input.title.trim(),
      tagline: input.tagline.trim(),
      description: input.description?.trim() || "",
      category: "",
      difficulty: "easy",
      prepTimeMinutes: input.prepTimeMinutes,
      cookTimeMinutes: input.cookTimeMinutes,
      totalTimeMinutes,
      recommendedServings: input.baseServings,
      imageUrl: input.imageUrl?.trim() || "",
      tags: [],
      status: input.status,
      ingredients,
      steps,
    };
  },

  /**
   * Fetches all recipe summaries for catalog display
   */
  getRecipes(): RecipeSummary[] {
    const db = getDb();
    const rows = db
      .prepare(
        `
      SELECT id, title, tagline, category, difficulty,
             prep_time_minutes, cook_time_minutes, total_time_minutes,
              recommended_servings, image_url, tags_json, status
      FROM recipes
            WHERE status = 'published'
      ORDER BY created_at DESC
    `,
      )
      .all() as unknown as RecipeRow[];

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      tagline: row.tagline,
      category: row.category,
      difficulty: row.difficulty as RecipeDifficulty,
      prepTimeMinutes: row.prep_time_minutes,
      cookTimeMinutes: row.cook_time_minutes,
      totalTimeMinutes: row.total_time_minutes,
      recommendedServings: row.recommended_servings,
      imageUrl: row.image_url,
      tags: JSON.parse(row.tags_json),
      status: row.status as RecipeStatus,
    }));
  },

  /**
   * Fetches full recipe detail including ingredients and steps
   */
  getRecipeById(id: string, includeUnpublished = false): RecipeDetail | null {
    const db = getDb();
    const recipeRow = db
      .prepare(
        `
      SELECT id, title, tagline, description, category, difficulty,
             prep_time_minutes, cook_time_minutes, total_time_minutes,
              recommended_servings, image_url, tags_json, status
      FROM recipes
            WHERE id = ? ${includeUnpublished ? "" : "AND status = 'published'"}
          `,
      )
      .get(id) as unknown as RecipeRow | undefined;

    if (!recipeRow) {
      return null;
    }

    const ingredientRows = db
      .prepare(
        `
      SELECT id, name, amount_per_serving, unit, prep_note, category, is_optional
      FROM recipe_ingredients
      WHERE recipe_id = ?
    `,
      )
      .all(id) as unknown as IngredientRow[];

    const stepRows = db
      .prepare(
        `
      SELECT step_number, title, phase, instruction, tip, timer_seconds, ingredients_json
      FROM recipe_steps
      WHERE recipe_id = ?
      ORDER BY step_number ASC
    `,
      )
      .all(id) as unknown as StepRow[];

    const ingredients: RecipeIngredient[] = ingredientRows.map((row) => ({
      id: row.id,
      name: row.name,
      amountPerServing: row.amount_per_serving,
      unit: row.unit as MetricUnit,
      prepNote: row.prep_note || undefined,
      category: row.category || undefined,
      isOptional: Boolean(row.is_optional),
    }));

    const steps: RecipeStep[] = stepRows.map((row) => ({
      stepNumber: row.step_number,
      title: row.title,
      phase: row.phase as StepPhase,
      instruction: row.instruction,
      tip: row.tip || undefined,
      timerSeconds: row.timer_seconds,
      ingredientsUsed: JSON.parse(row.ingredients_json),
    }));

    return {
      id: recipeRow.id,
      title: recipeRow.title,
      tagline: recipeRow.tagline,
      description: recipeRow.description,
      category: recipeRow.category,
      difficulty: recipeRow.difficulty as RecipeDifficulty,
      prepTimeMinutes: recipeRow.prep_time_minutes,
      cookTimeMinutes: recipeRow.cook_time_minutes,
      totalTimeMinutes: recipeRow.total_time_minutes,
      recommendedServings: recipeRow.recommended_servings,
      imageUrl: recipeRow.image_url,
      tags: JSON.parse(recipeRow.tags_json),
      status: recipeRow.status as RecipeStatus,
      ingredients,
      steps,
    };
  },

  /**
   * Logs anonymous completion telemetry
   */
  recordCompletion(payload: RecipeCompletionPayload): void {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO recipe_completions (
        recipe_id, servings_cooked, total_duration_seconds, completed_at
      ) VALUES (?, ?, ?, ?)
    `);

    stmt.run(
      payload.recipeId,
      payload.servingsCooked,
      payload.totalDurationSeconds || null,
      payload.completedAt,
    );
  },
};
