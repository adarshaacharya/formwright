# Playground Extension Examples

This playground demonstrates the three supported UI extension modes in Formwright.

## 1. Slot Override

Use a slot when you want to replace only one part of the field composition.

Example:
- `contact.email` overrides only the `Control` slot
- the shell, label, help, and error stay default

## 2. Composer-Based Custom Renderer

Use the composer helpers when you want a custom renderer but still want the framework to handle composition.

Example:
- `CountrySelectRenderer` uses `FieldComposer`
- the renderer owns the control markup
- the framework still handles shell, label, help, and error

## 3. Full Renderer Replacement

Use a renderer map entry when you want to replace the whole semantic renderer.

Example:
- `country` uses `renderer: "country-select"`
- `fieldRendererMap["country-select"]` points to `CountrySelectRenderer`

## Rule of Thumb

- Styling or markup change only: use a slot
- Custom widget with framework composition: use a composer
- New semantic widget or domain-specific control: use a renderer map entry or plugin

