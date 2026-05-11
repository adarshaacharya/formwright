# Schema Contract

## Decision

The top-level contract should be split into four major parts:

- `version`
- `formId`
- `meta`
- `dataSchema`
- `uiSchema`
- `behaviorSchema`

## Example top-level shape

```json
{
  "version": "1.0",
  "formId": "customer-onboarding",
  "meta": {},
  "dataSchema": {},
  "uiSchema": {},
  "behaviorSchema": {}
}
```

## `meta`

Carries non-rendering runtime metadata.

Recommended examples:

- title
- description
- mode
- locale
- tenant
- workflow state
- permissions
- feature flags

## `dataSchema`

Defines the legal data model and static validation semantics.

Recommended properties:

- `rootType`
- `fields`

Recommended field-level properties:

- `valueType`
- `required`
- `default`
- `enum`
- `const`
- `minLength`
- `maxLength`
- `pattern`
- `minimum`
- `maximum`
- `exclusiveMinimum`
- `exclusiveMaximum`
- `multipleOf`
- `format`
- `itemType`
- `itemSchema`
- `serverValidation`

## Field path strategy

Use dot-paths consistently.

Examples:

- `contact.email`
- `company.name`
- `addresses[0].city`

This aligns well with nested React Hook Form field names.

## `uiSchema`

Defines presentation and positioning.

Recommended internal split:

- `nodes`
- `layout`

### `uiSchema.nodes`

Defines per-field presentation metadata.

Recommended properties:

- `fieldType`
- `label`
- `description`
- `helpText`
- `placeholder`
- `widget`
- `componentProps`
- `wrapperProps`
- `styleTokens`
- `accessibility`
- `options`
- `dataSource`

### `uiSchema.layout`

Defines a tree-based layout structure.

Recommended node types:

- `section`
- `grid`
- `stack`
- `tabs`
- `stepper`
- `field`
- `divider`

## `behaviorSchema`

Defines dynamic behavior over time.

Recommended internal split:

- `rules`
- `dataSources`
- `computed`
- `lifecycle`
