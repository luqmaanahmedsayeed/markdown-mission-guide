// Format strip — exact formats from the brief, in the exact order.
// Backend parsing and redaction per format are implemented separately.

const FORMATS = ["PDF", "DOCX", "XLSX", "CSV", "TXT", "RTF", "EML", "MSG"] as const;

export function FormatStrip() {
  return (
    <section aria-label="Supported document formats" className="border-b border-line bg-paper">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 sm:px-6">
        <span className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-ink">
          <span aria-hidden className="inline-block size-2 bg-spicy" />
          Supported format targets
        </span>
        <ul className="flex flex-wrap items-center gap-2">
          {FORMATS.map((format) => (
            <li
              key={format}
              className="border border-line bg-background px-2.5 py-1 font-mono text-[11px] font-medium tracking-widest text-ink"
            >
              {format}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
