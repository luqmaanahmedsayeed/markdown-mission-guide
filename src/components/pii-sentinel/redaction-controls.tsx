import { useState } from "react";
import type { RedactionStrategy } from "@/lib/pii-sentinel-types";

interface RedactionControlsProps {
  selectedCount: number;
  totalCount: number;
  strategy: RedactionStrategy;
  onStrategyChange: (strategy: RedactionStrategy) => void;
  replacement: string;
  onReplacementChange: (replacement: string) => void;
  onRedactSelected: () => void;
  onRedactAll: () => void;
  redacting: boolean;
  error: string | null;
}

const STRATEGIES = [
  { id: "mask" as const, label: "Mask", hint: "Partially hide the value (e.g. •••• 4321)." },
  {
    id: "replace" as const,
    label: "Replace",
    hint: "Substitute a label such as [EMAIL] or [PHONE].",
  },
  { id: "remove" as const, label: "Remove", hint: "Delete the selected matched text." },
  { id: "custom" as const, label: "Custom replacement", hint: "Substitute your own placeholder." },
] as const;

export function RedactionControls(props: RedactionControlsProps) {
  const {
    selectedCount,
    totalCount,
    strategy,
    onStrategyChange,
    replacement,
    onReplacementChange,
    onRedactSelected,
    onRedactAll,
    redacting,
    error,
  } = props;

  const [confirmedAll, setConfirmedAll] = useState(false);

  return (
    <section aria-label="Redaction controls">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-3">
        <h2 className="font-display text-xl font-bold uppercase tracking-tight">Redaction</h2>
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          {selectedCount} of {totalCount} findings selected · original input is never overwritten
        </span>
      </div>

      <fieldset className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <legend className="sr-only">Redaction strategy</legend>
        {STRATEGIES.map((s) => (
          <label
            key={s.id}
            className={`flex cursor-pointer flex-col gap-1 border px-3 py-3 transition-colors ${
              strategy === s.id
                ? "border-spicy bg-paper"
                : "border-line bg-background hover:border-ink"
            }`}
          >
            <span className="flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-widest">
              <input
                type="radio"
                name="redaction-strategy"
                value={s.id}
                checked={strategy === s.id}
                onChange={() => onStrategyChange(s.id)}
                className="size-3.5 accent-primary"
              />
              {s.label}
            </span>
            <span className="font-serif text-sm text-muted-foreground">{s.hint}</span>
          </label>
        ))}
      </fieldset>

      {strategy === "custom" ? (
        <div className="mt-3">
          <label
            htmlFor="custom-replacement"
            className="mb-1 block font-mono text-xs font-medium uppercase tracking-widest"
          >
            Custom placeholder
          </label>
          <input
            id="custom-replacement"
            type="text"
            value={replacement}
            onChange={(e) => onReplacementChange(e.target.value)}
            placeholder="e.g. [REMOVED — REVIEW]"
            className="w-72 max-w-full border border-line bg-background px-3 py-2 font-mono text-xs"
          />
        </div>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-3 border border-spicy bg-paper px-3 py-2 font-mono text-xs text-spicy"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onRedactSelected}
          disabled={redacting || selectedCount === 0}
          className="inline-flex items-center bg-spicy px-5 py-3 font-mono text-xs font-semibold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-spicy/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {redacting ? "Redacting…" : `Redact selected (${selectedCount})`}
        </button>

        {confirmedAll ? (
          <span className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onRedactAll();
                setConfirmedAll(false);
              }}
              disabled={redacting || totalCount === 0}
              className="border border-spicy px-4 py-3 font-mono text-xs font-semibold uppercase tracking-widest text-spicy transition-colors hover:bg-spicy hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              Yes — redact all {totalCount}
            </button>
            <button
              type="button"
              onClick={() => setConfirmedAll(false)}
              className="border border-line px-3 py-3 font-mono text-xs uppercase tracking-widest transition-colors hover:border-ink"
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmedAll(true)}
            disabled={redacting || totalCount === 0}
            className="border border-ink px-4 py-3 font-mono text-xs font-medium uppercase tracking-widest transition-colors hover:bg-ink hover:text-background disabled:cursor-not-allowed disabled:opacity-40"
          >
            Redact all findings
          </button>
        )}
      </div>
    </section>
  );
}
