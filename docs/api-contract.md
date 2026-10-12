# Fogons • API & Data Contract Specification (Draft v2)

> **Status:** Iterative Working Draft  
> **Framework:** Next.js (Full-stack: App Router, TypeScript, React Server Components / API Routes)  
> **Last Updated:** 2026-10-11

---

## 1. Architectural Decisions Incorporated

1. **Strict Metric & Celsius Only:**
   No Imperial conversions or mixed unit tables in MVP. All temperatures in °C; all weights in grams/kilograms; liquids in milliliters/liters; standard metric spoons (15ml tbsp, 5ml tsp); discrete item counts (units, cloves); qualitative measures (pinch, to_taste).
2. **Client-Side Session + Completion Telemetry:**
   Active cooking session state (step index, running timers) is held entirely in browser `localStorage`. No user authentication required. When a recipe is finished, a lightweight completion event is emitted to the backend for anonymous cooking telemetry.
3. **Normalized "Per Serving" Storage Model:**
   Ingredient quantities are normalized and stored pegged to **1 serving** (`amountPerServing`). The recipe stores a `recommendedServings` integer.
   * **Scaling Calculation:** The frontend calculates amounts in memory whenever the user selects/adjusts target servings:
     $$\text{displayAmount} = \text{amountPerServing} \times \text{targetServings}$$
4. **Step-Level Context:**
   Each step explicitly references its required ingredients with `amountPerServing` for that specific step, enabling the Focus Stepper to display only the relevant ingredients.

---

## 2. TypeScript Data Types (Client / API DTO)

```typescript
// Strictly Metric Units + Discrete Counts + Qualitative
export type MetricUnit =
  | 'g'          // Grams
  | 'kg'         // Kilograms
  | 'ml'         // Milliliters
  | 'l'          // Liters
  | 'tbsp'       // Tablespoon (15 ml)
  | 'tsp'        // Teaspoon (5 ml)
  | 'cloves'     // Cloves (e.g. garlic)
  | 'units'      // Whole pieces (e.g. eggs, lemons)
  | 'pinch'      // Qualitative
  | 'to_taste';  // Qualitative

export type RecipeDifficulty = 'easy' | 'medium' | 'hard';

// Simplified phases (Prep vs Cook)
export type StepPhase = 'prep' | 'cook' | 'finish';

/**
 * Master Ingredient (Pegged to 1 Serving)
 */
export interface RecipeIngredient {
  id: string;               // e.g. "chicken-breast"
  name: string;             // Display name, e.g. "Chicken Breast"
  amountPerServing: number; // Stored per 1 portion (e.g. 150 for 150g)
  unit: MetricUnit;
  prepNote?: string;        // e.g. "minced", "diced", "room temp"
  category?: string;        // e.g. "Meat", "Produce", "Dairy", "Pantry"
  isOptional?: boolean;     // Default: false
}

/**
 * Step Ingredient Usage (Pegged to 1 Serving for this step)
 */
export interface StepIngredientUsage {
  ingredientId: string;     // References RecipeIngredient.id
  amountPerServing: number; // Amount consumed in THIS step for 1 portion
  unit: MetricUnit;
  usageNote?: string;       // e.g. "use half for searing"
}

/**
 * Atomic Cooking Step for Focus Stepper
 */
export interface RecipeStep {
  stepNumber: number;       // 1, 2, 3...
  title: string;            // e.g. "Sear the Chicken"
  phase: StepPhase;         // 'prep' | 'cook' | 'finish'
  instruction: string;      // Actionable instruction text
  tip?: string;             // Optional chef tip / internal temperature
  timerSeconds: number;     // 0 if no timer, else duration in seconds
  ingredientsUsed: StepIngredientUsage[];
}

/**
 * Recipe Summary (For Catalog Grid)
 */
export interface RecipeSummary {
  id: string;               // Slug or UUID
  title: string;
  tagline: string;
  category: string;
  difficulty: RecipeDifficulty;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  totalTimeMinutes: number;
  recommendedServings: number; // e.g. 4
  imageUrl: string;
  tags: string[];
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
  completedAt: string;     // ISO-8601 timestamp
  userAgent?: string;
}
```

---

## 3. API Endpoints (Next.js Route Handlers)

