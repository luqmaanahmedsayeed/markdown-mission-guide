import { Circle, TriangleAlert } from "lucide-react";
import type { ScanResponse } from "@/lib/pii-sentinel-types";

interface ScanSummaryProps {
  result: ScanResponse;
  inputLabel: string;
}

function Count({ level, value }: { level: "high" | "medium" | "low"; value: number }) {
  const labels = { high: "High risk", medium: "Medium risk", low: "Low risk" } as const;
  const icons = {
    high: <TriangleAlert aria-hidden className="size-3.5 text-spicy" />,
    medium: <Circle aria-hidden className="size-3.5 fill-foreground/30 text-foreground" />,
    low: <Circle aria-hidden className="size-3.5 text-muted-foreground" />,
  } as const;
  return (
    <div className="flex items-center gap-2 border border-line bg-background px-3 py-2.5">
      {icons[level]}
      <span className="font-display text-2xl font-bold leading-none">{value}</span>
      <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        {labels[level]}
      </span>
    </div>
  );
}

export function ScanSummary({ result, inputLabel }: ScanSummaryProps) {
  return (
    <section aria-label="Scan summary">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-3">
        <h2 className="font-display text-xl font-bold uppercase tracking-tight">Scan summary</h2>
        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          <span className="max-w-[16rem] truncate" title={result.fileName ?? inputLabel}>
            {result.fileName ?? inputLabel}
          </span>
          <span>
            Status:{" "}
            <span className={result.mode === "demo" ? "text-spicy" : "text-foreground"}>
              {result.mode === "demo" ? "Demo fixtures" : "Live scan"}
            </span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-2 border border-ink bg-ink px-3 py-2.5 text-background">
          <span className="font-display text-2xl font-bold leading-none">
            {result.totalFindings}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-widest opacity-80">
            Total findings
          </span>
        </div>
        <Count level="high" value={result.riskSummary.high} />
        <Count level="medium" value={result.riskSummary.medium} />
        <Count level="low" value={result.riskSummary.low} />
      </div>

      <p className="mt-3 border-l-2 border-spicy bg-paper px-3 py-2 font-serif text-sm text-ink">
        Review findings before redacting. Matches can be false positives.
      </p>
    </section>
  );
}
