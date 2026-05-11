# Public API Boundaries

## Purpose

Define the public API surface for the core engine packages so implementation stays stable, intentional, and consumer-friendly.

This document should act as the source of truth before package entrypoints are implemented.

## Core principle

Public APIs should be:

- explicit
- minimal
- typed
- stable
- ergonomic for consumers

Internal implementation details should not leak across package boundaries.

## Public API policy

The package `src/index.ts` file should define the public export surface.

If something is not exported from the package root, it should be treated as internal unless explicitly documented otherwise.

## Public package set

Initial public packages:

- `@form/contract`
- `@form/core`
- `@form/react-rhf`
- `@form/renderers-default`
- `@form/plugins-basic`
- `@form/plugins-async`

## `@form/contract`

### Purpose

Expose the schema contract and schema-facing utilities.

### Public exports

Recommended public categories:

- form definition types
- data schema types
- UI schema types
- behavior schema types
- field path types
- schema guard APIs
- schema normalization entrypoints
- schema validation error types

### Example export shape

```ts
export type {
  FormDefinition,
  FormMeta,
  DataSchema,
  DataFieldDefinition,
  UiSchema,
  UiFieldNode,
  LayoutNode,
  BehaviorSchema,
  BehaviorRule,
  RuleExpression,
  RuleEffect,
  DataSourceDefinition,
  ComputedFieldDefinition,
  FieldPath,
} from "./...";

export {
  isFormDefinition,
  normalizeFormDefinition,
} from "./...";
```

### Internal only

Keep internal:

- low-level normalization helpers
- internal schema traversal helpers
- package-private parsing internals

## `@form/core`

### Purpose

Expose the runtime engine contracts and extensibility APIs.

### Public exports

Recommended public categories:

- plugin interfaces
- plugin registration APIs
- field plugin types
- layout plugin types
- validator plugin types
- operator plugin types
- effect handler types
- data source plugin types
- runtime creation API
- runtime context types
- resolved field and layout model types
- engine-level domain error types if intentionally consumable

### Example export shape

```ts
export type {
  FieldPlugin,
  LayoutPlugin,
  ValidatorPlugin,
  OperatorPlugin,
  EffectPlugin,
  DataSourcePlugin,
  RuntimeContext,
  ResolvedFieldModel,
  ResolvedLayoutModel,
} from "./...";

export {
  createFormRuntime,
  createPluginRegistry,
  registerFieldPlugin,
  registerLayoutPlugin,
} from "./...";
```

### Internal only

Keep internal:

- evaluation pipeline implementation details
- registry storage structures
- graph resolution internals
- optimization internals
- tracing internals unless explicitly exposed

## `@form/react-rhf`

### Purpose

Expose React and React Hook Form integration in a consumer-friendly way.

### Public exports

Recommended public categories:

- provider components
- root runtime component
- hooks for form runtime access
- hooks for field runtime access
- hooks for layout runtime access
- submission hooks if applicable
- renderer-facing prop types
- adapter configuration types

### Example export shape

```ts
export type {
  UseFormRuntimeOptions,
  RenderFieldProps,
  RenderLayoutProps,
  FormRuntimeProviderProps,
} from "./...";

export {
  FormRuntimeProvider,
  FormRuntimeRoot,
  useFormRuntime,
  useFormField,
  useFormLayout,
  useDatasourceOptions,
} from "./...";
```

### Internal only

Keep internal:

- RHF binding helpers
- internal subscription wiring
- private adapter utilities
- internal context implementation details

## `@form/renderers-default`

### Purpose

Expose an optional default renderer set and a reference implementation.

### Public exports

Recommended public categories:

- default field renderer registry
- default layout renderer registry
- optional individual renderer components
- default wrapper components if intentionally reusable

### Internal only

Keep internal:

- local styling implementation details not meant for reuse
- internal convenience wrappers that are not part of the renderer contract

## `@form/plugins-basic`

### Purpose

Expose built-in field, layout, validator, operator, and effect plugins.

### Public exports

Recommended public categories:

- ready-made plugin bundles
- individual built-in plugins if useful
- registration helpers

### Example

```ts
export {
  registerBasicPlugins,
  textFieldPlugin,
  selectFieldPlugin,
  gridLayoutPlugin,
} from "./...";
```

### Internal only

Keep internal:

- package-specific assembly helpers
- low-level plugin wiring details

## `@form/plugins-async`

### Purpose

Expose async data source and async validation plugins.

### Public exports

Recommended public categories:

- remote datasource plugin
- static datasource plugin
- async validator plugin
- async plugin bundle registration helper

### Internal only

Keep internal:

- caching internals
- retry orchestration internals
- private network coordination helpers

## Renderer-facing API boundary

Scaffolded or consumer-owned renderer files should only depend on:

- `@form/contract`
- `@form/core` public model types if needed
- `@form/react-rhf` renderer-facing hooks and prop types

They should not depend on:

- core internals
- registry internals
- private runtime pipeline functions

## Plugin author API boundary

Plugin authors should only need:

- contract types
- public plugin interfaces from `@form/core`
- public registration APIs

They should not need:

- React-specific APIs unless they are writing renderer code
- internal registry storage details
- internal graph planner details

## Internal vs public naming rule

Use naming and file placement to signal API status.

Recommended pattern:

- package root exports public symbols
- modules in `internal/` or non-exported folders remain private

## Stability levels

The project should eventually label public exports by stability level:

- `stable`
- `experimental`
- `internal`

For now, the minimum rule is:

- keep public surface small
- do not export speculative APIs too early

## Constraints

1. no consumer should need deep imports into package internals
2. scaffolded UI files must be able to work from documented public exports only
3. plugin authors should not need private runtime knowledge
4. React consumers should not need to understand internal orchestration details

## Implementation rule

Once packages are scaffolded, every package should enforce this document through:

- `src/index.ts`
- package export maps
- tests that prevent accidental deep-import dependencies

## Final recommendation

Define public APIs first, then scaffold packages around them.

This prevents package structure from becoming public API by accident.
