# Formwright Monorepo

This repository contains the Formwright schema-driven form engine and related packages.

## npm Package

Formwright is published as a single npm package:

- `formwright`
- optional subpath exports: `formwright/core`, `formwright/schema`, `formwright/react`, `formwright/plugins`

## Workspace Layout

- `packages/contract`
- `packages/core`
- `packages/schema-builder`
- `packages/react-rhf`
- `packages/renderers-default`
- `packages/plugins-basic`
- `packages/plugins-async`
- `apps/demo`
- `apps/schema-lab`
- `apps/docs`

## Extension Model

See `apps/demo/README.md` for the renderer extension modes demonstrated in the demo app:

- slot override
- composer-based custom renderer
- full renderer replacement

See `docs/architecture.md` for the package and runtime boundary overview.

## Commands

- `pnpm install`
- `pnpm build`
- `pnpm dev`
- `pnpm lint`
- `pnpm test`
- `pnpm typecheck`
- `pnpm clean`

## Release Automation

- CI runs on pull requests and `main` pushes.
- Release runs from `main` with `semantic-release`.
- npm publish uses trusted publishing (OIDC provenance), not a long-lived npm token.
