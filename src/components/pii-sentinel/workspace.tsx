import { useState } from "react";
import { AppHeader } from "./app-header";
import { FormatStrip } from "./format-strip";
import { PrivacyNote } from "./privacy-note";
import { InputWorkspace, type InputMode } from "./input-workspace";
import { ScanSummary } from "./scan-summary";
import { FindingsTable } from "./findings-table";
import { RedactionControls } from "./redaction-controls";
import { SanitizedPreview } from "./sanitized-preview";
import {
  BackendNotConnectedError,
  isBackendConnected,
  redactInput,
  scanFile,
  scanText,
} from "@/lib/pii-sentinel-api";
import {
  DEMO_DOWNLOAD_FILE_NAME,
  DEMO_SAMPLE_TEXT,
  applyDemoRedaction,
  buildDemoScanResponse,
} from "@/lib/mock-scan-data";
import type { RedactResponse, RedactionStrategy, ScanResponse } from "@/lib/pii-sentinel-types";

type Status = "idle" | "scanning" | "error" | "ready";

const HOW_IT_WORKS_STEPS = [
  {
    number: "01",
    title: "Provide input",
    body: "Upload a document, paste text, or load the clearly labelled synthetic demo.",
  },
  {
    number: "02",
    title: "Review findings",
    body: "Inspect category, risk, confidence and location, then select what to address. Matches can be false positives.",
  },
  {
    number: "03",
    title: "Redact and export",
    body: "Choose a strategy and download a sanitized copy — the original input is never overwritten.",
  },
] as const;

