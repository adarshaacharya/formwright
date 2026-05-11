# V1 Scope

## Goal

Validate the architecture with a narrow but representative feature set instead of trying to build the entire platform at once.

## V1 should include

### Data model

- primitive fields
- nested object paths
- arrays and repeaters

### Presentation

- labels
- placeholders
- help text
- grid layout
- sections

### Behavior

- show and hide rules
- enable and disable rules
- dynamic requiredness
- static options
- async options

### Runtime

- React Hook Form integration
- field arrays
- validation mapping
- error display plumbing

### Extensibility

- renderer overrides
- custom field plugin registration
- custom layout registration

## V1 should not include

- full drag-and-drop form designer
- massive workflow automation engine
- arbitrary code execution in schema
- deep theming system before the override model is proven

## Recommended implementation order

1. schema contract
2. core runtime interfaces
3. RHF adapter
4. default renderers
5. rules engine
6. async data sources
7. plugin registration
