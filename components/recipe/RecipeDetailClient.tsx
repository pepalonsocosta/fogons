"use client";

import { useState } from "react";
import Link from "next/link";
import { RecipeDetail } from "@/domain/recipe/types";
import { ServingScaler } from "./ServingScaler";
import { formatIngredientQuantity } from "@/domain/recipe/scaling";

interface RecipeDetailClientProps {
  recipe: RecipeDetail;
}

export function RecipeDetailClient({ recipe }: RecipeDetailClientProps) {
  const [servings, setServings] = useState(recipe.recommendedServings);

  return (
    <div className="min-h-screen bg-[var(--background)] pb-32 text-[#28251f]">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--line)] bg-[rgba(245,242,236,0.86)] p-4 backdrop-blur-xl sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[#28251f]"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span>Totes les receptes</span>
        </Link>
        <span className="hidden text-xs font-bold uppercase tracking-[0.15em] text-[var(--ink-muted)] sm:block">
          Detalls de la recepta
        </span>
      </header>

      <div className="relative h-[48vh] min-h-[360px] w-full overflow-hidden bg-[#ded8ce] sm:h-[500px]">
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          style={{ viewTransitionName: `recipe-image-${recipe.id}` }}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#24231f]/95 via-[#24231f]/48 to-[#24231f]/05" />
        <div className="absolute bottom-8 left-5 right-5 mx-auto max-w-6xl space-y-3 sm:bottom-12 sm:px-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-white/80">
            <span>
              {recipe.prepTimeMinutes + recipe.cookTimeMinutes} min en total
            </span>
            <span>
              {recipe.prepTimeMinutes} min de preparació ·{" "}
              {recipe.cookTimeMinutes} min de cocció
            </span>
          </div>
          <h1
            style={{ viewTransitionName: `recipe-title-${recipe.id}` }}
            className="max-w-4xl font-serif text-4xl leading-[0.95] tracking-[-0.04em] text-white sm:text-6xl"
          >
            {recipe.title}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
            {recipe.tagline}
          </p>
        </div>
      </div>

      {/* Main Body */}
      <main className="mx-auto max-w-3xl space-y-12 px-5 py-10 sm:px-8 sm:py-14">
        {/* Dynamic Portion Scaler */}
        <section>
          <ServingScaler servings={servings} onServingsChange={setServings} />
        </section>

        {/* Live Scaled Ingredients Checklist */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                Ingredients necessaris
              </h2>
              <span className="rounded-full bg-[#f5e5d8] px-2.5 py-1 text-[11px] font-semibold text-[var(--accent-strong)]">
                Calculats per a {servings}{" "}
                {servings === 1 ? "ració" : "racions"}
              </span>
            </div>
            <span className="text-xs text-[var(--ink-muted)]">
              {recipe.ingredients.length} ingredients
            </span>
          </div>

          <div className="space-y-2">
            {recipe.ingredients.map((ing) => {
              const formattedQuantity = formatIngredientQuantity(
                ing.amountPerServing,
                servings,
                ing.unit,
              );

              return (
                <div
                  key={ing.id}
                  className="flex items-center justify-between gap-4 border-b border-[var(--line)] py-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                    <div>
                      <span className="text-sm font-medium text-[#39352e]">
                        {ing.name}
                      </span>
                      {ing.prepNote && (
                        <span className="ml-1.5 text-xs italic text-[var(--ink-muted)]">
                          ({ing.prepNote})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      key={`${ing.id}-${formattedQuantity}`}
                      className="quantity-change text-sm font-bold text-[var(--accent-strong)]"
                    >
                      {formattedQuantity}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recipe Steps Overview */}
        <section className="space-y-5 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
              Passos de la recepta
            </h2>
            <span className="text-xs text-[var(--ink-muted)]">
              {recipe.steps.length} passos
            </span>
          </div>

          <div className="space-y-3">
            {recipe.steps.map((step) => (
              <div
                key={step.stepNumber}
                className="flex items-start gap-4 border-b border-[var(--line)] py-4"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface-muted)] font-serif text-sm font-semibold text-[var(--accent-strong)]">
                  {step.stepNumber}
                </span>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[#39352e]">
                      {step.title}
                    </h3>
                    {step.timerSeconds > 0 && (
                      <span className="text-xs text-[var(--ink-muted)]">
                        {Math.round(step.timerSeconds / 60)}m
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-6 text-[var(--ink-muted)]">
                    {step.instruction}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Floating Bottom Kitchen Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--line)] bg-[rgba(255,253,249,0.9)] p-4 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link
            href={`/recipes/${recipe.id}/cook?servings=${servings}`}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] py-4 text-base font-bold text-white shadow-xl shadow-[#c65d3b]/20 transition-[transform,background-color] duration-150 ease-out hover:bg-[var(--accent-strong)] active:scale-[0.98]"
          >
            <span>
              Començar a cuinar ({servings}{" "}
              {servings === 1 ? "ració" : "racions"}) →
            </span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
