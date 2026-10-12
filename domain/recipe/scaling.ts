import { MetricUnit, RecipeDetail, RecipeIngredient, StepIngredientUsage } from './types';

/**
 * Calculates raw scaled amount given 1-serving base and target servings.
 */
export function calculateScaledAmount(amountPerServing: number, targetServings: number): number {
  if (amountPerServing <= 0) return 0;
  return amountPerServing * targetServings;
}

/**
 * Formats scaled amount into clean, human-friendly culinary string.
 * Handles fractional spoons and clean integer grams/milliliters.
 */
export function formatAmount(amount: number, unit: MetricUnit): string {
  // Qualitative units do not scale numerically
  if (unit === 'pinch' || unit === 'to_taste') {
    return '';
  }

  if (amount === 0) return '0';

  // For weights/volumes >= 100g/ml, round to clean integers
  if (amount >= 100) {
    return Math.round(amount).toString();
  }

  // For intermediate quantities (10 - 99), round to 1 decimal if needed
  if (amount >= 10) {
    const rounded = Math.round(amount * 10) / 10;
    return rounded.toString();
  }

  // For small numbers (< 10), handle common cooking fractions
  const integerPart = Math.floor(amount);
  const fractionPart = Math.round((amount - integerPart) * 100) / 100;

  let fractionStr = '';
  if (fractionPart >= 0.2 && fractionPart <= 0.3) {
    fractionStr = '¼';
  } else if (fractionPart >= 0.31 && fractionPart <= 0.4) {
    fractionStr = '⅓';
  } else if (fractionPart >= 0.45 && fractionPart <= 0.55) {
    fractionStr = '½';
  } else if (fractionPart >= 0.65 && fractionPart <= 0.79) {
    fractionStr = '¾';
  } else if (fractionPart > 0.05 && fractionPart < 0.95) {
    fractionStr = fractionPart.toFixed(1).replace('0.', '.');
  }

  if (integerPart > 0 && fractionStr) {
    return `${integerPart} ${fractionStr}`;
  }
  if (fractionStr) {
    return fractionStr;
  }
  return (Math.round(amount * 10) / 10).toString();
}

/**
 * Convenience formatter that pairs amount and unit
 */
export function formatIngredientQuantity(amountPerServing: number, targetServings: number, unit: MetricUnit): string {
  if (unit === 'pinch') return 'Pinch';
  if (unit === 'to_taste') return 'To taste';
  const scaled = calculateScaledAmount(amountPerServing, targetServings);
  const formatted = formatAmount(scaled, unit);
  return `${formatted} ${unit}`.trim();
}

/**
 * Pure function to project a full RecipeDetail with pre-calculated amounts
 */
export function scaleRecipe(recipe: RecipeDetail, targetServings: number): RecipeDetail {
  const scaledIngredients: RecipeIngredient[] = recipe.ingredients.map(ing => ({
    ...ing,
    amountPerServing: ing.amountPerServing // Base stays untouched
  }));

  return {
    ...recipe,
    recommendedServings: targetServings,
    ingredients: scaledIngredients
  };
}
