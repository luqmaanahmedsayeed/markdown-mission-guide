import { useMemo, useState } from "react";
import { Circle, Eye, EyeOff, TriangleAlert } from "lucide-react";
import type { PiiFinding, RiskLevel } from "@/lib/pii-sentinel-types";

interface FindingsTableProps {
  findings: PiiFinding[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSetAll: (selected: boolean) => void;
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const config = {
    high: { label: "High risk", icon: TriangleAlert, className: "border-spicy text-spicy" },
    medium: {
      label: "Medium risk",
      icon: Circle,
      className: "border-foreground/40 text-foreground",
    },
    low: { label: "Low risk", icon: Circle, className: "border-line text-muted-foreground" },
  } as const;
  const { label, icon: Icon, className } = config[level];
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-widest ${className}`}
    >
      <Icon aria-hidden className="size-3" />
      {label}
    </span>
  );
}

function formatConfidence(confidence: number | undefined): string {
  return typeof confidence === "number" ? `${Math.round(confidence * 100)}%` : "Not provided";
}

function formatLocation(finding: PiiFinding): string {
  const loc = finding.location;
  if (!loc) return "Not provided";
  const parts: string[] = [];
  if (typeof loc.page === "number") parts.push(`p. ${loc.page}`);
  if (typeof loc.row === "number") parts.push(`row ${loc.row}`);
  if (loc.column) parts.push(`col ${loc.column}`);
  if (typeof loc.start === "number" && typeof loc.end === "number")
    parts.push(`chars ${loc.start}–${loc.end}`);
  return parts.length > 0 ? parts.join(" · ") : "Not provided";
}

function FindingRow({
  finding,
  selected,
  onToggle,
}: {
  finding: PiiFinding;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const fullValue = typeof finding.value === "string" ? finding.value : null;

  return (
    <li
      className={`border-b border-line last:border-b-0 ${selected ? "bg-paper" : "bg-background"}`}
    >
      <div className="grid grid-cols-1 gap-x-4 gap-y-2 px-3 py-3 md:grid-cols-[2rem_10rem_minmax(0,1fr)_8rem_6rem_minmax(0,1fr)_2rem] md:items-start">
        {/* Selection */}
        <div className="flex items-center gap-2 md:block">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggle(finding.id)}
            aria-label={`Select ${finding.category} finding`}
            className="size-4 accent-primary"
          />
        </div>

        <Cell label="Category">
          <span className="font-mono text-xs font-medium uppercase tracking-widest">
            {finding.category}
          </span>
        </Cell>

        <Cell label="Matched value">
          <span className="break-all font-mono text-xs">
            {finding.maskedValue ?? "Not provided"}
          </span>
        </Cell>

        <Cell label="Risk">
          <RiskBadge level={finding.riskLevel} />
        </Cell>

        <Cell label="Confidence">
          <span className="font-mono text-xs">{formatConfidence(finding.confidence)}</span>
        </Cell>

        <Cell label="Location">
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            {formatLocation(finding)}
          </span>
        </Cell>

        <div className="md:pt-0.5">
          {fullValue ? (
            <button
              type="button"
              onClick={() => setRevealed((v) => !v)}
              aria-expanded={revealed}
              aria-label={
                revealed
                  ? `Hide full value of ${finding.category} finding`
                  : `Reveal full value of ${finding.category} finding`
              }
              className="text-muted-foreground transition-colors hover:text-spicy"
            >
              {revealed ? (
                <EyeOff aria-hidden className="size-4" />
              ) : (
                <Eye aria-hidden className="size-4" />
              )}
            </button>
          ) : null}
        </div>
      </div>

      {revealed && fullValue ? (
        <p className="border-t border-line bg-background px-3 py-2 pl-11 font-mono text-xs">
          Full value: <span className="break-all">{fullValue}</span>
        </p>
      ) : null}

      {finding.explanation || finding.recommendedAction ? (
        <p className="border-t border-line px-3 py-2 pl-11 font-serif text-sm text-muted-foreground">
          {finding.explanation}
          {finding.recommendedAction ? ` ${finding.recommendedAction}` : ""}
        </p>
      ) : null}
    </li>
  );
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-muted-foreground md:hidden">
        {label}
      </span>
      {children}
    </div>
  );
}

export function FindingsTable({ findings, selectedIds, onToggle, onSetAll }: FindingsTableProps) {
  const [riskFilter, setRiskFilter] = useState<"all" | RiskLevel>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [query, setQuery] = useState("");

  const categories = useMemo(
    () => Array.from(new Set(findings.map((f) => f.category))).sort(),
    [findings],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return findings.filter((f) => {
      if (riskFilter !== "all" && f.riskLevel !== riskFilter) return false;
      if (categoryFilter !== "all" && f.category !== categoryFilter) return false;
      if (q) {
        const haystack =
          `${f.category} ${f.value ?? ""} ${f.maskedValue ?? ""} ${f.explanation ?? ""} ${f.recommendedAction ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [findings, riskFilter, categoryFilter, query]);

  const allVisibleSelected = visible.length > 0 && visible.every((f) => selectedIds.has(f.id));

  return (
    <section aria-label="Findings">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <h2 className="font-display text-xl font-bold uppercase tracking-tight">
          Findings{" "}
          <span className="font-mono text-xs font-normal tracking-widest text-muted-foreground">
            {visible.length}/{findings.length}
          </span>
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search findings…"
            aria-label="Search findings"
            className="w-40 border border-line bg-background px-2 py-1.5 font-mono text-xs placeholder:text-muted-foreground/70"
          />
          <label>
            <span className="sr-only">Filter by risk</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as "all" | RiskLevel)}
              className="border border-line bg-background px-2 py-1.5 font-mono text-xs"
            >
              <option value="all">All risks</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Filter by category</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="max-w-[12rem] border border-line bg-background px-2 py-1.5 font-mono text-xs"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => onSetAll(!allVisibleSelected)}
            className="border border-ink px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-widest transition-colors hover:bg-ink hover:text-background"
          >
            {allVisibleSelected ? "Clear selection" : "Select all"}
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="border border-line bg-paper px-4 py-8 text-center">
          <p className="font-serif text-base">
            No findings match the current filters or no findings were returned.
          </p>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            An empty report does not guarantee the document contains no sensitive information.
          </p>
        </div>
      ) : (
        <ul className="border border-line">
          {visible.map((finding) => (
            <FindingRow
              key={finding.id}
              finding={finding}
              selected={selectedIds.has(finding.id)}
              onToggle={onToggle}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
