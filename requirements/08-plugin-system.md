# Plugin System

## Goal

The framework should be extensible without consumers modifying core packages.

## Plugin categories

Recommended plugin categories:

- field plugins
- layout plugins
- behavior plugins
- validator plugins
- operator plugins
- integration plugins

## Field plugin responsibilities

A field plugin should be able to define:

- semantic type
- supported value types
- schema normalization
- default value resolution
- validation mapping
- serialization
- deserialization
- renderer key
- builder metadata in the future

## Layout plugin responsibilities

A layout plugin should define:

- layout type
- supported child patterns
- layout-specific props
- renderer integration details

## Behavior plugin responsibilities

A behavior plugin should define:

- rule operators
- effects
- computed helpers
- async source resolvers

## Required registries

At minimum the framework should expose registries for:

- field plugins
- layout plugins
- validators
- operators

Later expansion can add:

- wrappers
- action handlers
- theme adapters

## Extension requirements

Consumers should be able to:

- replace a built-in field renderer
- add a new field type
- add a new layout type
- add a custom operator
- add a domain-specific async source

## Constraint

Avoid a central hardcoded switch statement as the only extension mechanism.
