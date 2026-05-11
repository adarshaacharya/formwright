# Headless And Extensibility

## Decision

The framework should be headless-first with an optional default renderer kit.

## Reasoning

This allows consumers to:

- own styling
- integrate with their design system
- replace any built-in component
- extend the platform with custom field types and plugins

If the framework is tightly coupled to its own UI kit, it becomes restrictive.

## Three UI ownership layers

### 1. Headless core

Owns:

- schema parsing
- validation wiring
- rule evaluation
- layout resolution
- state orchestration
- plugin lifecycle

This layer should not render visual UI directly.

### 2. Default renderer kit

Provides:

- default field components
- default wrappers
- default layouts

This gives consumers a fast starting point and acts as a reference implementation.

### 3. Consumer-supplied registry

Consumers should be able to override:

- field renderers
- layout renderers
- wrappers
- labels
- help text
- error presenters
- section shells

## Two extension mechanisms

### Override

Use when semantics stay the same but visuals change.

Example:

- keep `fieldType: "text"`
- replace the text input component

### Register

Use when consumers introduce new semantics.

Example:

- add `fieldType: "signature"`
- define validation, serialization, and rendering behavior

## Rule

Core should know semantics, not visuals.
