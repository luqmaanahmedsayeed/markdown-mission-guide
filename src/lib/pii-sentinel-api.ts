// PII Sentinel — API client adapter.
//
// Single seam to the separately developed Vercel backend. Endpoint paths and
// response normalization live here so a contract change is one small edit.
// Live mode calls POST /api/scan (JSON for text, multipart/form-data for
// files) and POST /api/redact. When VITE_USE_MOCK_API is enabled (the
// default until the backend ships) the adapter refuses live calls instead of
// pretending a scan happened.
//
// Never log file contents or detected values. Never call Presidio, Google
// Cloud, or Sapling from the browser — the backend owns providers and keys.

import {
  BackendNotConnectedError,
  deriveRiskSummary,
  type DetectionEngine,
  type PiiFinding,
  type RedactRequest,
  type RedactResponse,
  type RiskSummary,
  type ScanMode,
  type ScanResponse,
} from "./pii-sentinel-types";

const SCAN_PATH = "/api/scan";
const REDACT_PATH = "/api/redact";

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/+$/, "");
/** Mock fixtures are on until the team explicitly sets VITE_USE_MOCK_API=false. */
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== "false";

/** True when live backend calls are allowed (i.e. mock mode is switched off). */
export function isBackendConnected(): boolean {
  return !USE_MOCK_API;
}

function endpoint(path: string): string {
  return API_BASE ? `${API_BASE}${path}` : path;
}

function friendlyHttpError(status: number): string {
  if (status === 401 || status === 403) return "The scan service rejected this request. Check backend configuration.";
  if (status === 404) return "The scan service endpoint was not found. Confirm the backend deployment.";
  if (status === 413) return "The file is too large for the scan service.";
  if (status >= 500) return "The scan service reported a server error. Please try again later.";
  return `The scan service returned an error (status ${status}).`;
}

async function parseResponseBody(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    throw new Error("The scan service returned an unreadable response.");
  }
}

/** Minimal structural validation; missing fields stay "Not provided" in the UI. */
function normalizeScanResponse(raw: unknown): ScanResponse {
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as { findings?: unknown }).findings)) {
    throw new Error("The scan service returned an unexpected response shape.");
  }
  const data = raw as {
    scanId?: string;
    fileName?: string;
    fileType?: string;
    totalFindings?: number;
    riskSummary?: Partial<RiskSummary>;
    findings?: unknown[];
    mode?: string;
    message?: string;
  };
  const findings = data.findings as PiiFinding[];
  const mode: ScanMode = data.mode === "demo" ? "demo" : "live";
  return {
    scanId: data.scanId,
    fileName: data.fileName,
    fileType: data.fileType,
    totalFindings:
      typeof data.totalFindings === "number" ? data.totalFindings : findings.length,
    riskSummary: {
      high: data.riskSummary?.high ?? deriveRiskSummary(findings).high,
      medium: data.riskSummary?.medium ?? deriveRiskSummary(findings).medium,
      low: data.riskSummary?.low ?? deriveRiskSummary(findings).low,
    },
    findings,
    mode,
    message: data.message,
  };
}

async function requestScan(body: BodyInit, headers?: HeadersInit): Promise<ScanResponse> {
  let res: Response;
  try {
    res = await fetch(endpoint(SCAN_PATH), {
      method: "POST",
      headers,
      body,
    });
  } catch {
    throw new Error("Could not reach the scan service. Check your connection and the backend deployment.");
  }
  if (!res.ok) throw new Error(friendlyHttpError(res.status));
  return normalizeScanResponse(await parseResponseBody(res));
}

/** Scan pasted text. POST /api/scan with JSON. */
export async function scanText(text: string, engine?: DetectionEngine): Promise<ScanResponse> {
  if (USE_MOCK_API) throw new BackendNotConnectedError();
  return requestScan(JSON.stringify({ type: "text", text, ...(engine ? { engine } : {}) }), {
    "Content-Type": "application/json",
  });
}

/** Scan an uploaded file. POST /api/scan with multipart/form-data. */
export async function scanFile(file: File, engine?: DetectionEngine): Promise<ScanResponse> {
  if (USE_MOCK_API) throw new BackendNotConnectedError();
  const form = new FormData();
  form.append("file", file);
  if (engine) form.append("engine", engine);
  return requestScan(form);
}

/**
 * Request a sanitized copy. The backend is assumed stateless between
 * requests, so the original input plus selected finding references are sent
 * with every call (a future scanId flow can replace this — see the types).
 */
export async function redactInput(request: RedactRequest): Promise<RedactResponse> {
  if (USE_MOCK_API) throw new BackendNotConnectedError();

  const { text, file, findings, selectedFindingIds, strategy, replacement } = request;
  const payload = {
    ...(text !== undefined ? { text } : {}),
    findings,
    selectedFindingIds,
    strategy,
    ...(strategy === "custom" && replacement ? { replacement } : {}),
  };

  const useMultipart = file instanceof File;
  let res: Response;
  try {
    if (useMultipart) {
      const form = new FormData();
      form.append("payload", JSON.stringify(payload));
      form.append("file", file);
      res = await fetch(endpoint(REDACT_PATH), { method: "POST", body: form });
    } else {
      res = await fetch(endpoint(REDACT_PATH), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
  } catch {
    throw new Error("Could not reach the redaction service. Check your connection and the backend deployment.");
  }
  if (!res.ok) throw new Error(friendlyHttpError(res.status));

  const contentType = res.headers.get("content-type") ?? "";
  const base = {
    mode: "live" as ScanMode,
    strategy,
    processedCount: selectedFindingIds.length,
  };

  if (contentType.includes("application/json")) {
    const raw = await parseResponseBody(res);
    if (!raw || typeof raw !== "object") {
      throw new Error("The redaction service returned an unreadable response.");
    }
    const data = raw as {
      fileName?: string;
      fileType?: string;
      sanitizedText?: string;
      downloadUrl?: string;
      downloadFileName?: string;
      processedCount?: number;
      message?: string;
    };
    if (typeof data.sanitizedText !== "string" && typeof data.downloadUrl !== "string") {
      throw new Error("The redaction service did not return a sanitized artifact.");
    }
    return {
      ...base,
      fileName: data.fileName,
      fileType: data.fileType,
      sanitizedText: data.sanitizedText,
      downloadUrl: data.downloadUrl,
      downloadFileName: data.downloadFileName,
      processedCount: data.processedCount ?? base.processedCount,
      message: data.message,
    };
  }

  // Binary artifact: hand the blob URL to the UI for download.
  const blob = await res.blob();
  const disposition = res.headers.get("content-disposition") ?? "";
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  return {
    ...base,
    downloadUrl: URL.createObjectURL(blob),
    downloadFileName: match?.[1] ?? "pii-sentinel-sanitized-copy",
  };
}
