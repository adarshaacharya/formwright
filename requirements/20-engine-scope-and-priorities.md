# Engine Scope And Priorities

## Purpose

Refocus the project around its actual goal:

- a powerful schema-driven form engine

This project is not currently intended to be a full workflow or multi-tenant platform.

## Product definition

The product should be defined as:

> A headless, schema-driven form engine for React that accepts a form schema and renders dynamic forms using a powerful runtime powered by React Hook Form.

## Input and output

### Input

- form schema
- optional runtime context
- optional plugin registrations
- optional custom renderers and layouts

### Output

- rendered dynamic form
- managed form state
- evaluated behavior rules
- render-ready field and layout models

## Core engine responsibilities

The engine must own:

- schema parsing and normalization
- field resolution
- layout resolution
- rule evaluation
- derived field state
- data source integration
- validation integration
- React Hook Form binding
- plugin registration and resolution
- renderer and layout customization

## Out of core scope for now

These are not core engine requirements at this stage:

- workflow engine
- review and approval states
- form submission business lifecycle
- tenant schema management
- access control policy engine
- admin visual builder studio
- platform-grade persistence systems

These may become future layers, but they should not define the engine architecture today.

## Still allowed in engine scope

The engine may still support lightweight runtime context such as:

- `mode`
- `userRole`
- `featureFlags`
- `locale`

This is acceptable as long as it supports rendering and behavior, not a full policy platform.

## Core subsystems

### 1. Contract subsystem

Owns:

- form schema shape
- field definitions
- layout definitions
- behavior definitions

### 2. Runtime subsystem

Owns:

- normalization
- resolution
- rule execution
- derived state
- data-source orchestration

### 3. React integration subsystem

Owns:

- React Hook Form binding
- subscriptions
- render-model exposure
- React hooks and providers

### 4. Rendering subsystem

Owns:

- field renderers
- layout renderers
- wrappers
- consumer-owned UI customization

### 5. Extensibility subsystem

Owns:

- plugin registration
- custom field types
- custom layout types
- custom operators
- custom validators
- custom data sources

## Core quality bar

To be considered successful, the engine should be:

- highly dynamic
- headless-first
- deeply extensible
- performance-conscious
- testable
- renderer-agnostic
- maintainable over time

## What makes this engine powerful

The engine should not only map field types to components.

It should also handle:

- layout trees
- conditional field logic
- nested object structures
- repeaters and arrays
- computed values
- dynamic requiredness
- async options
- custom plugins

## Core requirements set

The following documents should be treated as core to implementation:

- `01-product-goals.md`
- `02-architecture-principles.md`
- `03-headless-and-extensibility.md`
- `04-schema-contract.md`
- `05-behavior-and-rules.md`
- `06-rendering-and-layout.md`
- `07-react-hook-form-runtime.md`
- `08-plugin-system.md`
- `09-package-structure.md`
- `10-v1-scope.md`
- `11-schema-types-rfc.md`
- `13-packaged-vs-scaffolded.md`
- `14-effect-ts-adoption.md`
- `15-architecture-and-coding-principles.md`
- `16-package-folder-structure.md`
- `19-devtools-and-explainability.md`

## Future or optional documents

The following should be considered future expansion material, not blockers for engine implementation:

- `17-workflow-and-submission-lifecycle.md`
- `18-persistence-versioning-and-migrations.md`

## Immediate implementation priorities

The implementation should focus on:

1. contract package
2. core runtime package
3. React Hook Form adapter package
4. default renderer package
5. basic plugin package
6. async plugin package
7. demo app

## Final direction

This project should be treated as a form engine with platform-quality internal architecture, not as a full product platform from day one.
