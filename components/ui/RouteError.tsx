"use client";

interface RouteErrorProps {
  title: string;
  message: string;
  reset: () => void;
  backHref?: string;
}

export function RouteError({
  title,
  message,
  reset,
  backHref = "/",
}: RouteErrorProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6 py-16 text-center">
      <div className="max-w-md">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f5e5d8] font-serif text-xl text-[var(--accent-strong)]">
          !
        </span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
          Alguna cosa no ha anat bé
        </p>
        <h1 className="mt-3 font-serif text-4xl tracking-[-0.04em] text-[#28251f]">
          {title}
        </h1>
        <p className="mt-4 text-sm leading-6 text-[var(--ink-muted)]">
          {message}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="rounded-2xl bg-[var(--accent)] px-6 py-4 text-sm font-bold text-white transition-colors hover:bg-[var(--accent-strong)]"
          >
            Torna-ho a provar
          </button>
          <a
            href={backHref}
            className="rounded-2xl bg-[var(--surface-muted)] px-6 py-4 text-sm font-bold text-[#39352e] transition-colors hover:bg-[#ded9d0]"
          >
            Torna a les receptes
          </a>
        </div>
      </div>
    </main>
  );
}
