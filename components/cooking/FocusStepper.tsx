"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RecipeDetail, RecipeStep } from "@/domain/recipe/types";
import { formatIngredientQuantity } from "@/domain/recipe/scaling";

interface FocusStepperProps {
  recipe: RecipeDetail;
  initialServings: number;
}

interface TimerState {
  remaining: number;
  total: number;
  isRunning: boolean;
}

type CompletionStatus = "idle" | "saving" | "failed";

interface WakeLockSentinelLike {
  release: () => Promise<void>;
  addEventListener: (type: "release", listener: () => void) => void;
}

interface WindowWithAudio extends Window {
  webkitAudioContext?: typeof AudioContext;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder < 10 ? "0" : ""}${remainder}`;
}

function createTimers(steps: RecipeStep[]) {
  return steps.reduce<Record<number, TimerState>>((timers, recipeStep) => {
    if (recipeStep.timerSeconds > 0) {
      timers[recipeStep.stepNumber] = {
        total: recipeStep.timerSeconds,
        remaining: recipeStep.timerSeconds,
        isRunning: false,
      };
    }
    return timers;
  }, {});
}

export function FocusStepper({ recipe, initialServings }: FocusStepperProps) {
  const [servings, setServings] = useState(initialServings);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionStatus, setCompletionStatus] =
    useState<CompletionStatus>("idle");
  const [timerJustFinished, setTimerJustFinished] = useState(false);
  const [timers, setTimers] = useState<Record<number, TimerState>>(() =>
    createTimers(recipe.steps),
  );
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  function playTimerChime() {
    try {
      const windowWithAudio = window as WindowWithAudio;
      const AudioContextConstructor =
        window.AudioContext || windowWithAudio.webkitAudioContext;
      if (!AudioContextConstructor) return;

      const context = new AudioContextConstructor();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(587.33, context.currentTime);
      oscillator.frequency.setValueAtTime(880, context.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.8);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.8);
    } catch {
      // Audio may be unavailable until the user interacts with the page.
    }
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`fogons_session_${recipe.id}`);
      if (!saved) return;
      const parsed = JSON.parse(saved) as {
        stepIndex?: unknown;
        servings?: unknown;
      };
      queueMicrotask(() => {
        if (
          typeof parsed.stepIndex === "number" &&
          parsed.stepIndex < recipe.steps.length
        ) {
          setCurrentStepIndex(parsed.stepIndex);
        }
        if (typeof parsed.servings === "number") {
          setServings(parsed.servings);
        }
      });
    } catch {
      // A stale session should never block cooking.
    }
  }, [recipe.id, recipe.steps.length]);

  useEffect(() => {
    localStorage.setItem(
      `fogons_session_${recipe.id}`,
      JSON.stringify({
        stepIndex: currentStepIndex,
        servings,
      }),
    );
  }, [recipe.id, currentStepIndex, servings]);

  useEffect(() => {
    let wakeLockSentinel: WakeLockSentinelLike | null = null;
    const requestWakeLock = async () => {
      if (!("wakeLock" in navigator)) return;
      try {
        wakeLockSentinel = await navigator.wakeLock.request("screen");
        setWakeLockActive(true);
        wakeLockSentinel.addEventListener("release", () =>
          setWakeLockActive(false),
        );
      } catch {
        setWakeLockActive(false);
      }
    };

    void requestWakeLock();
    return () => {
      if (wakeLockSentinel) void wakeLockSentinel.release();
    };
  }, []);

  useEffect(() => {
    timerIntervalRef.current = setInterval(() => {
      setTimers((previous) => {
        let changed = false;
        const nextTimers = { ...previous };
        Object.entries(nextTimers).forEach(([stepNumber, timer]) => {
          if (!timer.isRunning || timer.remaining <= 0) return;
          changed = true;
          const remaining = timer.remaining - 1;
          nextTimers[Number(stepNumber)] = {
            ...timer,
            remaining,
            isRunning: remaining > 0,
          };
          if (remaining === 0) {
            playTimerChime();
            queueMicrotask(() => setTimerJustFinished(true));
          }
        });
        return changed ? nextTimers : previous;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const step = recipe.steps[currentStepIndex];
  const totalSteps = recipe.steps.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const nextStep = recipe.steps[currentStepIndex + 1];
  const currentTimer = timers[step.stepNumber];

  const moveToStep = (index: number) => {
    setCurrentStepIndex(index);
    setTimerJustFinished(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const triggerCompletion = async () => {
    setIsCompleted(true);
    setCompletionStatus("saving");
    localStorage.removeItem(`fogons_session_${recipe.id}`);
    try {
      const response = await fetch(`/api/v1/recipes/${recipe.id}/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          servingsCooked: servings,
          completedAt: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error("Completion request failed");
      setCompletionStatus("idle");
    } catch {
      setCompletionStatus("failed");
    }
  };

  const updateTimer = (
    stepNumber: number,
    update: (timer: TimerState) => TimerState,
  ) => {
    setTimers((previous) => {
      const timer = previous[stepNumber];
      return timer ? { ...previous, [stepNumber]: update(timer) } : previous;
    });
  };

  if (isCompleted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#24231f] px-6 text-center text-white">
        <div className="mb-7 flex h-20 w-20 items-center justify-center rounded-full border border-[#d78b6f] bg-[#c65d3b]/20 text-3xl text-[#f4c0ab]">
          ✓
        </div>
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#e9a487]">
          Recepta completada
        </span>
        <h1 className="mt-3 font-serif text-4xl tracking-[-0.04em]">
          {recipe.title}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/60">
          Has preparat {servings} {servings === 1 ? "ració" : "racions"}.
          Gaudeix del que has cuinat.
        </p>
        <p aria-live="polite" className="mt-4 text-xs text-white/45">
          {completionStatus === "saving" && "Desant la teva recepta..."}
          {completionStatus === "idle" && "Recepta desada."}
          {completionStatus === "failed" &&
            "Desada localment. No hem pogut sincronitzar-la."}
        </p>
        <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:flex-row">
          <Link
            href={`/recipes/${recipe.id}`}
            className="w-full rounded-2xl bg-white/10 py-4 text-center text-sm font-bold text-white/75 transition-colors hover:bg-white/15"
          >
            Revisar recepta
          </Link>
          <Link
            href="/"
            className="w-full rounded-2xl bg-[var(--accent)] py-4 text-center text-sm font-bold text-white shadow-lg shadow-[#c65d3b]/20 transition-colors hover:bg-[#a9482e]"
          >
            Veure receptes
          </Link>
        </div>
        {completionStatus === "failed" && (
          <button
            type="button"
            onClick={() => void triggerCompletion()}
            className="mt-3 text-xs font-bold text-[#e9a487] underline decoration-[#e9a487]/40 underline-offset-4"
          >
            Torna a sincronitzar
          </button>
        )}
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#24231f] pb-32 text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#24231f]/90 px-5 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link
            href={`/recipes/${recipe.id}`}
            className="-ml-2 rounded-xl p-2 text-white/55 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Sortir del mode cuina"
          >
            ×
          </Link>
          <div className="text-center">
            <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#e9a487]">
              Mode cuina
            </span>
            <div className="max-w-[180px] truncate text-xs font-bold text-white sm:max-w-xs">
              {recipe.title}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`hidden rounded-full border px-2.5 py-1 text-[11px] font-medium sm:block ${wakeLockActive ? "border-[#8eb49b]/40 bg-[#8eb49b]/10 text-[#a9ceb3]" : "border-white/10 bg-white/10 text-white/45"}`}
            >
              {wakeLockActive ? "Pantalla activa" : "Pantalla"}
            </span>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-[#e9a487]">
              {servings} racions
            </span>
          </div>
        </div>
        <div className="mx-auto mt-3 flex max-w-3xl gap-1.5">
          {recipe.steps.map((recipeStep, index) => (
            <button
              key={recipeStep.stepNumber}
              type="button"
              onClick={() => moveToStep(index)}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${index === currentStepIndex ? "bg-[#d97857]" : index < currentStepIndex ? "bg-white/40" : "bg-white/10"}`}
              title={`Jump to step ${index + 1}`}
            />
          ))}
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl space-y-6 px-5 py-8 sm:px-8 sm:py-12">
        <div key={step.stepNumber} className="step-transition space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-serif text-5xl font-semibold tracking-[-0.05em] text-[#d97857] sm:text-6xl">
                {String(step.stepNumber).padStart(2, "0")}
              </span>
              <div className="h-9 w-px bg-white/15" />
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
                  {step.phase === "prep"
                    ? "Preparació"
                    : step.phase === "cook"
                      ? "Cocció"
                      : "Acabat"}
                </span>
                <span className="text-xs font-semibold text-white/75">
                  Pas {step.stepNumber} de {totalSteps}
                </span>
              </div>
            </div>
            {step.timerSeconds > 0 && (
              <span className="rounded-full border border-[#d97857]/30 bg-[#c65d3b]/15 px-3 py-1 text-xs font-semibold text-[#e9a487]">
                {Math.round(step.timerSeconds / 60)} min
              </span>
            )}
          </div>

          <h1 className="font-serif text-3xl leading-tight tracking-[-0.03em] text-white sm:text-4xl">
            {step.title}
          </h1>

          {step.ingredientsUsed.length > 0 && (
            <section className="space-y-3 rounded-[22px] border border-white/10 bg-white/[0.06] p-4">
              <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
                Ingredients necessaris ara
              </span>
              <div className="flex flex-wrap gap-2">
                {step.ingredientsUsed.map((usage) => {
                  const ingredient = recipe.ingredients.find(
                    (item) => item.id === usage.ingredientId,
                  );
                  return (
                    <span
                      key={usage.ingredientId}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#d97857]/30 bg-[#c65d3b]/15 px-3 py-1.5 text-xs font-semibold text-[#e9a487] sm:text-sm"
                    >
                      <strong className="text-white">
                        {formatIngredientQuantity(
                          usage.amountPerServing,
                          servings,
                          usage.unit,
                        )}
                      </strong>
                      <span className="text-[#f4c0ab]">
                        {ingredient?.name ?? usage.ingredientId}
                      </span>
                    </span>
                  );
                })}
              </div>
            </section>
          )}

          <div className="rounded-[22px] border border-white/10 bg-white/[0.06] p-6 shadow-md">
            <p className="text-lg leading-relaxed tracking-wide text-white/90 sm:text-xl">
              {step.instruction}
            </p>
          </div>

          {step.tip && (
            <aside className="flex items-start gap-3 rounded-2xl border border-[#e0ae6d]/20 bg-[#e0ae6d]/10 p-4">
              <span className="text-lg text-[#e0ae6d]">✦</span>
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-[#e0ae6d]">
                  Tècnica del xef
                </span>
                <p className="mt-1 text-sm leading-relaxed text-[#f1d4a9]">
                  {step.tip}
                </p>
              </div>
            </aside>
          )}

          {currentTimer && (
            <section
              className={`flex items-center justify-between rounded-[22px] border p-5 shadow-xl transition-[border-color,box-shadow] duration-200 ${currentTimer.isRunning ? "border-[#d97857]/70 bg-[#c65d3b]/10 ring-2 ring-[#c65d3b]/20" : "border-white/10 bg-white/[0.06]"}`}
            >
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
                  Compte enrere
                </span>
                <strong className="text-3xl font-semibold tracking-wider text-white sm:text-4xl">
                  {formatTime(currentTimer.remaining)}
                </strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    updateTimer(step.stepNumber, (timer) => ({
                      ...timer,
                      remaining: timer.total,
                      isRunning: false,
                    }))
                  }
                  className="rounded-xl bg-white/10 p-3 text-white/55 transition-colors hover:bg-white/15 hover:text-white"
                  aria-label="Reiniciar temporitzador"
                >
                  ↺
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateTimer(step.stepNumber, (timer) => ({
                      ...timer,
                      isRunning: !timer.isRunning,
                    }))
                  }
                  className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#c65d3b]/20 transition-colors hover:bg-[#a9482e]"
                >
                  {currentTimer.isRunning
                    ? "Pausa"
                    : currentTimer.remaining === 0
                      ? "Fet"
                      : "Inicia"}
                </button>
              </div>
            </section>
          )}
          {timerJustFinished && (
            <p
              aria-live="polite"
              className="rounded-2xl border border-[#8eb49b]/30 bg-[#8eb49b]/10 px-4 py-3 text-sm font-semibold text-[#a9ceb3]"
            >
              Temporitzador acabat. Continua quan estiguis a punt.
            </p>
          )}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#24231f]/90 p-4 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl space-y-2">
          {!isLastStep && nextStep && (
            <div className="px-2 text-right text-[11px] text-white/55">
              <span className="text-white/35">A continuació:</span>{" "}
              {nextStep.title}
              {nextStep.timerSeconds > 0
                ? ` (${Math.round(nextStep.timerSeconds / 60)} min)`
                : ""}
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => moveToStep(currentStepIndex - 1)}
              disabled={isFirstStep}
              className="flex-1 rounded-2xl bg-white/10 py-4 text-sm font-bold text-white/75 transition-colors hover:bg-white/15 disabled:opacity-30"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() =>
                isLastStep
                  ? void triggerCompletion()
                  : moveToStep(currentStepIndex + 1)
              }
              className="flex-[2] rounded-2xl bg-[var(--accent)] py-4 text-sm font-bold text-white shadow-lg shadow-[#c65d3b]/20 transition-[transform,background-color] duration-150 ease-out hover:bg-[#a9482e] active:scale-[0.98]"
            >
              {isLastStep ? "Acabar recepta" : "Pas següent →"}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
