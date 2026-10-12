"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { MetricUnit, StepPhase } from "@/domain/recipe/types";

interface IngredientRow {
  name: string;
  amount: string;
  unit: MetricUnit;
  prepNote: string;
  isOptional: boolean;
}

interface StepIngredientRow {
  ingredientIndex: number;
  amount: string;
  unit: MetricUnit;
}

interface StepRow {
  title: string;
  phase: StepPhase;
  instruction: string;
  tip: string;
  timerMinutes: string;
  ingredientsUsed: StepIngredientRow[];
}

const units: Array<{ value: MetricUnit; label: string }> = [
  { value: "g", label: "g" },
  { value: "kg", label: "kg" },
  { value: "ml", label: "ml" },
  { value: "l", label: "l" },
  { value: "tbsp", label: "cullerada" },
  { value: "tsp", label: "culleradeta" },
  { value: "cloves", label: "grans" },
  { value: "units", label: "unitats" },
  { value: "pinch", label: "pessic" },
  { value: "to_taste", label: "al gust" },
];

const blankIngredient = (): IngredientRow => ({
  name: "",
  amount: "",
  unit: "g",
  prepNote: "",
  isOptional: false,
});
const blankStep = (): StepRow => ({
  title: "",
  phase: "prep",
  instruction: "",
  tip: "",
  timerMinutes: "",
  ingredientsUsed: [],
});

