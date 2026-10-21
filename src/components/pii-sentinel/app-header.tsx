interface AppHeaderProps {
  /** True while the app is running on synthetic fixtures (mock API enabled). */
  demoMode: boolean;
}

export function AppHeader({ demoMode }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 sm:px-6">
        <a
          href="#top"
          className="font-display text-lg font-bold uppercase leading-none tracking-tight"
        >
          PII <span className="text-spicy">/</span> Sentinel
        </a>
        <span className="hidden font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground sm:inline">
          Document privacy preflight
        </span>
        {demoMode ? (
          <span
            className="inline-flex items-center border border-spicy px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-widest text-spicy"
            title="Running on synthetic fixtures; live scanning is not connected"
          >
            Demo mode
          </span>
        ) : null}
        <nav
          aria-label="Page sections"
          className="ml-auto flex items-center gap-4 font-mono text-xs uppercase tracking-widest"
        >
          <a href="#workspace" className="transition-colors hover:text-spicy">
            Workspace
          </a>
          <a href="#how-it-works" className="transition-colors hover:text-spicy">
            How it works
          </a>
        </nav>
      </div>
    </header>
  );
}
