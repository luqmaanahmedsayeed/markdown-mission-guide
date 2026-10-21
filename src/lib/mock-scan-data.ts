// PII Sentinel — synthetic demo fixtures and deterministic demo redaction.
//
// Everything here is clearly labelled synthetic data: fictional names,
// example.com addresses and fabricated identifier-like patterns. These
// fixtures let the interface be reviewed before the Vercel backend exists,
// and must never be presented as analysis of a user's real input.

import { type PiiFinding, type RedactionStrategy, type ScanResponse } from "./pii-sentinel-types";

export const DEMO_SAMPLE_TEXT = `SYNTHETIC DEMO DOCUMENT — PII SENTINEL
Every name, identifier and value in this file is fabricated sample data for demonstration only.

SCHOLARSHIP APPLICATION — MERIT AWARD 2026

Applicant name: Ananya Sharma
Date of birth: 14 March 2005
Email address: ananya.sharma@example.com
Phone number: +91 98765 43210
Residential address: 42, Marigold Lane, Jaipur, Rajasthan 302001
Aadhaar-style number: 2345 6789 0123
PAN-style identifier: ABCPS1234F
Bank-account-like number: 50120034567890
Application ID: APP-2026-00421
School roll number: R-2026-1177
Household income: INR 4,80,000 per annum
Guardian name: Rajesh Sharma
Guardian email: rajesh.sharma@example.com
Guardian phone: +91 81234 56780

STATEMENT OF PURPOSE
I am writing to apply for the Merit Award 2026. My family lives at 42, Marigold Lane, Jaipur, Rajasthan 302001, and I am currently studying in Class 12 at Government Senior Secondary School, Jaipur. My class teacher, Mrs. Kavita Menon, can be reached at kavita.menon@example.com for a recommendation, and the school office can confirm my roll number on request.

DECLARATION
The information provided above is accurate to the best of my knowledge.
— Ananya Sharma`;

export const DEMO_FILE_NAME = "synthetic-demo-scholarship-application.txt";

/** Replacement labels used by the demo "replace" strategy. */
const CATEGORY_LABELS: Record<string, string> = {
  "Person name": "NAME",
  "Email address": "EMAIL",
  "Phone number": "PHONE",
  "Residential address": "ADDRESS",
  "Aadhaar-style number": "AADHAAR-STYLE NUMBER",
  "PAN-style identifier": "PAN-STYLE IDENTIFIER",
  "Bank-account-like number": "BANK-ACCOUNT-LIKE NUMBER",
  "Date of birth": "DATE OF BIRTH",
  "Student identifier": "STUDENT ID",
  "Financial detail": "FINANCIAL DETAIL",
};

/** Compute deterministic offsets of a value inside the demo text. */
function at(value: string, occurrence = 1): { start: number; end: number } {
  let idx = -1;
  for (let i = 0; i < occurrence; i += 1) {
    idx = DEMO_SAMPLE_TEXT.indexOf(value, idx + 1);
    if (idx === -1) throw new Error(`Demo fixture value not found: ${value}`);
  }
  return { start: idx, end: idx + value.length };
}

/** Deterministic masking for fixture display values. */
function maskValue(value: string): string {
  if (value.length <= 4) return "•".repeat(value.length);
  if (value.length <= 8)
    return `${value.slice(0, 1)}${"•".repeat(value.length - 2)}${value.slice(-1)}`;
  return `${value.slice(0, 2)}${"•".repeat(value.length - 6)}${value.slice(-4)}`;
}

const EXPLANATIONS = {
  name: "A name is context-dependent and may not need redaction in every document.",
  email: "This resembles an email address. Confirm that the recipient needs it.",
  phone: "This looks like a personal phone number; sharing it exposes a direct contact channel.",
  address: "A residential address can identify where a person lives.",
  aadhaar: "This number matches a sensitive-identifier pattern; verify the context before sharing.",
  pan: "This value matches a sensitive-identifier pattern; verify the context before sharing.",
  bank: "This value has the shape of a bank-account-like number; sharing it can enable fraud.",
  dob: "A date of birth is a common identity-verification factor.",
  studentId: "An application or roll number can link the document back to an individual applicant.",
  income: "Household income details are sensitive in financial-aid contexts.",
} as const;

