import Link from "next/link";
import { requireAdminSession } from "@/infrastructure/auth/admin-auth";
import { recipeRepository } from "@/infrastructure/repositories/recipe.repository";
import { AdminRecipeList } from "@/components/admin/AdminRecipeList";
import { DeployButton } from "@/components/admin/DeployButton";

export default async function AdminPage() {
  await requireAdminSession();
  const recipes = recipeRepository.getAdminRecipes();

  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-6 border-b border-[var(--line)] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
              Administració
            </p>
            <h1 className="mt-2 font-serif text-4xl tracking-[-0.04em] text-[#28251f]">
              Les teves receptes
            </h1>
          </div>
          <div className="flex flex-wrap items-start gap-3">
            <DeployButton />
            <Link
              href="/admin/recipes/new"
              className="shrink-0 rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--accent-strong)]"
            >
              Nova recepta
            </Link>
          </div>
        </header>
        <section className="mt-10">
          <AdminRecipeList recipes={recipes} />
        </section>
      </div>
    </main>
  );
}
