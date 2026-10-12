export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton-shimmer rounded-xl bg-[var(--surface-muted)] ${className}`}
    />
  );
}

export function CatalogLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="border-b border-[var(--line)] px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="hidden h-4 w-40 sm:block" />
        </div>
      </div>
      <main className="mx-auto max-w-6xl px-5 pb-20 pt-12 sm:px-8 sm:pt-20">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div className="space-y-5">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-24 w-full max-w-2xl" />
          </div>
          <Skeleton className="h-20 w-full max-w-sm lg:justify-self-end" />
        </div>
        <div className="mt-16 sm:mt-20">
          <div className="mb-6 space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-80 max-w-full" />
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <RecipeCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export function RecipeCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-0 shadow-[0_8px_30px_rgba(61,48,35,0.04)]">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-4 p-5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-7 w-4/5" />
        <Skeleton className="h-10 w-full" />
        <div className="border-t border-[var(--line)] pt-4">
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    </div>
  );
}

export function RecipeDetailLoading() {
  return (
    <div className="min-h-screen bg-[var(--background)] pb-32">
      <div className="border-b border-[var(--line)] px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl justify-between">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <Skeleton className="h-[48vh] min-h-[360px] rounded-none sm:h-[500px]" />
      <main className="mx-auto max-w-3xl space-y-12 px-5 py-10 sm:px-8 sm:py-14">
        <Skeleton className="h-36 w-full" />
        <section className="space-y-5">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-24" />
          </div>
          {[0, 1, 2, 3].map((index) => (
            <Skeleton
              key={index}
              className="h-12 w-full rounded-none border-b border-[var(--line)]"
            />
          ))}
        </section>
        <section className="space-y-5">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          {[0, 1, 2].map((index) => (
            <Skeleton
              key={index}
              className="h-16 w-full rounded-none border-b border-[var(--line)]"
            />
          ))}
        </section>
      </main>
    </div>
  );
}

export function CookingLoading() {
  return (
    <div className="min-h-screen bg-[#24231f] pb-32">
      <div className="border-b border-white/10 bg-[#24231f] px-5 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Skeleton className="h-9 w-9 rounded-xl bg-white/10" />
          <Skeleton className="h-8 w-32 bg-white/10" />
          <Skeleton className="h-8 w-20 bg-white/10" />
        </div>
        <Skeleton className="mx-auto mt-3 h-1.5 max-w-3xl bg-white/10" />
      </div>
      <main className="mx-auto max-w-3xl space-y-6 px-5 py-8 sm:px-8 sm:py-12">
        <Skeleton className="h-20 w-full bg-white/10" />
        <Skeleton className="h-12 w-3/4 bg-white/10" />
        <Skeleton className="h-24 w-full bg-white/10" />
        <Skeleton className="h-36 w-full bg-white/10" />
        <Skeleton className="h-24 w-full bg-white/10" />
      </main>
    </div>
  );
}
