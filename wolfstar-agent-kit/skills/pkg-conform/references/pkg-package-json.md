# Package package.json Templates

## Single repo

```json
{
  "name": "my-package",
  "type": "module",
  "version": "0.0.0",
  "packageManager": "pnpm@10.32.1",
  "description": "",
  "author": {
    "name": "Wolfstar Project",
    "email": "contact@wolfstar.rocks",
    "url": "https://github.com/wolfstar-project"
  },
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/wolfstar-project/my-package"
  },
  "exports": {
    ".": {
      "types": "./dist/index.d.mts",
      "import": "./dist/index.mjs"
    }
  },
  "main": "./dist/index.mjs",
  "types": "./dist/index.d.mts",
  "files": ["dist"],
  "scripts": {
    "build": "obuild",
    "dev:prepare": "obuild --stub",
    "lint": "oxlint . && oxfmt --check .",
    "lint:fix": "oxlint . --fix && oxfmt .",
    "format": "oxfmt .",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:attw": "attw --pack",
    "prepack": "pnpm run build",
    "release": "pnpm build && bumpp --output=CHANGELOG.md"
  },
  "lint-staged": {
    "*.{js,ts,mjs,cjs,vue}": ["pnpm exec oxlint --fix", "pnpm exec oxfmt"]
  },
  "devDependencies": {
    "@arethetypeswrong/cli": "catalog:",
    "@types/node": "catalog:",
    "lint-staged": "catalog:",
    "obuild": "catalog:",
    "bumpp": "catalog:",
    "oxfmt": "catalog:",
    "oxlint": "catalog:",
    "typescript": "catalog:",
    "vitest": "catalog:"
  }
}
```

## Monorepo root

```json
{
  "type": "module",
  "private": true,
  "packageManager": "pnpm@10.32.1",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/wolfstar-project/my-monorepo"
  },
  "scripts": {
    "build": "pnpm run -r build",
    "lint": "oxlint . && oxfmt --check .",
    "lint:fix": "oxlint . --fix && oxfmt .",
    "format": "oxfmt .",
    "typecheck": "pnpm run -r typecheck",
    "test": "vitest",
    "test:attw": "pnpm -r --parallel --filter=./packages/** run test:attw",
    "release": "pnpm build && bumpp --output=CHANGELOG.md packages/*/package.json"
  },
  "lint-staged": {
    "*.{js,ts,mjs,cjs,vue}": ["pnpm exec oxlint --fix", "pnpm exec oxfmt"]
  },
  "devDependencies": {
    "@arethetypeswrong/cli": "catalog:",
    "@types/node": "catalog:",
    "bumpp": "catalog:",
    "oxfmt": "catalog:",
    "oxlint": "catalog:",
    "lint-staged": "catalog:",
    "obuild": "catalog:",
    "typescript": "catalog:",
    "vitest": "catalog:"
  }
}
```

## Rules

- Exports: ESM-only (`.d.mts` + `.mjs`), no CJS
- `sideEffects: false` for tree-shaking (when applicable)
- `files: ["dist"]` — only publish compiled output
- `peerDependencies` — specify minimum required versions for consumers (when applicable)
