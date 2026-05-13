# Renderer Extension Modes

Formwright must support three distinct UI extension modes without collapsing them into one prop-heavy API.

## 1. Slot Override

Use slots when the consumer wants to replace only a sub-part of a field or array renderer.

Examples:
- custom label
- custom control
- custom error presentation
- custom array item shell

This mode keeps the field semantics and default composition intact while replacing the visual fragment.

## 2. Composer-Based Custom Renderer

Use the composer helpers when the consumer wants to build a custom renderer but still reuse the framework’s shell, label, help, error, and array composition logic.

Examples:
- a design-system-specific text field
- a branded select control
- a custom array row layout

This mode is the recommended path for most consumer-authored renderers.

## 3. Full Renderer Replacement

Use renderer map replacement when the consumer wants to replace the entire renderer for a semantic key.

Examples:
- a custom `country-select` renderer
- a `signature-pad` renderer
- a `file-dropzone` renderer

This mode is appropriate for new widgets or domain-specific visual behavior.

## Required Rules

- The default primitives must remain available.
- Slots must not require consumers to reimplement full field composition.
- Composer helpers must be exported as public API.
- Renderer maps must remain supported for full replacement.
- New semantic input types should be implemented as plugins when they change data semantics, not only visuals.

## Boundary Rule

If the change is only about markup or styling, prefer slots or composer helpers.

If the change introduces a new value type, serialization rule, validation rule, or datasource behavior, prefer a plugin.

