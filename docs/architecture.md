# Formwright Architecture

Formwright is a schema-driven form engine for React Hook Form.

The goal is not to build a full form platform. The goal is to provide a highly customizable rendering engine that can:

- consume a declarative schema
- resolve layout and behavior dynamically
- render with default primitives out of the box
- let consumers override any visual layer
- let consumers replace renderers entirely when needed

## Core Layers

### 1. Contract Layer

Package:
- `@formwright/contract`

Owns:
- form definition types
- data schema
- UI schema
- behavior schema
- rule expressions and effects

This layer is declarative. It should not contain UI code or React concerns.

### 2. Runtime Core

Package:
- `@formwright/core`

Owns:
- schema normalization
- field and layout resolution
- rule evaluation
- effect application
- plugin registry
- datasource orchestration
- runtime context

This layer is framework-agnostic and should remain React-free.

### 3. React Hook Form Adapter

Package:
- `@formwright/react-rhf`

Owns:
- RHF provider integration
- field and array hooks
- datasource hooks
- runtime root rendering
- slot-based renderer composition

This layer binds the engine to React Hook Form but does not own business semantics.

### 4. Default Renderers

Package:
- `@formwright/renderers-default`

Owns:
- default primitives
- default array renderer
- default layout renderer

This package stays lightweight and native-first. It exists for convenience and as a reference implementation, not as the only customization path.

### 5. Plugins

Packages:
- `@formwright/plugins-basic`
- `@formwright/plugins-async`

Own:
- operators
- effects
- validators
- datasource loaders

Plugins extend semantics. They are the correct place for new field behavior, not just new visual markup.

## Extension Model

Formwright supports three UI extension modes.

### Slot Override

Use slots when you want to replace only one piece of a field or array composition.

Example:
- custom label
- custom control
- custom error
- custom array item shell

This is the most surgical override path.

### Composer-Based Custom Renderer

Use the composer helpers when you want to build a custom renderer while reusing the framework’s composition model.

Example:
- design-system-specific text field
- branded select
- custom array row layout

This is the recommended path for most custom renderer authors.

### Full Renderer Replacement

Use a renderer map entry when you want to replace the whole semantic renderer.

Example:
- `country-select`
- `signature-pad`
- `file-dropzone`

This is appropriate for custom widgets and domain-specific controls.

## Default Primitives

The default renderer layer should remain:

- simple
- dependency-light
- native HTML-based where possible
- easy to override

It should not lock the engine to Radix, React Aria, or any other UI kit.

Optional adapter packages can be added later for specific design systems.

## Public Boundary Rule

The public API should follow this boundary:

- schema expresses meaning
- runtime resolves meaning
- renderers express visuals
- plugins extend semantics

That separation keeps the library scalable and prevents the UI layer from accumulating business rules.

## API Examples

### 1. Slot Override

```tsx
<FormRuntimeRoot
  fieldSlots={{
    Control: ({ defaultControl }) => <>{defaultControl}</>,
  }}
/>
```

Use this when you want to replace only one visual piece.

### 2. Composer-Based Custom Renderer

```tsx
import { FieldComposer, type RenderFieldProps } from "@formwright/react-rhf";

function CountrySelectRenderer(props: RenderFieldProps) {
  return (
    <FieldComposer
      field={props.field}
      state={props.state}
      label={props.field.uiField?.label ?? props.field.path}
      description={props.field.uiField?.description}
      helpText={props.field.uiField?.helpText}
      error={props.error}
    >
      <select
        value={(props.value as string | undefined) ?? ""}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </FieldComposer>
  );
}
```

Use this when you want a custom widget but still want the framework to manage composition.

### 3. Full Renderer Replacement

```tsx
<FormRuntimeRoot
  fieldRendererMap={{
    "country-select": CountrySelectRenderer,
  }}
/>
```

Use this when the whole renderer should be replaced for a semantic key.
