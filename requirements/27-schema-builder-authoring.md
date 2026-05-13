# Schema Builder Authoring

The normalized runtime contract in Formwright is `FormDefinition`.

That contract is correct for the engine, but it is too verbose for direct authoring at scale. Formwright should add a separate authoring layer that compiles into `FormDefinition`.

## Goal

Add a package:

- `@formwright/schema-builder`

This package should provide a typed, ergonomic authoring API for:

- fields
- layouts
- rules
- datasources
- form metadata

It should compile into a normalized `FormDefinition` for the runtime.

## Design Rule

Do not replace `FormDefinition`.

Instead:

- author with builder helpers
- compile to `FormDefinition`
- run the existing engine on the compiled output

## Recommended API Shape

### Root

```ts
const form = defineForm({
  id: "customer-onboarding",
  meta: {
    title: "Customer Onboarding",
    mode: "create",
  },
});
```

### Fields

```ts
const accountType = field.select("accountType", {
  label: "Account Type",
  options: [
    { label: "Individual", value: "individual" },
    { label: "Company", value: "company" },
  ],
  required: true,
  default: "individual",
});

const companyName = field.text("company.name", {
  label: "Company Name",
  placeholder: "Enter company name",
});

const email = field.email("contact.email", {
  label: "Contact Email",
  required: true,
});
```

### Arrays

```ts
const tags = field.array("tags", {
  item: field.stringItem(),
  label: "Tags",
});

const addresses = field.objectArray("addresses", {
  label: "Addresses",
  item: {
    street: field.textItem({ label: "Street" }),
    city: field.textItem({ label: "City" }),
    zip: field.textItem({ label: "ZIP" }),
  },
  itemLayout: ["street", "city", "zip"],
});
```

### Layout

```ts
const layoutTree = layout.stack("root", [
  layout.field(accountType),
  layout.field(companyName),
  layout.grid("contact-grid", { columns: 2 }, [
    layout.field(email),
    layout.field(country),
  ]),
  layout.field(tags),
  layout.field(addresses),
]);
```

### Rules

```ts
const rules = [
  rule
    .when(fieldRef(accountType).eq("company"))
    .show(fieldRef(companyName)),
  rule
    .when(contextRef("mode").eq("view"))
    .disableAll(),
];
```

### Datasources

```ts
const countries = datasource.static("countries", [
  { label: "United States", value: "US" },
  { label: "Nepal", value: "NP" },
]);
```

### Compile

```ts
const compiled = buildForm({
  form,
  fields: [accountType, companyName, email, tags, addresses],
  layout: layoutTree,
  rules,
  datasources: [countries],
});
```

`compiled` should be a valid `FormDefinition`.

## Required Authoring Features

### 1. Typed field helpers

Provide helpers for common field semantics:

- `field.text`
- `field.email`
- `field.url`
- `field.phone`
- `field.number`
- `field.integer`
- `field.checkbox`
- `field.select`
- `field.textarea`
- `field.date`
- `field.datetime`
- `field.array`
- `field.objectArray`

### 2. Item helpers for arrays

Provide dedicated item builders so arrays are not authored as loose objects.

Examples:

- `field.stringItem()`
- `field.numberItem()`
- `field.booleanItem()`
- `field.textItem(...)`

### 3. Layout helpers

Provide helpers for:

- `layout.stack`
- `layout.grid`
- `layout.section`
- `layout.tabs`
- `layout.stepper`
- `layout.field`
- `layout.divider`

### 4. Rule helpers

Provide a fluent or object builder API for:

- field refs
- context refs
- operators
- effects

The API should avoid raw expression trees for common cases.

### 5. Datasource helpers

Provide helpers for:

- `datasource.static`
- `datasource.remote`

### 6. Strong path discipline

The builder should reduce manual path duplication.

At minimum:

- `layout.field(accountType)` should use the field path automatically
- `fieldRef(accountType)` should use the field path automatically

## Builder Output Policy

The builder should:

- produce stable `FieldPath` strings
- populate `dataSchema.fields`
- populate `uiSchema.nodes`
- build `uiSchema.layout`
- build `behaviorSchema.rules`
- build `behaviorSchema.dataSources`

The runtime should not know whether the schema came from raw JSON or the builder.

## Type Safety Goal

The builder layer should be more ergonomic than raw `FormDefinition`, but it must not weaken type safety.

Targets:

- typed options for select/radio helpers
- typed array item builders
- typed rule references
- compile-time narrowing for known field kinds where possible

## Future Extensions

Possible later additions:

- `zodToFormwright(...)`
- preset field packs
- schema presets for common flows
- visual editor output that compiles through the same builder layer

## Boundary Rule

`@formwright/schema-builder` is an authoring package.

It should not:

- own runtime behavior
- own React components
- replace the normalized contract

It should only improve schema authoring ergonomics and compile to `FormDefinition`.
