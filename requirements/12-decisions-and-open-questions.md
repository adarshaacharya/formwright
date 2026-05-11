# Decisions And Open Questions

## Confirmed decisions

### 1. Product shape

This should be a package-based framework with at least one example app, not just a boilerplate template.

### 2. Rendering model

The architecture should be headless-first with an optional default renderer kit.

### 3. State engine

React Hook Form should power the React runtime adapter, but it should not define the framework contract.

### 4. Schema split

The form contract should be split into:

- `dataSchema`
- `uiSchema`
- `behaviorSchema`

### 5. Extensibility model

The framework should support:

- override for presentation replacement
- registration for new semantic capabilities

### 6. Backend/frontend contract

Backend should send declarative schema only.

Frontend should resolve local components through registries.

## Open questions

### 1. Standards alignment

How close should `dataSchema` stay to formal JSON Schema?

Tradeoff:

- closer to JSON Schema improves interoperability
- a custom contract may improve DX and runtime simplicity

### 2. Expression language

Should rule expressions be:

- JSON Logic-like
- custom DSL
- operator tree with strict typing

Recommendation:

- start with a typed operator tree

### 3. Array schema depth

Should arrays support:

- only primitive and object items in v1
- nested arrays in v1

Recommendation:

- support object items first
- postpone nested array complexity unless required

### 4. Data source abstraction

Should remote data sources be:

- purely declarative endpoint definitions
- abstract provider ids resolved by the frontend/backend

Recommendation:

- support declarative endpoint config in v1
- leave room for provider-based resolution later

### 5. Theming contract

Should `styleTokens` exist in the backend schema from day one?

Risk:

- backend starts leaking design concerns

Recommendation:

- keep style tokens optional and minimal

### 6. Field path policy

Do we want:

- path strings only
- path strings plus stable field ids

Recommendation:

- path strings now
- introduce stable node ids if builder tooling needs them later

### 7. Submission pipeline

Should submission behavior live:

- partly in schema lifecycle
- entirely in host app code

Recommendation:

- keep schema lifecycle limited
- host application should still own final submission orchestration

## Risks

### Overloading the schema

If too many concerns are added to a single contract, the system becomes difficult to reason about and migrate.

### Tying core to React too early

If React concerns leak into core, it becomes harder to test and harder to support other runtimes later.

### Plugin API instability

If extension points are vague, consumers will work around the framework instead of extending it cleanly.

## Recommended next decisions

1. decide how strict the expression DSL should be
2. decide how close `dataSchema` should stay to JSON Schema
3. decide whether remote data sources are endpoint-based or provider-based in v1
