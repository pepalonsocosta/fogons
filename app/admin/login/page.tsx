"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) throw new Error("Login failed");
      router.push("/admin");
      router.refresh();
    } catch {
      setError("La contrasenya no és correcta.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5 py-12">
      <div className="w-full max-w-md rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-7 shadow-[0_14px_40px_rgba(61,48,35,0.08)] sm:p-9">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] font-serif text-xl font-semibold text-white">
            F
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
              Administració
            </p>
            <p className="text-sm text-[var(--ink-muted)]">
              Gestiona les teves receptes
            </p>
          </div>
        </div>
        <h1 className="font-serif text-4xl tracking-[-0.04em] text-[#28251f]">
          Benvingut/da
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">
          Introdueix la contrasenya per accedir a l’espai privat.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block text-sm font-semibold text-[#39352e]">
            Contrasenya
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--background)] px-4 py-3.5 text-base outline-none transition-[border-color,box-shadow] focus:border-[var(--accent)] focus:ring-4 focus:ring-[#c65d3b]/10"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm font-semibold text-[#994444]">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-[var(--accent)] py-4 text-sm font-bold text-white transition-colors hover:bg-[var(--accent-strong)] disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting ? "Comprovant..." : "Entrar a l’administració"}
          </button>
        </form>
      </div>
    </main>
  );
}
