import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import type { RedactResponse } from "@/lib/pii-sentinel-types";

interface SanitizedPreviewProps {
  redaction: RedactResponse;
  /** Original text, when the input was text (enables the side-by-side comparison). */
  originalText?: string;
}

const STRATEGY_LABEL: Record<RedactResponse["strategy"], string> = {
  mask: "Masked",
  replace: "Replaced with labels",
  remove: "Removed",
  custom: "Custom replacement",
};

export function SanitizedPreview({ redaction, originalText }: SanitizedPreviewProps) {
  const isDemo = redaction.mode === "demo";
  const hasComparison = Boolean(redaction.sanitizedText && originalText);
  const [generatedDownloadUrl, setGeneratedDownloadUrl] = useState<string | null>(null);
  const downloadName = redaction.downloadFileName ?? "pii-sentinel-sanitized-copy.txt";

  useEffect(() => {
    if (redaction.downloadUrl || !redaction.sanitizedText) {
      setGeneratedDownloadUrl(null);
      return;
    }

    const url = URL.createObjectURL(
      new Blob([redaction.sanitizedText], { type: "text/plain;charset=utf-8" }),
    );
    setGeneratedDownloadUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [redaction.downloadUrl, redaction.sanitizedText]);

  const downloadHref = redaction.downloadUrl ?? generatedDownloadUrl;

  return (
    <section aria-label="Sanitized preview">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-3">
        <h2 className="font-display text-xl font-bold uppercase tracking-tight">
          Sanitized preview
        </h2>
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          {redaction.processedCount} finding{redaction.processedCount === 1 ? "" : "s"} processed ·{" "}
          {STRATEGY_LABEL[redaction.strategy]}
        </span>
      </div>

      {isDemo ? (
        <p className="mb-3 border border-spicy bg-paper px-3 py-2 font-mono text-xs font-medium uppercase tracking-widest text-spicy">
          Demo data — synthetic sanitized example, not production redaction
        </p>
      ) : null}

      {hasComparison ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="border border-line">
            <p className="border-b border-line bg-paper px-3 py-2 font-mono text-[11px] font-medium uppercase tracking-widest">
              Before — original
            </p>
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap px-3 py-3 font-serif text-sm leading-relaxed">
              {originalText}
            </pre>
          </div>
          <div className="border border-ink">
            <p className="border-b border-line bg-ink px-3 py-2 font-mono text-[11px] font-medium uppercase tracking-widest text-background">
              After — sanitized copy
            </p>
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap px-3 py-3 font-serif text-sm leading-relaxed">
              {redaction.sanitizedText}
            </pre>
          </div>
        </div>
      ) : redaction.sanitizedText ? (
        <div className="border border-ink">
          <p className="border-b border-line bg-ink px-3 py-2 font-mono text-[11px] font-medium uppercase tracking-widest text-background">
            Sanitized copy
          </p>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap px-3 py-3 font-serif text-sm leading-relaxed">
            {redaction.sanitizedText}
          </pre>
        </div>
      ) : (
        <div className="border border-line bg-paper px-4 py-6 text-center">
          <p className="font-serif text-base">
            The backend returned a sanitized file artifact rather than text, so no inline preview is
            shown.
          </p>
        </div>
      )}

      {downloadHref ? (
        <a
          href={downloadHref}
          download={downloadName}
          className="mt-4 inline-flex items-center gap-2 border border-ink px-4 py-2.5 font-mono text-xs font-medium uppercase tracking-widest transition-colors hover:bg-ink hover:text-background"
        >
          <Download aria-hidden className="size-3.5" />
          Download sanitized copy
        </a>
      ) : null}

      <p className="mt-3 font-serif text-sm text-muted-foreground">
        Saved as a new file: <span className="font-mono text-xs">{downloadName}</span> — the
        original input is never overwritten. Results depend on the backend parser and redaction
        implementation; for complex formats, verify the exported file before sharing.
      </p>
    </section>
  );
}
