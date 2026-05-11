# Architecture Principles

## Primary recommendation

Build this as a package-based framework with a reference application, not as a boilerplate-only project.

## Why packages instead of only boilerplate

Boilerplate helps a single app start quickly, but it does not produce a reusable platform.

Packages let us create:

- a stable schema contract
- a reusable runtime engine
- pluggable renderers
- shared validation and behavior logic
- multiple frontend integrations over time

## Core separation of concerns

The framework should separate:

- data semantics
- UI presentation
- dynamic behavior
- rendering implementation

This avoids turning the schema into one large unstructured blob.

## Four-layer model

### 1. Contract layer

Defines the schema sent from backend to frontend.

### 2. Runtime engine

Resolves schema, rules, dependencies, defaults, and state transitions.

### 3. Renderer layer

Maps abstract field and layout types to actual React components.

### 4. Plugin layer

Allows consumers to register new field types, layouts, validators, operators, and integrations.

## Constraint

Backend should send declarative intent, not React components or executable UI code.
