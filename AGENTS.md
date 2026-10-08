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