export function RecipeEditor() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [baseServings, setBaseServings] = useState("4");
  const [prepTimeMinutes, setPrepTimeMinutes] = useState("");
  const [cookTimeMinutes, setCookTimeMinutes] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ingredients, setIngredients] = useState<IngredientRow[]>([
    blankIngredient(),
  ]);
  const [steps, setSteps] = useState<StepRow[]>([blankStep()]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const updateIngredient = (index: number, update: Partial<IngredientRow>) => {
    setIngredients((current) =>
      current.map((ingredient, ingredientIndex) =>
        ingredientIndex === index ? { ...ingredient, ...update } : ingredient,
      ),
    );
  };

  const updateStep = (index: number, update: Partial<StepRow>) => {
    setSteps((current) =>
      current.map((step, stepIndex) =>
        stepIndex === index ? { ...step, ...update } : step,
      ),
    );
  };

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as {
        url?: string;
        error?: string;
      };
      if (!response.ok || !result.url)
        throw new Error(result.error || "No s’ha pogut pujar la imatge.");
      setImageUrl(result.url);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "No s’ha pogut pujar la imatge.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      const payload = {
        title,
        tagline,
        description,
        baseServings: Number(baseServings),
        prepTimeMinutes: Number(prepTimeMinutes) || 0,
        cookTimeMinutes: Number(cookTimeMinutes) || 0,
        imageUrl,
        status: "draft",
        ingredients: ingredients.map((ingredient) => ({
          ...ingredient,
          amount: Number(ingredient.amount),
        })),
        steps: steps.map((step) => ({
          ...step,
          timerSeconds: (Number(step.timerMinutes) || 0) * 60,
          ingredientsUsed: step.ingredientsUsed.map((usage) => ({
            ...usage,
            amount: Number(usage.amount),
          })),
        })),
      };
      const response = await fetch("/api/admin/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(result.error || "No s’ha pogut desar la recepta.");
      router.push("/admin");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No s’ha pogut desar la recepta.",
      );
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-24">
      <section className="grid gap-5 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-6 sm:grid-cols-2 sm:p-8">
        <div className="sm:col-span-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
            Identitat
          </p>
          <h2 className="mt-2 font-serif text-3xl text-[#28251f]">
            Comencem per la recepta
          </h2>
        </div>
        <Field label="Títol">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            className="admin-input"
            placeholder="Ex. Truita de patates"
          />
        </Field>
        <Field label="Subtítol">
          <input
            value={tagline}
            onChange={(event) => setTagline(event.target.value)}
            required
            className="admin-input"
            placeholder="Una frase curta i apetitosa"
          />
        </Field>
        <Field label="Descripció" wide>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className="admin-input resize-y"
            placeholder="Opcional"
          />
        </Field>
        <Field label="Racions de la recepta">
          <input
            type="number"
            min="1"
            value={baseServings}
            onChange={(event) => setBaseServings(event.target.value)}
            required
            className="admin-input"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Preparació (min)">
            <input
              type="number"
              min="0"
              value={prepTimeMinutes}
              onChange={(event) => setPrepTimeMinutes(event.target.value)}
              className="admin-input"
            />
          </Field>
          <Field label="Cocció (min)">
            <input
              type="number"
              min="0"
              value={cookTimeMinutes}
              onChange={(event) => setCookTimeMinutes(event.target.value)}
              className="admin-input"
            />
          </Field>
        </div>
        <Field label="Imatge" wide>
          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer rounded-xl bg-[var(--surface-muted)] px-4 py-3 text-sm font-bold text-[#39352e] transition-colors hover:bg-[#ded9d0]">
              {isUploading ? "Pujant..." : "Pujar imatge"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageUpload}
                className="sr-only"
              />
            </label>
            {imageUrl && (
              <span className="text-sm text-[var(--success)]">
                Imatge preparada
              </span>
            )}
          </div>
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Previsualització de la recepta"
              className="mt-4 aspect-[16/7] w-full rounded-2xl object-cover"
            />
          )}
        </Field>
      </section>

      <section className="space-y-5 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8">
        <SectionHeading
          eyebrow="Quantitats"
          title="Ingredients"
          action={
            <button
              type="button"
              onClick={() =>
                setIngredients((current) => [...current, blankIngredient()])
              }
              className="admin-secondary-button"
            >
              + Afegir ingredient
            </button>
          }
        />
        <div className="space-y-3">
          {ingredients.map((ingredient, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-2xl bg-[var(--background)] p-4 sm:grid-cols-[1.4fr_0.45fr_0.8fr_1.1fr_auto] sm:items-end"
            >
              <Field label="Ingredient">
                <input
                  value={ingredient.name}
                  onChange={(event) =>
                    updateIngredient(index, { name: event.target.value })
                  }
                  required
                  className="admin-input"
                />
              </Field>
              <Field label="Quantitat">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={ingredient.amount}
                  onChange={(event) =>
                    updateIngredient(index, { amount: event.target.value })
                  }
                  required
                  className="admin-input"
                />
              </Field>
              <Field label="Unitat">
                <select
                  value={ingredient.unit}
                  onChange={(event) =>
                    updateIngredient(index, {
                      unit: event.target.value as MetricUnit,
                    })
                  }
                  className="admin-input"
                >
                  {units.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Nota">
                <input
                  value={ingredient.prepNote}
                  onChange={(event) =>
                    updateIngredient(index, { prepNote: event.target.value })
                  }
                  className="admin-input"
                  placeholder="Opcional"
                />
              </Field>
              <button
                type="button"
                onClick={() =>
                  setIngredients((current) =>
                    current.length > 1
                      ? current.filter(
                          (_, ingredientIndex) => ingredientIndex !== index,
                        )
                      : current,
                  )
                }
                className="admin-icon-button"
                aria-label="Eliminar ingredient"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-5 rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8">
        <SectionHeading
          eyebrow="Execució"
          title="Passos de cuina"
          action={
            <button
              type="button"
              onClick={() => setSteps((current) => [...current, blankStep()])}
              className="admin-secondary-button"
            >
              + Afegir pas
            </button>
          }
        />
        <div className="space-y-5">
          {steps.map((step, index) => (
            <div
              key={index}
              className="space-y-4 rounded-2xl bg-[var(--background)] p-4 sm:p-5"
            >
              <div className="flex items-center justify-between">
                <span className="font-serif text-2xl text-[var(--accent)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSteps((current) =>
                      current.length > 1
                        ? current.filter((_, stepIndex) => stepIndex !== index)
                        : current,
                    )
                  }
                  className="text-xs font-bold text-[var(--ink-muted)] hover:text-[#994444]"
                >
                  Eliminar pas
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1.5fr_0.7fr_0.6fr]">
                <Field label="Títol">
                  <input
                    value={step.title}
                    onChange={(event) =>
                      updateStep(index, { title: event.target.value })
                    }
                    required
                    className="admin-input"
                  />
                </Field>
                <Field label="Fase">
                  <select
                    value={step.phase}
                    onChange={(event) =>
                      updateStep(index, {
                        phase: event.target.value as StepPhase,
                      })
                    }
                    className="admin-input"
                  >
                    <option value="prep">Preparació</option>
                    <option value="cook">Cocció</option>
                    <option value="finish">Acabat</option>
                  </select>
                </Field>
                <Field label="Temporitzador (min)">
                  <input
                    type="number"
                    min="0"
                    value={step.timerMinutes}
                    onChange={(event) =>
                      updateStep(index, { timerMinutes: event.target.value })
                    }
                    className="admin-input"
                  />
                </Field>
              </div>
              <Field label="Instrucció">
                <textarea
                  value={step.instruction}
                  onChange={(event) =>
                    updateStep(index, { instruction: event.target.value })
                  }
                  required
                  rows={4}
                  className="admin-input resize-y"
                />
              </Field>
              <Field label="Consell">
                <input
                  value={step.tip}
                  onChange={(event) =>
                    updateStep(index, { tip: event.target.value })
                  }
                  className="admin-input"
                  placeholder="Opcional"
                />
              </Field>
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                  Ingredients utilitzats en aquest pas
                </p>
                {step.ingredientsUsed.map((usage, usageIndex) => (
                  <div
                    key={usageIndex}
                    className="grid gap-3 sm:grid-cols-[1.5fr_0.5fr_0.8fr_auto]"
                  >
                    <select
                      value={usage.ingredientIndex}
                      onChange={(event) =>
                        updateStep(index, {
                          ingredientsUsed: step.ingredientsUsed.map(
                            (current, currentIndex) =>
                              currentIndex === usageIndex
                                ? {
                                    ...current,
                                    ingredientIndex: Number(event.target.value),
                                  }
                                : current,
                          ),
                        })
                      }
                      className="admin-input"
                    >
                      {ingredients.map((ingredient, ingredientIndex) => (
                        <option key={ingredientIndex} value={ingredientIndex}>
                          {ingredient.name ||
                            `Ingredient ${ingredientIndex + 1}`}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={usage.amount}
                      onChange={(event) =>
                        updateStep(index, {
                          ingredientsUsed: step.ingredientsUsed.map(
                            (current, currentIndex) =>
                              currentIndex === usageIndex
                                ? { ...current, amount: event.target.value }
                                : current,
                          ),
                        })
                      }
                      className="admin-input"
                      placeholder="Quantitat"
                    />
                    <select
                      value={usage.unit}
                      onChange={(event) =>
                        updateStep(index, {
                          ingredientsUsed: step.ingredientsUsed.map(
                            (current, currentIndex) =>
                              currentIndex === usageIndex
                                ? {
                                    ...current,
                                    unit: event.target.value as MetricUnit,
                                  }
                                : current,
                          ),
                        })
                      }
                      className="admin-input"
                    >
                      {units.map((unit) => (
                        <option key={unit.value} value={unit.value}>
                          {unit.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        updateStep(index, {
                          ingredientsUsed: step.ingredientsUsed.filter(
                            (_, currentIndex) => currentIndex !== usageIndex,
                          ),
                        })
                      }
                      className="admin-icon-button"
                      aria-label="Eliminar ingredient del pas"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    updateStep(index, {
                      ingredientsUsed: [
                        ...step.ingredientsUsed,
                        { ingredientIndex: 0, amount: "", unit: "g" },
                      ],
                    })
                  }
                  className="text-sm font-bold text-[var(--accent)]"
                >
                  + Afegir ingredient al pas
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-2xl border border-[#994444]/20 bg-[#f2dcdc] px-4 py-3 text-sm font-semibold text-[#994444]"
        >
          {error}
        </p>
      )}
      <div className="sticky bottom-4 flex justify-end gap-3 rounded-2xl border border-[var(--line)] bg-[rgba(255,253,249,0.9)] p-3 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="admin-secondary-button"
        >
          Cancel·lar
        </button>
        <button
          type="submit"
          disabled={isSaving || isUploading}
          className="admin-primary-button"
        >
          {isSaving ? "Desant..." : "Desar esborrany"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label
      className={`block text-sm font-semibold text-[#39352e] ${wide ? "sm:col-span-2" : ""}`}
    >
      <span className="mb-2 block">{label}</span>
      {children}
    </label>
  );
}

function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
          {eyebrow}
        </p>
        <h2 className="mt-2 font-serif text-3xl text-[#28251f]">{title}</h2>
      </div>
      {action}
    </div>
  );
}
