import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { ClipboardType, FileUp, FlaskConical, Loader2, X } from "lucide-react";
import {
  MAX_FILE_BYTES,
  SUPPORTED_EXTENSIONS,
  getFileExtension,
  isSupportedFile,
} from "@/lib/pii-sentinel-types";

export type InputMode = "file" | "text" | "demo";

interface InputWorkspaceProps {
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
  file: File | null;
  onFileChange: (file: File | null) => void;
  text: string;
  onTextChange: (text: string) => void;
  onLoadSample: () => void;
  onScan: () => void;
  scanning: boolean;
  error: string | null;
  backendConnected: boolean;
  onTryDemo: () => void;
}

const MODES = [
  {
    id: "file" as const,
    label: "Upload file",
    icon: FileUp,
    hint: "Drop a document or browse. Authoritative validation happens on the backend.",
  },
  {
    id: "text" as const,
    label: "Paste text",
    icon: ClipboardType,
    hint: "Paste the text you plan to share. Nothing is sent anywhere from this page until a backend is connected.",
  },
  {
    id: "demo" as const,
    label: "Synthetic demo",
    icon: FlaskConical,
    hint: "Loads a pre-written fictional example showing multiple finding types.",
  },
];

const EXTENSION_LABEL = SUPPORTED_EXTENSIONS.map((ext) => `.${ext}`).join(", ");

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function InputWorkspace(props: InputWorkspaceProps) {
  const {
    mode,
    onModeChange,
    file,
    onFileChange,
    text,
    onTextChange,
    onLoadSample,
    onScan,
    scanning,
    error,
    backendConnected,
    onTryDemo,
  } = props;

  const [fileError, setFileError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function acceptFile(candidate: File | undefined) {
    if (!candidate) return;
    if (!isSupportedFile(candidate.name)) {
      const ext = getFileExtension(candidate.name);
      setFileError(
        ext
          ? `Unsupported file type (.${ext}). Supported: ${EXTENSION_LABEL}`
          : `Unsupported file type. Supported: ${EXTENSION_LABEL}`,
      );
      return;
    }
    if (candidate.size > MAX_FILE_BYTES) {
      setFileError("File is larger than 15 MB. Choose a smaller file.");
      return;
    }
    setFileError(null);
    onFileChange(candidate);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    acceptFile(event.dataTransfer.files?.[0]);
  }

  function onFileInput(event: ChangeEvent<HTMLInputElement>) {
    acceptFile(event.target.files?.[0]);
    event.target.value = "";
  }

  const canScan =
    !scanning &&
    (mode === "demo" ||
      (mode === "file" && file !== null) ||
      (mode === "text" && text.trim().length > 0));

  const activeMode = MODES.find((m) => m.id === mode);
  const notConnectedError = error !== null && !backendConnected;

  return (
    <section id="workspace" aria-label="Input workspace" className="scroll-mt-20">
      <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-line pb-3">
        <h2 className="font-display text-xl font-bold uppercase tracking-tight">Input</h2>
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          {activeMode?.hint}
        </span>
      </div>

      {/* Mode switcher */}
      <div role="tablist" aria-label="Input mode" className="mb-4 flex flex-wrap gap-2">
        {MODES.map((m) => {
          const Icon = m.icon;
          const selected = mode === m.id;
          return (
            <button
              key={m.id}
              role="tab"
              aria-selected={selected}
              type="button"
              onClick={() => {
                setFileError(null);
                onModeChange(m.id);
              }}
              className={`inline-flex items-center gap-2 border px-3 py-2 font-mono text-xs font-medium uppercase tracking-widest transition-colors ${
                selected
                  ? "border-ink bg-ink text-background"
                  : "border-line bg-background text-ink hover:border-ink"
              }`}
            >
              <Icon aria-hidden className="size-3.5" />
              {m.label}
            </button>
          );
        })}
      </div>

      {/* File mode */}
      {mode === "file" ? (
        <div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`flex flex-col items-center justify-center gap-2 border border-dashed px-6 py-10 text-center transition-colors ${
              dragOver ? "border-spicy bg-paper" : "border-line bg-background"
            }`}
          >
            <FileUp aria-hidden className="size-6 text-muted-foreground" />
            <p className="font-serif text-base">Drag and drop a document here</p>
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              {EXTENSION_LABEL} · up to 15 MB
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 border border-ink px-4 py-2 font-mono text-xs font-medium uppercase tracking-widest transition-colors hover:bg-ink hover:text-background"
            >
              Browse files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              accept={EXTENSION_LABEL}
              aria-label="Choose a document to review"
              onChange={onFileInput}
            />
          </div>

          {fileError ? (
            <p
              role="alert"
              className="mt-3 border border-spicy bg-paper px-3 py-2 font-mono text-xs text-spicy"
            >
              {fileError}
            </p>
          ) : null}

          {file ? (
            <div className="mt-3 flex flex-wrap items-center gap-3 border border-line bg-paper px-3 py-2">
              <span className="min-w-0 truncate font-mono text-xs" title={file.name}>
                {file.name}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                .{getFileExtension(file.name)} · {formatBytes(file.size)}
              </span>
              <button
                type="button"
                onClick={() => {
                  setFileError(null);
                  onFileChange(null);
                }}
                aria-label={`Remove selected file ${file.name}`}
                className="ml-auto inline-flex items-center gap-1 border border-line px-2 py-1 font-mono text-[11px] uppercase tracking-widest transition-colors hover:border-spicy hover:text-spicy"
              >
                <X aria-hidden className="size-3" /> Remove
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Text mode */}
      {mode === "text" ? (
        <div>
          <label
            htmlFor="paste-text"
            className="mb-2 block font-mono text-xs font-medium uppercase tracking-widest"
          >
            Text to review
          </label>
          <textarea
            id="paste-text"
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            rows={8}
            placeholder="Paste the document text you want to check before sharing…"
            className="w-full resize-y border border-line bg-background px-3 py-2 font-serif text-base leading-relaxed placeholder:text-muted-foreground/70"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              {text.length.toLocaleString()} characters
            </span>
            <button
              type="button"
              onClick={onLoadSample}
              className="border border-line px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-widest transition-colors hover:border-ink"
            >
              Load synthetic sample
            </button>
          </div>
        </div>
      ) : null}

      {/* Demo mode */}
      {mode === "demo" ? (
        <div className="border border-line bg-paper px-4 py-4">
          <p className="font-serif text-base leading-relaxed">
            Loads{" "}
            <span className="font-mono text-sm">synthetic-demo-scholarship-application.txt</span> —
            a clearly labelled fictional document containing several finding types.
          </p>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-spicy">
            Synthetic fixtures only — no file or text of yours is analysed.
          </p>
        </div>
      ) : null}

      {/* Errors from the scan attempt */}
      {error ? (
        <div role="alert" className="mt-4 border border-spicy bg-paper px-4 py-3">
          <p className="font-mono text-xs leading-relaxed text-spicy">{error}</p>
          {notConnectedError ? (
            <button
              type="button"
              onClick={onTryDemo}
              className="mt-2 border border-ink px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-widest transition-colors hover:bg-ink hover:text-background"
            >
              Try synthetic demo
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={onScan}
          disabled={!canScan}
          className="inline-flex items-center gap-2 bg-spicy px-5 py-3 font-mono text-xs font-semibold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-spicy/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {scanning ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
          {scanning ? "Scanning…" : "Scan for sensitive information"}
        </button>
        {mode === "demo" ? (
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Runs on built-in fixtures
          </span>
        ) : null}
      </div>
    </section>
  );
}
