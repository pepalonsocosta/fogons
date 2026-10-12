"use client";

interface ServingScalerProps {
  servings: number;
  onServingsChange: (newServings: number) => void;
}

export function ServingScaler({
  servings,
  onServingsChange,
}: ServingScalerProps) {
  const handleDelta = (delta: number) => {
    const next = servings + delta;
    if (next >= 1 && next <= 24) {
      onServingsChange(next);
    }
  };

  return (
    <div className="space-y-5 rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_8px_30px_rgba(61,48,35,0.05)] sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
            Planifica les racions
          </span>
          <h3 className="mt-1 text-base font-semibold text-[#28251f]">
            Per a quantes persones cuines?
          </h3>
        </div>
      </div>

      {/* Stepper Buttons */}
      <div className="flex items-center justify-between rounded-2xl bg-[var(--surface-muted)] p-2">
        <button
          type="button"
          onClick={() => handleDelta(-1)}
          disabled={servings <= 1}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--surface)] text-2xl font-light text-[#28251f] shadow-sm transition-[transform,background-color] duration-150 ease-out hover:bg-white active:scale-95 disabled:opacity-30"
          aria-label="Decrease portions"
        >
          –
        </button>

        <div className="text-center">
          <span
            key={servings}
            className="quantity-change font-serif text-4xl font-semibold tracking-[-0.04em] text-[#28251f]"
          >
            {servings}
          </span>
          <span className="block text-xs font-medium text-[var(--ink-muted)]">
            {servings === 1 ? "ració" : "racions"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleDelta(1)}
          disabled={servings >= 24}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent)] text-2xl font-light text-white shadow-md shadow-[#c65d3b]/20 transition-[transform,background-color] duration-150 ease-out hover:bg-[var(--accent-strong)] active:scale-95 disabled:opacity-30"
          aria-label="Increase portions"
        >
          +
        </button>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap justify-center gap-2 pt-1">
        {[2, 4, 6, 8].map((qty) => (
          <button
            key={qty}
            type="button"
            onClick={() => onServingsChange(qty)}
            className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
              servings === qty
                ? "bg-[#f5e5d8] text-[var(--accent-strong)]"
                : "bg-[var(--surface-muted)] text-[var(--ink-muted)] hover:bg-[#ded9d0]"
            }`}
          >
            {qty} {qty === 1 ? "ració" : "racions"}
          </button>
        ))}
      </div>
    </div>
  );
}