const ACTIONS = {
  name: "Confirm that the recipient needs this name.",
  email: "Confirm that the recipient needs this email address.",
  phone: "Remove unless the recipient must call the person directly.",
  address: "Remove unless the recipient needs the postal address.",
  identifier: "Verify the context before sharing.",
  dob: "Remove unless the date of birth is required for the application.",
  studentId: "Confirm whether the recipient needs this reference number.",
  income: "Remove unless the financial detail is required.",
} as const;

interface DemoFindingSpec {
  id: string;
  category: string;
  riskLevel: PiiFinding["riskLevel"];
  confidence: number;
  value: string;
  occurrence?: number;
  explanation: string;
  recommendedAction: string;
}

const DEMO_FINDING_SPECS: DemoFindingSpec[] = [
  {
    id: "demo-001",
    category: "Person name",
    riskLevel: "medium",
    confidence: 0.86,
    value: "Ananya Sharma",
    explanation: EXPLANATIONS.name,
    recommendedAction: ACTIONS.name,
  },
  {
    id: "demo-002",
    category: "Date of birth",
    riskLevel: "medium",
    confidence: 0.72,
    value: "14 March 2005",
    explanation: EXPLANATIONS.dob,
    recommendedAction: ACTIONS.dob,
  },
  {
    id: "demo-003",
    category: "Email address",
    riskLevel: "high",
    confidence: 0.97,
    value: "ananya.sharma@example.com",
    explanation: EXPLANATIONS.email,
    recommendedAction: ACTIONS.email,
  },
  {
    id: "demo-004",
    category: "Phone number",
    riskLevel: "high",
    confidence: 0.94,
    value: "+91 98765 43210",
    explanation: EXPLANATIONS.phone,
    recommendedAction: ACTIONS.phone,
  },
  {
    id: "demo-005",
    category: "Residential address",
    riskLevel: "high",
    confidence: 0.83,
    value: "42, Marigold Lane, Jaipur, Rajasthan 302001",
    explanation: EXPLANATIONS.address,
    recommendedAction: ACTIONS.address,
  },
  {
    id: "demo-006",
    category: "Aadhaar-style number",
    riskLevel: "high",
    confidence: 0.91,
    value: "2345 6789 0123",
    explanation: EXPLANATIONS.aadhaar,
    recommendedAction: ACTIONS.identifier,
  },
  {
    id: "demo-007",
    category: "PAN-style identifier",
    riskLevel: "high",
    confidence: 0.92,
    value: "ABCPS1234F",
    explanation: EXPLANATIONS.pan,
    recommendedAction: ACTIONS.identifier,
  },
  {
    id: "demo-008",
    category: "Bank-account-like number",
    riskLevel: "high",
    confidence: 0.93,
    value: "50120034567890",
    explanation: EXPLANATIONS.bank,
    recommendedAction: ACTIONS.identifier,
  },
  {
    id: "demo-009",
    category: "Student identifier",
    riskLevel: "low",
    confidence: 0.5,
    value: "APP-2026-00421",
    explanation: EXPLANATIONS.studentId,
    recommendedAction: ACTIONS.studentId,
  },
  {
    id: "demo-010",
    category: "Student identifier",
    riskLevel: "low",
    confidence: 0.6,
    value: "R-2026-1177",
    explanation: EXPLANATIONS.studentId,
    recommendedAction: ACTIONS.studentId,
  },
  {
    id: "demo-011",
    category: "Financial detail",
    riskLevel: "medium",
    confidence: 0.65,
    value: "INR 4,80,000",
    explanation: EXPLANATIONS.income,
    recommendedAction: ACTIONS.income,
  },
  {
    id: "demo-012",
    category: "Person name",
    riskLevel: "medium",
    confidence: 0.8,
    value: "Rajesh Sharma",
    explanation: EXPLANATIONS.name,
    recommendedAction: ACTIONS.name,
  },
  {
    id: "demo-013",
    category: "Email address",
    riskLevel: "high",
    confidence: 0.96,
    value: "rajesh.sharma@example.com",
    explanation: EXPLANATIONS.email,
    recommendedAction: ACTIONS.email,
  },
  {
    id: "demo-014",
    category: "Phone number",
    riskLevel: "high",
    confidence: 0.93,
    value: "+91 81234 56780",
    explanation: EXPLANATIONS.phone,
    recommendedAction: ACTIONS.phone,
  },
  {
    id: "demo-015",
    category: "Residential address",
    riskLevel: "high",
    confidence: 0.82,
    value: "42, Marigold Lane, Jaipur, Rajasthan 302001",
    occurrence: 2,
    explanation: EXPLANATIONS.address,
    recommendedAction: ACTIONS.address,
  },
  {
    id: "demo-016",
    category: "Person name",
    riskLevel: "low",
    confidence: 0.55,
    value: "Mrs. Kavita Menon",
    explanation: EXPLANATIONS.name,
    recommendedAction: ACTIONS.name,
  },
  {
    id: "demo-017",
    category: "Email address",
    riskLevel: "medium",
    confidence: 0.9,
    value: "kavita.menon@example.com",
    explanation: EXPLANATIONS.email,
    recommendedAction: ACTIONS.email,
  },
  {
    id: "demo-018",
    category: "Person name",
    riskLevel: "medium",
    confidence: 0.86,
    value: "Ananya Sharma",
    occurrence: 2,
    explanation: EXPLANATIONS.name,
    recommendedAction: ACTIONS.name,
  },
];