export function WorkspacePage() {
  const [mode, setMode] = useState<InputMode>("file");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [strategy, setStrategy] = useState<RedactionStrategy>("mask");
  const [replacement, setReplacement] = useState("");
  const [redacting, setRedacting] = useState(false);
  const [redactError, setRedactError] = useState<string | null>(null);
  const [redaction, setRedaction] = useState<RedactResponse | null>(null);

  const backendConnected = isBackendConnected();

  async function startScan() {
    setStatus("scanning");
    setError(null);
    setRedactError(null);
    setRedaction(null);
    setResult(null);
    try {
      let response: ScanResponse;
      if (mode === "demo") {
        response = buildDemoScanResponse();
      } else if (mode === "file") {
        if (!file) throw new Error("Choose a file first.");
        response = await scanFile(file);
      } else {
        response = await scanText(text);
      }
      setResult(response);
      setSelectedIds(new Set());
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong while scanning.");
    }
  }

  function tryDemo() {
    setMode("demo");
    setFile(null);
    setText(DEMO_SAMPLE_TEXT);
    setError(null);
    setRedactError(null);
    setRedaction(null);
    setResult(buildDemoScanResponse());
    setSelectedIds(new Set());
    setStatus("ready");
    document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function toggleFinding(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function setAllSelected(selected: boolean) {
    if (!result) return;
    setSelectedIds(selected ? new Set(result.findings.map((f) => f.id)) : new Set());
  }

  async function runRedaction(redactAll: boolean) {
    if (!result) return;
    const ids = redactAll ? result.findings.map((f) => f.id) : [...selectedIds];
    if (ids.length === 0) return;
    setRedacting(true);
    setRedactError(null);
    try {
      let response: RedactResponse;
      if (result.mode === "demo") {
        const demo = applyDemoRedaction(result.findings, ids, strategy, replacement);
        response = {
          mode: "demo",
          fileType: "demo",
          strategy,
          processedCount: demo.processedCount,
          sanitizedText: demo.sanitizedText,
          downloadFileName: DEMO_DOWNLOAD_FILE_NAME,
        };
        if (result.fileName !== undefined) response.fileName = result.fileName;
      } else if (mode === "file" && file) {
        response = await redactInput({
          file,
          findings: result.findings,
          selectedFindingIds: ids,
          strategy,
          replacement,
        });
      } else {
        response = await redactInput({
          text,
          findings: result.findings,
          selectedFindingIds: ids,
          strategy,
          replacement,
        });
      }
      setRedaction(response);
    } catch (err) {
      setRedactError(err instanceof Error ? err.message : "Redaction failed. Please try again.");
    } finally {
      setRedacting(false);
    }
  }

  const inputLabel =
    mode === "file" ? "Uploaded file" : mode === "text" ? "Pasted text" : "Synthetic demo";

  return (
    <div
      id="top"
      className="min-h-screen bg-background text-foreground"
      suppressHydrationWarning
    >
      <AppHeader demoMode={!backendConnected} />
      <FormatStrip />

      {/* Hero — kept short so the workspace stays the focus */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-6 md:pb-14 md:pt-16">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-spicy">
            Scan before you share.
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
            Know what&apos;s inside before it leaves.
          </h1>
          <p className="mt-4 max-w-xl font-serif text-lg leading-relaxed text-muted-foreground">
            Find personal information in documents, review the risk, and prepare a sanitized copy
            before sharing.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setMode("file");
                document.getElementById("workspace")?.scrollIntoView();
              }}
              className="bg-spicy px-5 py-3 font-mono text-xs font-semibold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-spicy/90"
            >
              Scan a document
            </button>
            <button
              type="button"
              onClick={tryDemo}
              className="border border-ink px-5 py-3 font-mono text-xs font-medium uppercase tracking-widest transition-colors hover:bg-ink hover:text-background"
            >
              Try synthetic demo
            </button>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
        <InputWorkspace
          mode={mode}
          onModeChange={setMode}
          file={file}
          onFileChange={setFile}
          text={text}
          onTextChange={setText}
          onLoadSample={() => setText(DEMO_SAMPLE_TEXT)}
          onScan={startScan}
          scanning={status === "scanning"}
          error={status === "error" ? error : null}
          backendConnected={backendConnected}
          onTryDemo={tryDemo}
        />

        <PrivacyNote />

        {result ? (
          <div className="space-y-10">
            {result.mode === "demo" ? (
              <p className="border border-spicy bg-paper px-4 py-2 font-mono text-xs font-medium uppercase tracking-widest text-spicy">
                Demo data — not a live scan. Synthetic fixtures, not analysis of your input.
              </p>
            ) : null}

            <ScanSummary result={result} inputLabel={inputLabel} />

            <FindingsTable
              findings={result.findings}
              selectedIds={selectedIds}
              onToggle={toggleFinding}
              onSetAll={setAllSelected}
            />

            <RedactionControls
              selectedCount={selectedIds.size}
              totalCount={result.findings.length}
              strategy={strategy}
              onStrategyChange={setStrategy}
              replacement={replacement}
              onReplacementChange={setReplacement}
              onRedactSelected={() => runRedaction(false)}
              onRedactAll={() => runRedaction(true)}
              redacting={redacting}
              error={redactError}
            />

            {redaction ? (
              <SanitizedPreview
                redaction={redaction}
                originalText={mode === "text" ? text : undefined}
              />
            ) : null}
          </div>
        ) : null}
      </main>

      <section id="how-it-works" className="border-t border-line bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <h2 className="font-display text-xl font-bold uppercase tracking-tight">How it works</h2>
          <ol className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            {HOW_IT_WORKS_STEPS.map((step) => (
              <li key={step.number} className="border border-line bg-background px-4 py-4">
                <span className="font-mono text-sm font-medium text-spicy">{step.number}</span>
                <h3 className="mt-1 font-display text-base font-bold uppercase tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-1 font-serif text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
          <p className="mt-6 max-w-3xl font-serif text-sm leading-relaxed text-muted-foreground">
            PII Sentinel assesses potential privacy exposure. It does not determine whether a
            document has been leaked online. Detection is indicative: it may miss data and can
            produce false positives, and a detected pattern does not prove that an identifier is
            real or valid. No personal information is needed to use this page — the sample data is
            synthetic.
          </p>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Live scanning and redaction are handled by the backend, which is not connected yet. No
            provider keys exist in this frontend.
          </p>
        </div>
      </section>
    </div>
  );
}
