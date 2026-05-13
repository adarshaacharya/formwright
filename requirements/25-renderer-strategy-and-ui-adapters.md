# Renderer Strategy And UI Adapters

## Purpose

Define how the form engine should provide default UI while preserving long-term flexibility for custom design systems and headless component libraries.

The key decision is:

- keep the engine headless
- keep the default renderer package lightweight
- add optional UI adapters later
- do not couple the engine to a single visual library too early

## Requirements

### 1. Default renderers must stay simple

The default renderer package should use native HTML controls and minimal wrappers for:

- `input`
- `select`
- `textarea`
- basic labels and errors
- basic layout shells
- basic array controls

This keeps the baseline:

- easy to debug
- low dependency
- easy to replace
- useful as a reference implementation

### 2. The engine must not depend on a UI library

Core runtime packages must not depend on:

- Radix UI
- React Aria
- shadcn
- any design system-specific primitives

The runtime should only expose:

- resolved field state
- resolved layout state
- values
- errors
- validation and datasource hooks

### 3. UI adapters should be optional packages

If richer primitives are needed later, they should ship as separate packages such as:

- `@formwright/renderers-radix`
- `@formwright/renderers-react-aria`
- `@formwright/renderers-shadcn`

These packages should consume the same renderer contracts as the default renderers.

### 4. Renderer composition must remain override-friendly

Consumers must be able to replace:

- field renderers
- array renderers
- layout renderers
- wrappers
- labels
- error presentation

without forking the engine or the runtime adapter.

### 5. UI adapter packages must not change schema semantics

Changing the renderer library must not require changing:

- `dataSchema`
- `behaviorSchema`
- runtime evaluation rules
- plugin APIs

Adapters are presentation concerns only.

## Design Guidance

### Default path

Use native HTML in `renderers-default`:

- direct inputs
- direct select elements
- direct textareas
- simple buttons for arrays

### Future path

Add adapter packages when the need is real:

- Radix if you want composable primitive building blocks
- React Aria if you want richer accessibility primitives
- any design-system adapter if the consumer wants full ownership

### Package boundaries

Recommended split:

- `@formwright/core` for runtime and evaluation
- `@formwright/react-rhf` for RHF integration and runtime hooks
- `@formwright/renderers-default` for native baseline UI
- optional `@formwright/renderers-*` packages for richer adapters

## Non-Goals

- baking Radix or React Aria into the core runtime
- requiring a design system to use the engine
- making the default package depend on heavy UI primitives before there is a real need
- turning the default renderer package into a design system

## Decision

The default renderer layer stays minimal and native-first.

Headless UI libraries are reserved for optional adapter packages only.
