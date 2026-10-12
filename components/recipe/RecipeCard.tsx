import Link from "next/link";
import { RecipeSummary } from "@/domain/recipe/types";

interface RecipeCardProps {
  recipe: RecipeSummary;
  index?: number;
}

export function RecipeCard({ recipe, index = 0 }: RecipeCardProps) {
  return (
    <Link
      href={`/recipes/${recipe.id}`}
      style={{ animationDelay: `${Math.min(index, 5) * 55}ms` }}
      className="recipe-card page-reveal group flex flex-col overflow-hidden rounded-[22px] border border-[var(--line)] bg-[var(--surface)] shadow-[0_8px_30px_rgba(61,48,35,0.06)] transition-[transform,box-shadow] duration-200 ease-out"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#ded8ce]">
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          style={{ viewTransitionName: `recipe-image-${recipe.id}` }}
          className="recipe-card__image h-full w-full object-cover transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5" />
        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#39352e] backdrop-blur-md">
          <span>{recipe.totalTimeMinutes} min</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-6 p-5">
        <div>
          <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            <span>{recipe.category}</span>
          </div>
          <h2
            style={{ viewTransitionName: `recipe-title-${recipe.id}` }}
            className="font-serif text-2xl leading-tight tracking-[-0.025em] text-[#28251f]"
          >
            {recipe.title}
          </h2>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--ink-muted)]">
            {recipe.tagline}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--line)] pt-4 text-sm">
          <span className="text-[var(--ink-muted)]">
            Per a {recipe.recommendedServings}
          </span>
          <div className="flex items-center gap-2 font-semibold text-[var(--accent)]">
            <span>Veure recepta</span>
            <span
              className="recipe-card__arrow transition-transform duration-200 ease-out"
              aria-hidden="true"
            >
              →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
