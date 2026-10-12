import { recipeRepository } from "@/infrastructure/repositories/recipe.repository";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { waitForUiTestDelay } from "@/infrastructure/ui/test-delay";

export default async function HomePage() {
  await waitForUiTestDelay();
  const recipes = recipeRepository.getRecipes();

  return (
    <div className="min-h-screen flex flex-col">
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-20 pt-16 sm:px-8 sm:pt-24">
        <section className="page-reveal grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <h1 className="max-w-3xl font-serif text-5xl leading-[0.98] tracking-[-0.045em] text-[#28251f] sm:text-7xl">
              Cuina de casa per a{" "}
              <em className="text-[var(--accent)]">cada dia.</em>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[var(--ink-muted)] sm:text-lg">
              Ingredients clars, racions exactes i passos que t&apos;acompanyen.
            </p>
          </div>
        </section>

        <section className="page-reveal stagger-1 mt-16 sm:mt-20">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ink-muted)]">
                La col·lecció
              </p>
              <h2 className="mt-2 font-serif text-3xl tracking-[-0.03em]">
                Què et ve de gust?
              </h2>
            </div>
            <span className="hidden text-sm text-[var(--ink-muted)] sm:block">
              Tria una recepta per començar
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {recipes.length > 0 ? (
              recipes.map((recipe, index) => (
                <RecipeCard key={recipe.id} recipe={recipe} index={index} />
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-[var(--line)] bg-[var(--surface)] px-6 py-12 text-center md:col-span-2 lg:col-span-3">
                <p className="font-serif text-2xl text-[#28251f]">
                  La col·lecció descansa.
                </p>
                <p className="mt-2 text-sm text-[var(--ink-muted)]">
                  Ara mateix no hi ha receptes disponibles. Torna aviat.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--line)] px-5 py-7 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between text-xs text-[var(--ink-muted)]">
          <span>Fogons</span>
          <span>Cuina amb concentració.</span>
        </div>
      </footer>
    </div>
  );
}
