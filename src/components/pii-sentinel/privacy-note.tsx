// Privacy and trust note — placed near the upload area, before scanning.

export function PrivacyNote() {
  return (
    <p className="border-l-2 border-spicy bg-paper px-4 py-3 font-serif text-sm leading-relaxed text-ink">
      Use synthetic data for demos. When live scanning is connected, processing and third-party
      provider use depend on the configured backend. Review the{" "}
      <a href="#how-it-works" className="underline underline-offset-2 hover:text-spicy">
        data-handling notice
      </a>{" "}
      before submitting sensitive documents.
    </p>
  );
}
