# Package Structure

## Recommendation

Use a monorepo with packages for reusable framework pieces and apps for verification and examples.

## Suggested packages

### `packages/schema-contract`

Contains:

- schema types
- schema parser
- normalization logic
- versioning support
- migration helpers

### `packages/form-core`

Contains:

- plugin registry
- schema resolution
- rule engine
- dependency graph
- runtime orchestration interfaces

This package should be framework-agnostic.

### `packages/form-react-rhf`

Contains:

- React runtime integration
- React Hook Form adapter
- field binding hooks
- array support
- submission integration

### `packages/renderers-default`

Contains:

- default field renderers
- default wrappers
- default layouts

### `packages/plugins-basic`

Contains:

- built-in primitive field plugins
- standard operators
- standard validators

### `packages/plugins-async`

Contains:

- remote option loading
- async validations
- async dependency helpers

## Suggested apps

### `apps/demo`

Used to validate:

- schema authoring
- dynamic rendering
- overrides
- plugin registration

### `apps/docs-demo`

Used for:

- examples
- docs screenshots
- reference implementation behavior
