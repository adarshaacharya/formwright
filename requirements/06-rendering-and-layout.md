# Rendering And Layout

## Principle

Schema should describe rendering intent, while the frontend registry should resolve actual components.

## Renderer resolution

Schema should say:

- `fieldType: "text"`

Frontend should resolve:

- `"text"` to a consumer-provided or default input component

Optional advanced hint:

- `renderer`

This can be used for visual variants without changing semantic type.

## Layout model

Layout should be represented as a tree, not as scattered layout props across every field.

Recommended layout containers:

- section
- grid
- stack
- tabs
- stepper
- divider

## Why tree-based layout

It enables:

- nested sections
- responsive grouping
- easy reordering
- container-specific behavior
- specialized array item shells

## Arrays and repeaters

Arrays need dedicated handling instead of pretending they are normal scalar fields.

Array support should include:

- item schema
- item layout
- add and remove controls
- reorder support later
- nested object items

## Styling ownership

Consumers should own styling through renderer and wrapper overrides, not through backend schema carrying raw CSS or JSX.
