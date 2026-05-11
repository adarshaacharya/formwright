# Frontend Composition Pattern

## Purpose

Define the preferred frontend integration pattern for the engine so the React API stays composable, extensible, and maintainable.

## Decision

The frontend integration should use a composable pattern built around:

- a small root provider API
- runtime hooks
- focused renderer components
- wrapper composition

The engine should avoid a giant prop-driven renderer component as the main API.

## Why this decision matters

This engine needs to support:

- many field types
- many layout types
- custom renderers
- wrapper overrides
- plugin extensions
- consumer-owned UI

A large prop-heavy API becomes difficult to evolve and difficult to customize cleanly.

## Preferred structure

### 1. Root provider

The top-level React entry should establish runtime context.

Example direction:

```tsx
<FormRuntimeProvider form={form} plugins={plugins} context={context}>
  <FormRuntimeRoot />
</FormRuntimeProvider>
```

The root API should stay small and declarative.

## 2. Hook-based access

Renderer and layout files should consume focused runtime hooks instead of large generic prop bags.

Recommended hook direction:

- `useFormRuntime()`
- `useFormField(path)`
- `useFormLayout(id)`
- `useDatasourceOptions(path)`

These hooks should expose plain React-friendly data.

## 3. Focused renderer components

Field renderers should be small and field-specific.

Example direction:

```tsx
function TextFieldRenderer({ path }: { path: string }) {
  const field = useFormField(path);
  return null;
}
```

The point is not this exact API shape, but the principle:

- focused renderer
- focused hook
- local ownership of markup

## 4. Wrapper composition

Common field UI should be composed from wrappers instead of being embedded in one monolithic renderer.

Examples:

- field shell
- label
- description
- error message
- hint text

This allows consumers to swap wrappers independently from field semantics.

## What to avoid

The frontend should avoid a single mega component with too many extension props.

Bad direction:

```tsx
<FormRenderer
  schema={schema}
  fieldComponents={...}
  layoutComponents={...}
  wrappers={...}
  validators={...}
  onFieldChange={...}
  onRuleError={...}
  onLayoutResolve={...}
  ...
/>
```

That shape turns the root component into a dumping ground.

## Composition model

The frontend should be composed across these layers:

### Runtime provider layer

Owns runtime context and registration.

### Runtime hook layer

Owns field/layout state access.

### Renderer layer

Owns field and layout visual rendering.

### Wrapper layer

Owns shell components and presentation structure.

## Public frontend surface

The React-facing public API should focus on:

- provider components
- root runtime component
- runtime hooks
- renderer-facing prop types

It should not expose:

- private orchestration internals
- registry internals
- graph evaluation internals

## Benefits of the composable pattern

- easier customization
- clearer ownership boundaries
- less prop explosion
- better local renderer ergonomics
- better long-run maintainability
- easier design-system integration

## Relationship to scaffolded UI

This pattern fits the scaffolded UI model well.

Consumers can own:

- field renderer files
- layout renderer files
- wrapper files

while relying on packaged hooks and runtime contracts.

## Prop usage guidelines

Props are still appropriate for:

- provider configuration
- renderer-local inputs
- wrapper-local customization
- narrow adapter options

Props are not appropriate as the main vehicle for:

- global renderer extension
- all field/layout substitutions
- complex runtime control

## Design constraint

Renderer components should consume prepared runtime state.

They should not:

- normalize schema
- evaluate business rules
- resolve plugin internals
- own cross-field orchestration logic

## Final recommendation

The React frontend API should feel like a headless composable runtime with consumer-owned rendering, not like a single configurable mega component.
