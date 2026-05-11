# Packaged Vs Scaffolded

## Decision

The framework should use a hybrid delivery model:

- packaged infrastructure for logic and contracts
- scaffolded local code for UI ownership and deep customization

This is closer to `shadcn` in customization philosophy, but not identical in architecture.

## Why a hybrid model

A pure npm package model is too restrictive for teams that want to fully own markup, styling, and design-system integration.

A pure copy-into-app model is too weak for shared runtime logic, upgrades, and ecosystem consistency.

The clean split is:

- runtime logic stays centralized
- visual layer becomes consumer-owned

## Packaged surface

These parts should remain installable packages.

### `@form/contract`

Owns:

- schema types
- schema versioning
- normalization contracts
- migration helpers

### `@form/core`

Owns:

- plugin registry
- schema resolution
- rule evaluation
- dependency graph
- runtime orchestration contracts

### `@form/react-rhf`

Owns:

- React integration
- React Hook Form adapter
- binding hooks
- field-array integration
- form lifecycle wiring

### `@form/plugins-basic`

Owns:

- primitive field semantics
- standard validators
- standard operators

### `@form/plugins-async`

Owns:

- async option loading infrastructure
- remote validation infrastructure
- async dependency helpers

## Scaffolded surface

These parts should be copied into the consumer app and owned there.

### Field renderers

Examples:

- text field renderer
- select renderer
- checkbox renderer
- date renderer
- array renderer

### Layout components

Examples:

- grid layout renderer
- section renderer
- tabs renderer
- stepper renderer

### Wrappers

Examples:

- field shell
- label component
- description/help component
- error renderer
- action bar

### Theme bindings

Examples:

- Tailwind-based renderer set
- MUI adapter layer
- Chakra adapter layer
- internal design system bindings

## Consumer experience

The intended workflow should be:

1. install framework packages
2. initialize the project with a CLI
3. scaffold selected renderer and layout files into the app
4. edit those local files freely
5. keep consuming packaged runtime upgrades independently

## Why not package the renderers only

If all renderers stay in packages:

- users depend on our override API for all customization
- markup ownership is incomplete
- styling integration becomes harder
- deep design-system alignment becomes awkward

## Why not scaffold the runtime

If runtime logic is copied into the app:

- upgrades become expensive
- fixes fragment across projects
- plugin behavior becomes inconsistent
- rule engine changes are difficult to roll out safely

## Rule of thumb

Use this rule when deciding delivery mode:

- if it is semantic infrastructure, package it
- if it is visual output, scaffold it

## What counts as semantic infrastructure

- schema parsing
- rule DSL handling
- runtime field binding
- validation adapters
- plugin registration
- async data-source orchestration

## What counts as visual output

- JSX structure
- class names
- styling tokens at render time
- layout markup
- design-system components
- field wrappers and visual affordances

## CLI model

The framework should eventually expose a CLI that scaffolds consumer-owned code.

Recommended commands:

```bash
npx form-builder init
npx form-builder add renderers-default
npx form-builder add field-text
npx form-builder add field-select
npx form-builder add layout-grid
```

## Technical shape

The scaffolded files should be thin wrappers around packaged hooks and contracts.

Example direction:

- package exports `useFormFieldRuntime`
- consumer owns `TextFieldRenderer.tsx`
- local renderer calls packaged hooks and renders local UI

This keeps:

- logic centralized
- markup local
- customization unconstrained

## Extension model under this approach

### Existing semantic type, custom visual output

Consumer modifies local scaffolded renderer.

### New semantic field type

Consumer installs or writes a plugin package and may also scaffold a renderer.

### New layout type

Consumer registers a layout plugin and can own the rendered layout component locally.

## Constraints

- backend schema must still stay declarative
- scaffolded files must not become required for core runtime operation
- packaged runtime APIs must stay stable enough that scaffolded files do not break unnecessarily

## Consequence

The long-term success of this architecture depends heavily on designing stable runtime hooks and registries, because scaffolded UI files will sit on top of them.
