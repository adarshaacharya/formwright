# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from repo root via Turborepo unless targeting a specific package.

```bash
# Install
pnpm install

# Build (packages first, then root bundle via tsup)
pnpm build

# Dev watch (all packages in parallel)
pnpm dev

# Lint (tsc --noEmit per package)
pnpm lint

# Typecheck
pnpm typecheck

# Test (all packages)
pnpm test

# Test a single package
pnpm --filter @formwright/core test
pnpm --filter @formwright/plugins-basic test

# Run a single test file
pnpm --filter @formwright/plugins-basic exec vitest run src/plugins.test.ts

# Clean
pnpm clean
```

The root bundle is built by `tsup` (see `tsup.config.ts`). Individual packages build with `tsc`. Turbo enforces build order: packages must build before tests run.

## Architecture

Formwright is a **schema-driven form engine** published as a single npm package (`formwright`) with sub-path exports (`/core`, `/schema`, `/react`, `/plugins`). Internally it is a Turborepo monorepo where each sub-path maps to an internal workspace package.

### Layer diagram

```
formwright/schema   →  @formwright/schema-builder   (fluent DSL: defineForm, field, layout, rule, datasource, buildForm)
      ↓
formwright/core     →  @formwright/core              (runtime engine: createFormRuntime, plugin registry, evaluate)
      ↓
formwright/react    →  @formwright/react-rhf         (React + RHF integration: FormRuntimeProvider, FormRuntimeRoot, hooks)
formwright/plugins  →  @formwright/plugins-basic     (operators, effects)
                   +  @formwright/plugins-async      (remote/static datasource plugins)
                                      ↑
@formwright/contract                              (shared TypeScript types only — no runtime code)
```

### `@formwright/contract` — shared type layer

Pure types only. Split into three sub-schemas that compose into `FormDefinition`:
- **`DataSchema`** — flat field map (`Record<FieldPath, DataFieldDefinition>`), value types: `string | number | integer | boolean | date | datetime | file | json | object | array`.
- **`UiSchema`** — field UI nodes (`UiFieldNode`) + layout tree (`LayoutNode`). Layout node types: `stack | section | grid | tabs | stepper | divider | field`.
- **`BehaviorSchema`** — rules, data sources, computed fields, lifecycle hooks. Rule expressions use a JSON-logic-like AST (`{eq}`, `{gt}`, `{and}`, `{var}`, etc.).

### `@formwright/schema-builder` — form authoring DSL

`buildForm({ form, fields, layout, rules?, datasources?, computed?, lifecycle? })` compiles the fluent builder output into a `FormDefinition`. Helpers: `field.text()`, `field.email()`, `field.select()`, etc. Layout helpers: `layout.stack()`, `layout.grid()`, `layout.tabs()`, etc.

### `@formwright/core` — runtime engine

`createFormRuntime(input)` returns a `FormRuntime` object. Key methods:
- `evaluate(values?)` — runs all behavior rules against current values, returns `{ fieldState, layoutState, values }` (derived state snapshot).
- `getResolvedFields()` — normalized field models (after field plugins run `normalize`).
- `getFieldValidationPlan(path)` — which validators apply to a field.
- `serializeFieldValue / deserializeFieldValue` — delegate to field plugins.

The **plugin registry** (`createPluginRegistry()`) categorizes six plugin kinds: `field | layout | validator | operator | effect | datasource`. `createFormRuntime` builds one internally and populates it from the `plugins` array passed in.

Rule evaluation: `evaluate()` iterates `BehaviorSchema.rules`, dispatches `when` expressions to **operator plugins** (`eq`, `gt`, `in`, `and`, `or`, `exists`, …), and applies matched `effects` via **effect plugins** (`show`, `hide`, `enable`, `disable`, `require`, `setValue`, `clearValue`, `setLayoutProp`).

### `@formwright/plugins-basic` / `@formwright/plugins-async`

- `registerBasicPlugins()` — returns the built-in operator + effect plugins needed for rule evaluation.
- `registerAsyncPlugins({ baseUrl? })` — adds static/remote data source plugins.
- `createRemoteDataSourcePlugin(options)` — custom remote source with a `requestBuilder` callback.

### `@formwright/react-rhf` — React rendering layer

`FormRuntimeProvider` wraps a `react-hook-form` `FormProvider`. It:
1. Calls `runtime.evaluate()` with watched field values.
2. Passes evaluation snapshot + runtime via `RuntimeContext`.
3. Re-evaluates only when fields in `runtime.getEvaluationDependencies()` change (signature string comparison for stable memoization).

`FormRuntimeRoot` resolves the root layout node and delegates to `renderNode()`, which dispatches to renderer maps.

**Extension points on `FormRuntimeRoot`:**
- `fieldSlots` — replace shell parts: `Shell | Label | Description | Control | Error | Help`.
- `fieldRendererMap` — replace full field rendering by renderer key (e.g. `"select"`, `"date"`).
- `arrayFieldRendererMap` — same for array fields.
- `layoutRendererMap` — replace layout node rendering by type.

**Hooks:**
- `useFormField(path)` — returns `{ field, state, controller }`. Wires RHF `useController` with runtime-derived required/disabled/visible state and schema validation rules.
- `useFormArray(path)` — RHF `useFieldArray` integrated with runtime state.
- `useFormLayout(id)` — reads layout node + derived layout state.
- `useDatasourceOptions(fieldPath)` — calls the datasource plugin for a field, returns `{ options, loading, error }`.

### Plugin authoring pattern

```ts
const myFieldPlugin: FieldPlugin = {
  kind: "field",
  identity: { name: "my-plugin", version: "1" },
  fieldType: "my-type",
  normalize(input) { /* return FieldPluginNormalizeOutput */ },
  getDefaultValue(input) { return null; },
  getValidationPlan(input) { return []; },
  serialize(input) { return input.value; },
  deserialize(input) { return input.value; },
};
```

All plugin interfaces are in `packages/core/src/runtime/types.ts`.

### Key design invariants

- `@formwright/contract` has zero runtime deps — importing it never pulls in React or RHF.
- Field paths are dot-notation strings (`"address.city"`, `"items.0.name"`). The provider flattens nested form values to dot-paths before passing to RHF.
- `FormRuntime.evaluate()` is pure and synchronous. Async behavior (remote data sources) lives entirely in `useDatasourceOptions` and the datasource plugin's `load()`.
- `hiddenFieldPolicy` on `FormRuntimeProvider` controls whether hidden field values are cleared (`"clear"`) or retained (`"keep"`, default).
- Tests use **Vitest**. Each package runs `vitest run` independently; there is no shared test config at the root.
