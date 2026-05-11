# Devtools And Explainability

## Purpose

Define the introspection and debugging requirements needed for a dynamic form platform to stay operable as complexity grows.

Without explainability, dynamic behavior becomes too opaque for maintainers, plugin authors, reviewers, and support teams.

## Core principle

Every important dynamic outcome in the runtime should be inspectable and explainable.

Examples:

- why a field is hidden
- why a field is disabled
- why a field is required
- why options changed
- why a computed value changed
- why submit is blocked

## Devtools goals

The platform should provide visibility into:

- resolved schema
- runtime state
- rule execution
- plugin resolution
- data source activity
- validation decisions
- performance hotspots

## Minimum devtools panels

Recommended future panels:

### 1. Resolved schema panel

Shows:

- normalized form definition
- resolved field metadata
- resolved layout tree
- active plugin mappings

### 2. Runtime state panel

Shows:

- current form values
- derived field states
- active workflow state
- UI state

### 3. Rules panel

Shows:

- all registered rules
- which rules evaluated
- which rules matched
- effects produced by each rule
- target fields or layouts affected

### 4. Data source panel

Shows:

- registered data sources
- loading states
- dependencies
- last request timestamp
- cache hits and misses
- failures and retries

### 5. Validation panel

Shows:

- static validation failures
- dynamic validation failures
- server validation failures
- blocking vs non-blocking issues

### 6. Performance panel

Shows:

- rule evaluation counts
- render counts
- expensive fields or layouts
- async latency hotspots

## Explainability requirements

The runtime should be able to produce structured explanations for dynamic decisions.

Recommended explanation categories:

- visibility explanation
- enabled/disabled explanation
- requiredness explanation
- computed value explanation
- validation explanation
- action availability explanation

## Example explainability shape

The implementation should eventually support an explanation object similar to:

```ts
interface DecisionExplanation {
  target: string;
  decisionType: string;
  result: unknown;
  inputs: string[];
  rulesApplied: string[];
  effectsApplied: string[];
  notes?: string[];
}
```

This is not a final API, but it captures the intent.

## Rule tracing

The rule engine should support optional tracing.

Trace content may include:

- evaluation start and end
- operator-level results
- resolved variable values
- matched conditions
- emitted effects

Tracing should be optional to avoid production overhead.

## Plugin diagnostics

The platform should expose:

- registered plugins
- plugin source or package identity
- version
- capabilities contributed
- conflicts or overrides

This is important once third-party plugins exist.

## Runtime invariants visibility

Devtools should make it visible when invariants fail.

Examples:

- unknown field reference
- unknown layout reference
- invalid rule target
- plugin registration conflict
- cyclic dependency in computed fields or rules

## Reviewer and support use cases

Explainability is not only for engineers.

It should also support:

- reviewer debugging of locked or conditional fields
- admin support for failed submissions
- customer support investigation of why a user could not proceed

## Logging and trace export

The platform should eventually support exporting diagnostic traces for:

- local debugging
- CI failure investigation
- production issue reproduction

## Production safety

Explainability and devtools must not leak sensitive values by default.

The platform should allow:

- redaction
- role-based inspection controls
- environment-based diagnostics levels

## Consequence

An extraordinary dynamic form platform needs first-class introspection.

Explainability should be treated as part of the runtime design, not as a debugging afterthought.
