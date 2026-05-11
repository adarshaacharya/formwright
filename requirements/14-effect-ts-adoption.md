# Effect TS Adoption

## Status

Proposed architecture decision

## Decision

Effect TS is allowed and encouraged in platform internals where orchestration complexity is expected to grow over time.

Effect TS should not be required for the public customization surface of the framework.

## Why this decision exists

The project goal is to build a complex, long-run form platform with:

- backend-driven schemas
- dynamic behavior
- async data sources
- plugin-based extensibility
- long-lived runtime logic

These are areas where Effect can provide real value.

At the same time, the project also aims to offer:

- consumer-owned UI
- scaffolded renderer files
- design-system integration
- low-friction adoption

Those goals are harmed if Effect leaks into the public UI layer.

## Approved use cases for Effect

Effect is a good fit for:

- schema normalization pipelines
- rule evaluation orchestration
- async option loading
- retries and timeouts
- cancellation and interruption
- typed error modeling
- service dependency injection
- observability and tracing
- server validation pipelines
- workflow and submission orchestration

## Packages where Effect is recommended

### `@form/core`

Recommended uses:

- rule engine execution
- plugin orchestration
- dependency graph handling
- runtime service boundaries

### `@form/plugins-async`

Recommended uses:

- remote option loading
- retry logic
- timeout handling
- request cancellation
- async dependency invalidation

### Backend services

Recommended uses:

- schema delivery
- submission flows
- server-side validation
- workflow transitions
- auditability and observability

## Packages where Effect should not leak into the public surface

### `@form/contract`

The exported contract should stay plain serializable TypeScript shapes.

Internal tooling may use Effect, but published schema types must not require it.

### `@form/react-rhf`

Public hooks and adapter APIs should remain plain React and TypeScript.

Consumers should not need Effect knowledge to bind fields or render forms.

### Scaffolded renderers and layouts

Consumer-owned files should stay plain React components.

They should not require:

- `Effect`
- `Layer`
- `Context`
- Effect runtime bootstrapping

## Public API policy

The public API should follow this rule:

- expose plain objects, functions, hooks, and React props
- hide Effect behind stable adapters and service boundaries

This allows:

- strong internals
- easier onboarding
- lower contributor friction
- better compatibility with normal React application code

## What not to do

Avoid these patterns:

- requiring plugin authors to return `Effect` for simple registration
- making renderer components Effect-aware
- exposing `Layer` composition as the default extension path
- forcing application teams to understand Effect for basic customization

## Acceptable internal-to-external boundary

Good pattern:

- internal core service uses Effect
- public hook resolves runtime state into plain props
- scaffolded renderer consumes plain props and callbacks

## Migration strategy

This decision intentionally keeps adoption incremental.

Recommended sequence:

1. keep contract types plain
2. keep React-facing APIs plain
3. introduce Effect inside core services and async orchestration where complexity justifies it
4. avoid exposing Effect in generated UI code

## Benefits of this approach

- preserves a serious internal platform architecture
- avoids pushing functional abstractions onto every consumer
- allows long-run runtime complexity to be modeled rigorously
- keeps the customization story approachable and `shadcn`-friendly

## Risks

### Risk: split mental model

The team may need to work with both Effect-style internals and plain React-style externals.

This is acceptable if package boundaries are clean.

### Risk: accidental API leakage

If internal Effect abstractions leak into public APIs, adoption cost rises sharply.

This should be treated as an architecture violation.

### Risk: premature complexity

Using Effect in simple packages without orchestration needs will add cost without benefit.

Use it where it solves real complexity.

## Final policy

- Effect is a platform-internal tool
- Effect is not a consumer customization requirement
- public renderer and plugin ergonomics should remain standard TypeScript and React
