import { MetricUnit, RecipeStatus, StepPhase } from "./types";

export interface AdminIngredientInput {
  name: string;
  amount: number;
  unit: MetricUnit;
  prepNote?: string;
  isOptional?: boolean;
}

export interface AdminStepIngredientInput {
  ingredientIndex: number;
  amount: number;
  unit: MetricUnit;
}

export interface AdminStepInput {
  title: string;
  phase: StepPhase;
  instruction: string;
  tip?: string;
  timerSeconds?: number;
  ingredientsUsed: AdminStepIngredientInput[];
}

export interface AdminRecipeInput {
  title: string;
  tagline: string;
  description?: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  baseServings: number;
  imageUrl?: string;
  status: RecipeStatus;
  ingredients: AdminIngredientInput[];
  steps: AdminStepInput[];
}
