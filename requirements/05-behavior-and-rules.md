# Behavior And Rules

## Goal

Dynamic logic should live in a dedicated behavior layer instead of being forced into raw UI configuration or arbitrary code snippets.

## Rules model

Rules should use a safe declarative expression DSL.

Recommended shape:

```json
{
  "id": "show-company-fields",
  "when": {
    "eq": [{ "var": "accountType" }, "company"]
  },
  "effects": [
    { "type": "show", "target": "company.name" }
  ]
}
```

## Initial operators

- `eq`
- `neq`
- `gt`
- `gte`
- `lt`
- `lte`
- `in`
- `and`
- `or`
- `not`
- `exists`

## Initial effects

- `show`
- `hide`
- `enable`
- `disable`
- `require`
- `setValue`
- `clearValue`
- `setOptions`
- `setLayoutProp`

## Computed values

Computed values should be declared separately from rules.

Use cases:

- derived display name
- normalized fields
- summary fields

## Data sources

Async and static options should be declared as data sources, not embedded as executable fetch code.

Recommended source types:

- `static`
- `remote`

Recommended properties:

- `dependsOn`
- `endpoint`
- `method`
- `queryMap`

## Lifecycle

Lifecycle actions should stay limited and declarative.

Examples:

- form load initialization
- pre-submit validation hooks
- submit target declaration

## Constraint

Do not allow arbitrary JavaScript in backend-delivered schema.
