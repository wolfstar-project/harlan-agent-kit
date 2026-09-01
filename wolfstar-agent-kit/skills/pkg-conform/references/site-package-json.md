# Site Package.json Template

## Standard site package.json

```json
{
  "name": "my-site",
  "type": "module",
  "private": true,
  "packageManager": "pnpm@10.32.1",
  "engines": { "node": ">=LATEST_STABLE_EVEN" },
  "description": "",
  "author": {
    "name": "Wolfstar Project",
    "email": "contact@wolfstar.rocks",
    "url": "https://github.com/wolfstar-project"
  },
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/wolfstar-project/my-site"
  },
  "scripts": {
    "dev": "nuxi dev",
    "build": "nuxi prepare && nuxi build",
    "postinstall": "nuxt prepare",
    "lint": "oxlint . && oxfmt --check .",
    "lint:fix": "oxlint . --fix && oxfmt .",
    "format": "oxfmt .",
    "typecheck": "nuxt typecheck",
    "test": "vitest",
    "test:run": "vitest run"
  },
  "lint-staged": {
    "*.{js,ts,mjs,cjs,vue}": ["pnpm exec oxlint --fix", "pnpm exec oxfmt"],
    "*.{json,yml,md,html,css}": ["pnpm exec oxfmt"]
  },
  "pnpm": {
    "overrides": {
      "vite": "^8.0.0"
    }
  },
  "devDependencies": {
    "@nuxt/content": "catalog:",
    "@nuxt/fonts": "catalog:",
    "@nuxt/image": "catalog:",
    "@nuxt/scripts": "catalog:",
    "@nuxt/ui": "catalog:",
    "@nuxtjs/seo": "catalog:",
    "@types/node": "catalog:",
    "@vueuse/nuxt": "catalog:",
    "oxfmt": "catalog:",
    "oxlint": "catalog:",
    "lint-staged": "catalog:",
    "motion-v": "catalog:",
    "nuxt": "catalog:",
    "typescript": "catalog:",
    "vitest": "catalog:"
  }
}
```

## Rules

- `private: true` — sites are deployed, not published
- `engines.node` — latest stable even-numbered Node major (22, 24, 26, etc.)
- `pnpm.overrides.vite` — set to `^8.0.0`
- Do NOT include: `exports`, `main`, `types`, `files`, `sideEffects`, `obuild`, `dev:prepare`, `test:attw`, `prepack`, `release`, `bumpp`, `@arethetypeswrong/cli`

## Optional scripts

Add when relevant:

- `"generate": "nuxi generate"` — static site generation
- `"preview": "nuxi preview"` — preview built app
- `"lint:docs": "markdownlint-cli2 'content/**/*.md' && case-police 'content/**/*.md'"` — markdown linting
- `"test:e2e": "vitest run --config vitest.e2e.config.ts"` — e2e with image snapshots
- `"db:generate"`, `"db:migrate:local"`, `"db:migrate:prod"` — Drizzle database migrations
