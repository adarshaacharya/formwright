# Architecture And Coding Principles

## Purpose

Define the coding patterns and structural rules required to keep the form builder maintainable as a long-run, complex platform.

This document is intended to guide implementation decisions across packages.

## Core principle

Separate these concerns aggressively:

1. schema and contract definitions
2. pure domain and runtime logic
3. side effects and async orchestration
4. React integration
5. visual rendering

If these concerns blur together, the platform will degrade quickly.

## Recommended architecture style

Use a combination of:

- domain-driven package boundaries
- ports and adapters
- functional core, imperative shell
- registry-driven extensibility
- explicit typed contracts

## Functional core, imperative shell

### Pure core

Keep the following as pure functions wherever possible:

- schema normalization
- schema resolution
- field path resolution
- rule expression evaluation
- derived state calculation
- layout interpretation
- plugin metadata resolution

Expected qualities:

- deterministic
- side-effect free
- unit-testable without React or browser APIs

### Imperative shell

Keep orchestration concerns outside the pure core.

Examples:

- remote option loading
- async validation calls
- RHF subscriptions
- caching
- logging
- retries and cancellation
- submission transport

## Ports and adapters

External concerns should be modeled behind ports first, then implemented through adapters.

Recommended ports:

- schema source
- data source loader
- server validator
- submission transport
- analytics emitter
- persistence adapter

Benefits:

- testability
- backend independence
- easier mocking
- lower coupling

## Registry-driven extensibility

The system should prefer registries over hardcoded branching.

Required registries:

- field registry
- layout registry
- validator registry
- rule operator registry
- rule effect registry
- data source registry

Avoid giant switch statements as the primary extension mechanism.

## Typed structured rules

Treat rule definitions as typed data, not as strings or code snippets.

Allowed approach:

- typed operator trees
- explicit effect types
- explicit target references

Disallowed approach:

- raw JavaScript in schema
- string expressions with eval-like behavior
- UI components embedding business rule execution logic

## State layering

Do not store all state in one large mutable object.

Use explicit state layers:

### 1. Form value state

The actual user-provided values.

### 2. Derived runtime state

Examples:

- visibility
- disabled state
- requiredness
- computed values
- option loading state

### 3. UI state

Examples:

- current step
- active tab
- expanded section
- transient loading indicators

### 4. Workflow state

Examples:

- draft
- submitted
- approved
- locked

Each state layer should have clear ownership.

## Runtime pipeline

Think of the runtime as a pipeline with explicit phases.

Recommended phase order:

1. parse schema
2. normalize schema
3. register plugins
4. resolve field and layout nodes
5. evaluate rules against context
6. compute derived runtime state
7. produce render-ready models
8. bind to React Hook Form
9. render through consumer-owned components

This should be visible in the code structure.

## Package boundary rules

### Contract package

Allowed:

- types
- normalization contracts
- migrations
- schema parsing helpers

Disallowed:

- React
- network logic
- renderer concerns

### Core package

Allowed:

- schema resolution
- rule engine
- plugin registries
- runtime planning
- domain errors

Disallowed:

- direct React usage
- direct styling concerns
- renderer markup

### React adapter package

Allowed:

- React hooks
- RHF integration
- runtime-to-React bridging

Disallowed:

- business rules that should live in core
- arbitrary schema mutations

### Renderer packages or scaffolded renderer files

Allowed:

- visual composition
- wrapper usage
- design-system bindings
- interaction markup

Disallowed:

- hidden business-rule evaluation
- direct schema normalization logic
- backend transport concerns

## Naming principles

Name modules by responsibility, not generic utility language.

Prefer:

- `evaluateRuleExpression`
- `resolveLayoutNode`
- `normalizeFormDefinition`
- `registerFieldPlugin`
- `buildRenderModel`

Avoid:

- `utils`
- `helpers`
- `manager`
- `service` when it hides multiple responsibilities

## Module design rules

Each module should answer one clear question.

Examples:

- how is schema normalized
- how are rules evaluated
- how is a field plugin registered
- how are render models built

Avoid catch-all files.

## Error handling principles

Define explicit domain error types early.

Examples:

- `SchemaParseError`
- `SchemaNormalizationError`
- `UnknownFieldTypeError`
- `UnknownLayoutTypeError`
- `InvalidRuleExpressionError`
- `DataSourceResolutionError`
- `PluginRegistrationError`

Errors should identify:

- which subsystem failed
- which schema node or plugin caused it
- whether the issue is recoverable

## Public API principles

Public APIs should be:

- explicit
- typed
- ergonomic
- serializable where appropriate

Public APIs should not expose internal runtime complexity unnecessarily.

This is especially important if Effect is used internally.

## Testing strategy

Prioritize tests in this order:

1. pure unit tests for schema normalization
2. pure unit tests for rule evaluation
3. pure unit tests for derived state calculation
4. plugin registration and compatibility tests
5. adapter tests for RHF integration
6. end-to-end rendering tests for representative form scenarios

Most bugs will likely come from:

- conditional logic
- nested paths
- array handling
- plugin interactions
- async dependencies

## Documentation rule

Every major subsystem should have:

- purpose
- inputs and outputs
- extension points
- invariants

This project should not rely on implicit architecture knowledge.

## Constraints to enforce

1. no React imports outside React adapter and renderer packages
2. no network code in pure core modules
3. no business rule execution inside renderer components
4. no backend schema carrying executable frontend code
5. no core extensibility based only on hardcoded switch statements
6. no single mutable runtime object that owns every kind of state

## Final recommendation

Build the project as a headless runtime platform with:

- pure domain logic in the core
- adapter boundaries for effects and external systems
- registry-based extension points
- React integration isolated in its own package
- consumer-owned rendering kept thin and visual
