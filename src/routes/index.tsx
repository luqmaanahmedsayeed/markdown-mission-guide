import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "@/components/pii-sentinel/workspace";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PII Sentinel — Scan Before You Share" },
      {
        name: "description",
        content:
          "Document privacy preflight: find personal information in files and text, review the risk, and prepare a sanitized copy before sharing.",
      },
      { property: "og:title", content: "PII Sentinel — Scan Before You Share" },
      {
        property: "og:description",
        content:
          "Find personal information in documents and prepare a sanitized copy before sharing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WorkspacePage,
});
