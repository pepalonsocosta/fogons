// Domain Types for Recipe & Ingredients

export type MetricUnit =
  | "g" // Grams
  | "kg" // Kilograms
  | "ml" // Milliliters
  | "l" // Liters
  | "tbsp" // Tablespoon (15 ml)
  | "tsp" // Teaspoon (5 ml)
  | "cloves" // Cloves (garlic, etc.)
  | "units" // Whole pieces (eggs, lemons, etc.)
  | "pinch" // Qualitative
  | "to_taste"; // Qualitative

export type RecipeDifficulty = "easy" | "medium" | "hard";

export type RecipeStatus = "draft" | "published";

export type StepPhase = "prep" | "cook" | "finish";

/**
 * Master Ingredient (Pegged to 1 Serving)
 */
export interface RecipeIngredient {
  id: string; // e.g. "chicken-breast"
  name: string; // Display name, e.g. "Chicken Breast"
  amountPerServing: number; // Stored per 1 portion (e.g. 150 for 150g)
  unit: MetricUnit;
  prepNote?: string; // e.g. "halved lengthwise"
  category?: string; // e.g. "Meat", "Produce", "Dairy", "Pantry"
  isOptional?: boolean; // Default: false
}

/**
 * Step Ingredient Usage (Pegged to 1 Serving for this step)
 */
export interface StepIngredientUsage {
  ingredientId: string; // References RecipeIngredient.id
  amountPerServing: number; // Amount consumed in THIS step for 1 portion
  unit: MetricUnit;
  usageNote?: string; // e.g. "use half for searing"
}

/**
 * Atomic Cooking Step for Focus Stepper
 */
export interface RecipeStep {
  stepNumber: number; // 1, 2, 3...
  title: string; // e.g. "Sear the Chicken"
  phase: StepPhase; // 'prep' | 'cook' | 'finish'
  instruction: string; // Actionable instruction text
  tip?: string; // Optional chef tip / internal temperature
  timerSeconds: number; // 0 if no timer, else duration in seconds
  ingredientsUsed: StepIngredientUsage[];
}

/**
 * Recipe Summary (For Catalog Grid)
 */
export interface RecipeSummary {
  id: string; // Slug or UUID
  title: string;
  tagline: string;
  category: string;
  difficulty: RecipeDifficulty;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  totalTimeMinutes: number;
  recommendedServings: number; // Default portions (e.g. 4)
  imageUrl: string;
  tags: string[];
  status?: RecipeStatus;
}

/**
 * Full Recipe Detail (For Preparation & Cooking)
 */
export interface RecipeDetail extends RecipeSummary {
  description?: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}

/**
 * Anonymous Completion Telemetry Payload
 */
export interface RecipeCompletionPayload {
  recipeId: string;
  servingsCooked: number;
  totalDurationSeconds?: number;
  completedAt: string; // ISO-8601 timestamp
  userAgent?: string;
}
