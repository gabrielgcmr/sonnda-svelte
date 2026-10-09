<!-- AGENTS.md -->

# General

- When identifying improvements, technical debt, or future features outside the scope of the current task, record them in `docs/plans/backlog.md`, including priority, justification, and implementation conditions. Do not implement these changes without an explicit request. Avoid recording duplicates.

## Stack and SvelteKit conventions

- This project is a SvelteKit 3 application, not a publishable Svelte component library.
- Follow SvelteKit 3 conventions and do not reintroduce SvelteKit 2 configuration patterns:
  - Keep SvelteKit configuration in the `sveltekit(...)` Vite plugin inside `vite.config.ts`; do not create `svelte.config.js`.
  - Keep `tsconfig.json` extending `$app/tsconfig`.
  - Use the `#lib/*` subpath import declared in `package.json` for shared application modules instead of the removed `$lib` alias.
  - Include explicit module extensions in `#lib/*` imports (`.js` for TypeScript modules, including `.svelte.ts` runes modules, and `.svelte` for components).
- Do not add `svelte-package`, `publint`, package-library exports, or publishing scripts unless the user explicitly changes the project into a library.

## Cursor Cloud specific instructions

- Use Bun (`bun` / `bunx` on `/usr/local/bin`). Login shells do not load `~/.bashrc`, so a Bun install under `~/.bun` is not enough by itself.
- Before `bun run dev` or `bun run validate`, copy `.env.example` to `.env` when `.env` is missing. `.env` is gitignored. `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the example are public and required at startup. `PUBLIC_API_URL` defaults to `http://localhost:8080` when unset.
- Dev server: `bun run dev -- --host 0.0.0.0 --port 5173`. In the browser, an unauthenticated visit to `/` redirects to `/login`.
- `bun run validate` matches CI: lint, `svelte-check`, Vitest, and a production build. Component browser tests use Firefox; install it with `bunx playwright install --with-deps firefox`.
- The HTTP API lives in the separate `sonnda-api` repository and is not started here. Login, registration, and theme switching work against the public Supabase project in `.env.example` without that API. Pages that load patients or exams need `sonnda-api` at `PUBLIC_API_URL`.
