// PII Sentinel — shared contract types.
//
// These shapes describe what the separately developed Vercel backend is
// expected to return from POST /api/scan and POST /api/redact. Keeping them
// centralized means changing the backend contract later is one small edit.
// The frontend never invents confidence, locations, or offsets: when the
// backend does not supply a field the UI shows "Not provided".

/** Detection engines planned on the backend. The frontend only forwards the choice. */
export type DetectionEngine = "presidio" | "google-cloud" | "sapling" | "auto";

export type RiskLevel = "high" | "medium" | "low";

export type RedactionStrategy = "mask" | "replace" | "remove" | "custom";

export type ScanMode = "live" | "demo";

/** Where a finding was located, as provided by the backend. */
export interface PiiFindingLocation {
  page?: number;
  row?: number;
  column?: string;
  start?: number;
  end?: number;
}

export interface PiiFinding {
  id: string;
  category: string;
  riskLevel: RiskLevel;
  /** 0–1 confidence supplied by the backend; never synthesized in the UI. */
  confidence?: number;
  /** Masked representation shown by default; full values are not exposed unnecessarily. */
  maskedValue?: string;
  explanation?: string;
  recommendedAction?: string;
  location?: PiiFindingLocation;
  /** Optional offsets are integration metadata; the UI never invents offsets. */
  start?: number;
  end?: number;
  /**
   * Optional full matched value, provided by the backend for the explicit
   * reveal control. Never exposed by default.
   */
  value?: string;
}

export interface RiskSummary {
  high: number;
  medium: number;
  low: number;
}

export interface ScanResponse {
  scanId?: string;
  fileName?: string;
  fileType?: string;
  totalFindings: number;
  riskSummary: RiskSummary;
  findings: PiiFinding[];
  mode?: ScanMode;
  message?: string;
}

export interface RedactRequest {
  /**
   * The original input. Backends are assumed stateless between requests, so
   * the necessary original input and finding references travel with each call
   * (or a future scanId flow can replace them — backend team's choice).
   */
  text?: string;
  file?: File | null;
  findings: PiiFinding[];
  selectedFindingIds: string[];
  strategy: RedactionStrategy;
  replacement?: string;
}

export interface RedactResponse {
  mode: ScanMode;
  fileName?: string;
  fileType?: string;
  strategy: RedactionStrategy;
  processedCount: number;
  /** Sanitized text (text inputs or demo mode). */
  sanitizedText?: string;
  /** Sanitized artifact URL (blob or backend URL) for file inputs. */
  downloadUrl?: string;
  downloadFileName?: string;
  message?: string;
}

/** File formats the workspace accepts; parsing itself is backend work. */
export const SUPPORTED_EXTENSIONS = [
  "pdf",
  "docx",
  "xlsx",
  "csv",
  "txt",
  "rtf",
  "eml",
  "msg",
] as const;

/** Client-side sanity limit only; authoritative validation happens on the backend. */
export const MAX_FILE_BYTES = 15 * 1024 * 1024;

export function getFileExtension(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  return idx === -1 ? "" : fileName.slice(idx + 1).toLowerCase();
}

export function isSupportedFile(fileName: string): boolean {
  return (SUPPORTED_EXTENSIONS as readonly string[]).includes(getFileExtension(fileName));
}

/** Thrown when live scanning is requested while VITE_USE_MOCK_API is enabled. */
export class BackendNotConnectedError extends Error {
  constructor(
    message = "Backend not connected — load the synthetic demo to preview the workflow.",
  ) {
    super(message);
    this.name = "BackendNotConnectedError";
  }
}

/** Derive the risk summary from findings; used when the backend omits it. */
export function deriveRiskSummary(findings: PiiFinding[]): RiskSummary {
  const summary: RiskSummary = { high: 0, medium: 0, low: 0 };
  for (const finding of findings) summary[finding.riskLevel] += 1;
  return summary;
}
