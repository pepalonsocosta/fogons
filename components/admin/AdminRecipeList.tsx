"use client";

import { useState } from "react";
import Link from "next/link";
import { RecipeSummary } from "@/domain/recipe/types";

interface AdminRecipeListProps {
  recipes: RecipeSummary[];
}

export function AdminRecipeList({
  recipes: initialRecipes,
}: AdminRecipeListProps) {
  const [recipes, setRecipes] = useState(initialRecipes);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function toggleStatus(recipe: RecipeSummary) {
    const status = recipe.status === "published" ? "draft" : "published";
    setUpdatingId(recipe.id);
    try {
      const response = await fetch(`/api/admin/recipes/${recipe.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Status update failed");
      setRecipes((current) =>
        current.map((item) =>
          item.id === recipe.id ? { ...item, status } : item,
        ),
      );
    } finally {
      setUpdatingId(null);
    }
  }

  if (recipes.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-[var(--line)] bg-[var(--surface)] px-6 py-16 text-center">
        <p className="font-serif text-2xl text-[#28251f]">
          Encara no hi ha receptes.
        </p>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Crea la primera recepta des de l’editor.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {recipes.map((recipe) => (
        <article
          key={recipe.id}
          className="flex flex-col gap-5 rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_8px_30px_rgba(61,48,35,0.04)] sm:flex-row sm:items-center"
        >
          <div className="flex min-w-0 flex-1 items-center gap-4">
            {recipe.imageUrl ? (
              <img
                src={recipe.imageUrl}
                alt=""
                className="h-20 w-24 rounded-xl object-cover"
              />
            ) : (
              <div className="h-20 w-24 rounded-xl bg-[var(--surface-muted)]" />
            )}
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${recipe.status === "published" ? "bg-[#e2eee4] text-[#41644c]" : "bg-[#f5e5d8] text-[#9b4f32]"}`}
                >
                  {recipe.status === "published" ? "Publicada" : "Esborrany"}
                </span>
                <span className="text-xs text-[var(--ink-muted)]">
                  {recipe.recommendedServings} racions
                </span>
              </div>
              <h2 className="truncate font-serif text-2xl text-[#28251f]">
                {recipe.title}
              </h2>
              <p className="mt-1 truncate text-sm text-[var(--ink-muted)]">
                {recipe.tagline}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/admin/recipes/${recipe.id}/preview`}
              target="_blank"
              className="admin-secondary-button"
            >
              Previsualitzar
            </Link>
            <button
              type="button"
              onClick={() => void toggleStatus(recipe)}
              disabled={updatingId === recipe.id}
              className="admin-primary-button"
            >
              {updatingId === recipe.id
                ? "..."
                : recipe.status === "published"
                  ? "Passar a esborrany"
                  : "Publicar"}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