### 3.1 `GET /api/v1/recipes`
Returns catalog of recipe summaries for the main grid.

* **Response Status:** `200 OK`
* **Response Body:**
```json
{
  "success": true,
  "data": [
    {
      "id": "tuscan-garlic-chicken",
      "title": "Creamy Tuscan Garlic Chicken",
      "tagline": "Golden pan-seared chicken in a sun-dried tomato and parmesan cream sauce.",
      "category": "Dinner",
      "difficulty": "medium",
      "prepTimeMinutes": 15,
      "cookTimeMinutes": 20,
      "totalTimeMinutes": 35,
      "recommendedServings": 4,
      "imageUrl": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80",
      "tags": ["Stovetop", "High Protein"]
    }
  ]
}
```

---

### 3.2 `GET /api/v1/recipes/:id`
Returns full recipe definition with ingredients and steps (all pegged to 1 serving).

* **Response Status:** `200 OK`
* **Response Body Example:**
```json
{
  "success": true,
  "data": {
    "id": "tuscan-garlic-chicken",
    "title": "Creamy Tuscan Garlic Chicken",
    "tagline": "Golden pan-seared chicken in a sun-dried tomato and parmesan cream sauce.",
    "category": "Dinner",
    "difficulty": "medium",
    "prepTimeMinutes": 15,
    "cookTimeMinutes": 20,
    "totalTimeMinutes": 35,
    "recommendedServings": 4,
    "imageUrl": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80",
    "tags": ["Stovetop", "High Protein"],
    "ingredients": [
      {
        "id": "chicken-breast",
        "name": "Chicken Breasts",
        "amountPerServing": 150,
        "unit": "g",
        "prepNote": "halved lengthwise",
        "category": "Meat"
      },
      {
        "id": "olive-oil",
        "name": "Olive Oil",
        "amountPerServing": 0.5,
        "unit": "tbsp",
        "prepNote": "divided",
        "category": "Pantry"
      },
      {
        "id": "heavy-cream",
        "name": "Heavy Cream",
        "amountPerServing": 60,
        "unit": "ml",
        "category": "Dairy"
      }
    ],
    "steps": [
      {
        "stepNumber": 1,
        "title": "Season & Prep Chicken",
        "phase": "prep",
        "instruction": "Pat the chicken dry with paper towels. Season both sides with Italian seasoning, salt, and black pepper.",
        "tip": "Drying the meat ensures a golden, crispy crust.",
        "timerSeconds": 0,
        "ingredientsUsed": [
          {
            "ingredientId": "chicken-breast",
            "amountPerServing": 150,
            "unit": "g"
          }
        ]
      },
      {
        "stepNumber": 2,
        "title": "Sear the Chicken",
        "phase": "cook",
        "instruction": "Heat olive oil and butter in a large skillet over medium-high heat. Add chicken and sear undisturbed until deep golden on both sides.",
        "tip": "Internal target temperature: 74°C.",
        "timerSeconds": 360,
        "ingredientsUsed": [
          {
            "ingredientId": "olive-oil",
            "amountPerServing": 0.5,
            "unit": "tbsp"
          },
          {
            "ingredientId": "chicken-breast",
            "amountPerServing": 150,
            "unit": "g"
          }
        ]
      }
    ]
  }
}
```

---

### 3.3 `POST /api/v1/recipes/:id/completions`
Emits an anonymous telemetry record when a user finishes cooking a recipe.

* **Request Body:**
```json
{
  "servingsCooked": 4,
  "totalDurationSeconds": 1850,
  "completedAt": "2026-10-11T18:00:00Z"
}
```
* **Response Status:** `201 Created`
* **Response Body:**
```json
{
  "success": true,
  "message": "Completion logged"
}
```

---

## 4. Implementation Notes

1. **Database Persistence Strategy:**
   * Intentionally deferred until the persistence layer implementation phase. The API contract defines the external DTO schema, leaving the choice between Normalized Relational (Postgres/SQLite) vs Document/JSONB (Postgres JSONB/Prisma) to be decided when setting up the database.
2. **Frontend Rounding:**
   * Clean fractional rounding ($1$, $0.5$, $0.25$) is applied by the client display formatter when multiplying `amountPerServing * targetServings`.