function buildDemoFinding(spec: DemoFindingSpec): PiiFinding {
  const offsets = at(spec.value, spec.occurrence ?? 1);
  return {
    id: spec.id,
    category: spec.category,
    riskLevel: spec.riskLevel,
    confidence: spec.confidence,
    maskedValue: maskValue(spec.value),
    explanation: spec.explanation,
    recommendedAction: spec.recommendedAction,
    location: { page: 1, start: offsets.start, end: offsets.end },
    start: offsets.start,
    end: offsets.end,
    value: spec.value,
  };
}

/** Full synthetic demo scan result — mode "demo", clearly not a live scan. */
export function buildDemoScanResponse(): ScanResponse {
  const findings = DEMO_FINDING_SPECS.map(buildDemoFinding);
  const summary = { high: 0, medium: 0, low: 0 };
  for (const finding of findings) summary[finding.riskLevel] += 1;
  return {
    fileName: DEMO_FILE_NAME,
    fileType: "demo",
    totalFindings: findings.length,
    riskSummary: summary,
    findings,
    mode: "demo",
    message: "Synthetic fixtures for design review — not analysis of an uploaded file.",
  };
}

/** The text the "load a synthetic sample" action puts into the paste-text box. */
export function loadDemoSampleText(): string {
  return DEMO_SAMPLE_TEXT;
}

/**
 * Apply a redaction strategy to the demo text using finding offsets.
 * Demo-only; the real redaction of user files is backend work.
 */
export function applyDemoRedaction(
  findings: PiiFinding[],
  selectedFindingIds: string[],
  strategy: RedactionStrategy,
  replacement?: string,
): { sanitizedText: string; processedCount: number } {
  const selected = findings
    .filter((f) => selectedFindingIds.includes(f.id))
    .filter((f) => typeof f.start === "number" && typeof f.end === "number")
    .sort((a, b) => (b.start ?? 0) - (a.start ?? 0));

  let sanitized = DEMO_SAMPLE_TEXT;
  for (const finding of selected) {
    const original = DEMO_SAMPLE_TEXT.slice(finding.start, finding.end);
    let substitute: string;
    switch (strategy) {
      case "mask":
        substitute = maskValue(original);
        break;
      case "replace":
        substitute = `[${CATEGORY_LABELS[finding.category] ?? "REDACTED"}]`;
        break;
      case "remove":
        substitute = "";
        break;
      case "custom":
        substitute = replacement && replacement.length > 0 ? replacement : "[REDACTED]";
        break;
    }
    // Offset-based splice: positions before the current start are unaffected
    // because we iterate from the end of the text backwards.
    sanitized = sanitized.slice(0, finding.start) + substitute + sanitized.slice(finding.end);
  }

  return { sanitizedText: sanitized, processedCount: selected.length };
}

export const DEMO_DOWNLOAD_FILE_NAME = "pii-sentinel-demo-sanitized.txt";
