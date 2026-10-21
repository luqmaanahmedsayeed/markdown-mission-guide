<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## PII Sentinel

- Frontend-only app: all detection, file parsing, and redaction belong to a separately developed Vercel backend. Never add backend code, Lovable Cloud, databases, auth, or provider keys to this frontend. (The brief's non-negotiable build boundary.)
- Backend seam: all live calls go through `src/lib/pii-sentinel-api.ts` (POST `/api/scan`, POST `/api/redact`) with contract types in `src/lib/pii-sentinel-types.ts`; mock mode (`VITE_USE_MOCK_API` on by default) serves synthetic fixtures from `src/lib/mock-scan-data.ts` and must never be presented as analysis of user input.
- Design system is Swiss/editorial: SPICY red `#C62020`, QUALITY white, DEEP TASTE black `#141414`; Helvetica/Arial display, Georgia body, IBM Plex Mono technical — tokens defined in `src/styles.css`, never hardcoded in components.
