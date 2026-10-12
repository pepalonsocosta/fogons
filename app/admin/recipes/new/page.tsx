import Link from "next/link";
import { requireAdminSession } from "@/infrastructure/auth/admin-auth";
import { RecipeEditor } from "@/components/admin/RecipeEditor";

export default async function NewRecipePage() {
  await requireAdminSession();

  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/admin"
              className="text-sm font-semibold text-[var(--ink-muted)] hover:text-[#28251f]"
            >
              ← Tornar a receptes
            </Link>
            <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
              Nova recepta
            </p>
            <h1 className="mt-2 font-serif text-4xl tracking-[-0.04em] text-[#28251f]">
              Construeix-la al teu ritme
            </h1>
          </div>
        </header>
        <RecipeEditor />
      </div>
    </main>
  );
}
