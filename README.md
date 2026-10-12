# Fogons • Dynamic Kitchen UX

Fogons is a modern, kitchen-first web application designed to solve the real frustration of cooking with digital devices:

- **Zero Blog Overhead:** Eliminates bloated essays, life stories, and ad walls.
- **Dynamic Quantity Scaling:** Automatically multiplies and rounds ingredient amounts based on chosen servings.
- **Glanceable Kitchen Ergonomics:** High-contrast typography readable from 3 feet away.
- **Zero Position Loss:** Users never lose their place or scroll back and forth to check ingredient weights.

---

## 🚀 Running the Next.js Application

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Start the Next.js development server:**

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **(Optional) Preview loading states locally:**

   ```bash
   FOGONS_UI_DELAY=1 pnpm dev
   ```

4. **Configure the private admin area:**
   Copy `.env.example` to `.env.local` and replace both placeholder values before opening `/admin/login`.

---

## 📁 Clean Domain Architecture

```
fogons/
│
├── domain/                         # Pure Business Logic (Framework Agnostic)
│   ├── recipe/
│   │   ├── types.ts                # Domain types (Recipe, Ingredient, Step)
│   │   └── scaling.ts              # Pure math: calculateScaledAmount & formatting
│   └── cooking/
│       └── types.ts                # Session state & timer definitions
│
├── infrastructure/                 # SQLite Persistence & Repositories
│   └── db/
│       └── client.ts               # SQLite client (node:sqlite) & schema migrations
│   └── repositories/
│       └── recipe.repository.ts    # getRecipes(), getRecipeById(id), recordCompletion()
│
├── components/                     # Reusable React UI Components
│   ├── recipe/
│   │   ├── RecipeCard.tsx          # Selection grid recipe cards
│   │   ├── ServingScaler.tsx       # Dynamic portion +/- stepper
│   │   └── RecipeDetailClient.tsx  # Recipe detail & live scaled checklist
│   └── cooking/
│       └── FocusStepper.tsx        # Flagship single-step Focus Stepper experience
│
├── app/                            # Next.js Presentation & Transport
│   ├── page.tsx                    # Recipe Catalog Grid (Server Component)
│   ├── recipes/
│   │   └── [id]/
│   │       ├── page.tsx            # Recipe Detail & Portion Scaler
│   │       └── cook/
│   │           └── page.tsx        # Live Focus Stepper Cooking Mode
│   └── api/
│       └── v1/
│           ├── recipes/
│           │   ├── route.ts        # GET /api/v1/recipes
│           │   └── [id]/
│           │       ├── route.ts    # GET /api/v1/recipes/:id
│           │       └── completions/
│           │           └── route.ts# POST /api/v1/recipes/:id/completions
│
├── data/
│   └── fogons.db                   # SQLite database file
│
├── docs/                           # Architectural Documentation
│   ├── decisions/
│   │   └── 001-ux-focus-stepper.md # ADR 001: Decision record for Focus Stepper
│   ├── api-contract.md             # API & Data Contract Specification
│   └── deployment-pi.md            # First-time Raspberry Pi setup
│
└── deploy/                         # Files copied to the Raspberry Pi
    ├── install.sh
    ├── Dockerfile
    ├── docker-compose.yml
    └── agent/
        ├── server.mjs
        └── fogons-deploy-agent.service
```

---

## 📄 Key Documentation

- [ADR 001: Focus Stepper Decision Record](docs/decisions/001-ux-focus-stepper.md)
- [API & Data Contract Specification](docs/api-contract.md)
- [Raspberry Pi deployment](docs/deployment-pi.md)
