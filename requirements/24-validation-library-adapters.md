# Validation Library Adapters

## Purpose

Define how Formwright should support external validation libraries in a pluggable and scalable way.

## Decision

Validation in Formwright should support three layers:

1. built-in schema-to-RHF validation mapping
2. optional external library adapters
3. custom validator plugins

This allows sensible defaults while preserving flexibility for advanced use cases.

## Layer 1: built-in validation

The engine should provide default mapping from `dataSchema` into RHF rules.

Examples:

- `required`
- `minLength`, `maxLength`
- `pattern`
- `format`
- `minimum`, `maximum`
- `enum`
- `const`

This should work without extra configuration.

## Layer 2: external library adapters

Users should be able to use libraries such as:

- Zod
- Yup
- Valibot
- AJV / JSON Schema validators

Adapters should integrate through a stable contract, not ad hoc custom logic in each app.

## Layer 3: validator plugins

Users should be able to register custom validators for:

- field-level checks
- cross-field checks
- domain-specific logic

These validators should integrate with the same runtime evaluation and error projection model.

## Adapter contract direction

Formwright should support a validation adapter interface similar to:

```ts
interface ValidationAdapter {
  name: string;
  validate(values: Record<string, unknown>): Promise<ValidationAdapterResult> | ValidationAdapterResult;
}

interface ValidationAdapterResult {
  valid: boolean;
  errors: Array<{
    path: string;
    message: string;
    code?: string;
  }>;
}
```

The exact naming may evolve, but the shape should stay consistent.

## React Hook Form integration direction

`@formwright/react-rhf` should support:

- default built-in rule mapping
- optional external resolver/adapter configuration
- deterministic merge strategy for errors

## Error precedence

A clear precedence order is required.

Recommended order:

1. external adapter or resolver errors
2. plugin validator errors
3. built-in mapper errors

The final order may be adjusted, but it must be explicit and documented.

## Config strategy

The adapter configuration should be supplied at runtime provider level.

Recommended direction:

- `FormRuntimeProvider` accepts optional validation config
- config can point to resolver and/or adapter plugins

## Package strategy

Library-specific adapters should live in separate packages.

Examples:

- `@formwright/validation-zod`
- `@formwright/validation-yup`
- `@formwright/validation-ajv`

This keeps core and react-rhf packages lightweight.

## Constraints

1. core runtime should not hardcode a single validation library
2. external adapters should remain optional
3. built-in validation should continue to work without adapters
4. validation wiring should be predictable and testable

## Testing requirements

Validation adapter support should be covered by:

- unit tests for adapter output mapping
- integration tests with RHF error projection
- conflict tests for merged error sources

## Implementation roadmap

1. stabilize built-in mapper behavior
2. define public validation adapter types in core/react-rhf
3. add provider-level adapter configuration
4. ship first adapter package (`validation-zod`)
5. add adapter demo scenario in demo app
