# Formwright

Formwright is a schema-driven form engine for building dynamic forms with runtime rules, plugins, and React rendering support.
Bring your own inputs, validation, and UI.

## Cookbook

For practical design-system integrations and validation patterns, see:

- [Formwright Cookbook](./cookbook.md)

## Install

```bash
npm install formwright
```

## Exports

```ts
import { createFormRuntime } from "formwright/core";
import { defineForm, buildForm } from "formwright/schema";
import { FormRuntimeProvider, FormRuntimeRoot } from "formwright/react";
import { registerBasicPlugins, registerAsyncPlugins } from "formwright/plugins";
```

You can also import from the root package:

```ts
import { createFormRuntime, defineForm } from "formwright";
```

## Basic Usage

```tsx
import { defineForm, buildForm } from "formwright/schema";
import { field, layout } from "formwright/schema";
import { createFormRuntime } from "formwright/core";
import { useFormContext } from "react-hook-form";
import { FormRuntimeProvider, FormRuntimeRoot } from "formwright/react";
import { registerBasicPlugins } from "formwright/plugins";

const profileForm = defineForm({ id: "profile-form" });
const nameField = field.text("name", { label: "Name", required: true });
const emailField = field.email("email", { label: "Email" });

const form = buildForm({
  form: profileForm,
  fields: [nameField, emailField],
  layout: layout.stack("root", [layout.field(nameField), layout.field(emailField)]),
});
const runtime = createFormRuntime({
  form,
  plugins: registerBasicPlugins(),
  context: { mode: "create" },
});

function ProfileFormBody() {
  const { handleSubmit } = useFormContext();

  return (
    <form onSubmit={handleSubmit((values) => console.log(values))}>
      <FormRuntimeRoot rootLayoutId="root" />
      <button type="submit">Save</button>
    </form>
  );
}

export function ProfileForm() {
  return (
    <FormRuntimeProvider runtime={runtime}>
      <ProfileFormBody />
    </FormRuntimeProvider>
  );
}
```

`Formwright` renders the form and manages runtime behavior. Submission stays in user code through React Hook Form's `handleSubmit`.

## React API Shape

`formwright/react` is designed with three layers:

1. `FormRuntimeProvider` + `FormRuntimeRoot` for fast form rendering
2. `fieldSlots` / `arraySlots` for global theming of stable parts
3. `FormField.*` / `FormArray.*` for direct composition in design systems

Use renderer maps when you need to fully replace a control implementation for a field type. They are the escape hatch, not the main customization story.

## Compound Parts

For advanced styling and design-system integration, use the compound parts API.

### `FormField`

```tsx
import { FormField } from "formwright/react";

function ProfileFieldSet() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <FormField.Root path="name">
        <FormField.Label />
        <FormField.Control />
        <FormField.Error />
      </FormField.Root>

      <FormField.Root path="email">
        <FormField.Label />
        <FormField.Description />
        <FormField.Control />
        <FormField.Help />
        <FormField.Error />
      </FormField.Root>
    </div>
  );
}
```

To replace the actual input element without using a renderer map:

```tsx
import { FormField } from "formwright/react";

function ProfileFieldSet() {
  return (
    <FormField.Root path="name">
      <FormField.Label />
      <FormField.Control>
        {({ value, onChange, onBlur, error, state }) => (
          <input
            value={typeof value === "string" ? value : ""}
            onChange={(event) => onChange(event.target.value)}
            onBlur={onBlur}
            disabled={state.disabled || state.readonly}
            aria-invalid={Boolean(error)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: error ? "1px solid crimson" : "1px solid #ccc",
            }}
          />
        )}
      </FormField.Control>
      <FormField.Error />
    </FormField.Root>
  );
}
```

### `FormArray`

```tsx
import { FormArray } from "formwright/react";

function TagList() {
  return (
    <FormArray.Root path="tags">
      <FormArray.Header />
      <FormArray.Items>
        {(item, index) => (
          <FormArray.Item key={item.id} index={index}>
            <span>{String(item.value ?? "")}</span>
            <FormArray.Remove index={index}>Remove tag</FormArray.Remove>
          </FormArray.Item>
        )}
      </FormArray.Items>
      <FormArray.Add>Add tag</FormArray.Add>
    </FormArray.Root>
  );
}
```

## Bring Your Own Inputs (shadcn/ui, Radix UI, custom components)

Formwright supports multiple integration styles. Choose the one that fits your app:

1. Schema + default renderer: fastest setup
2. Schema + slot-based theming: customize global form UI with slots
3. Schema + compound parts: compose fields directly in your design system
4. Schema + per-type renderer map: replace specific field controls
5. Mixed mode: slots for global styling + per-type overrides for complex fields

`FormRuntimeRoot` exposes two extension points:

- `fieldSlots`: customize stable UI parts (`Shell`, `Label`, `Description`, `Control`, `Error`, `Help`)
- `fieldRendererMap`: replace rendering by field type key (for example `select`, `date`, `checkbox`)

### Option 1: Global control slot (easy shadcn-style wrapper)

```tsx
import { FormRuntimeRoot, type FieldControlSlotProps } from "formwright/react";

function ShadcnControlSlot({
  value,
  onChange,
  onBlur,
  error,
  defaultControl,
}: FieldControlSlotProps) {
  // For full custom controls, render your own Input/Select here using value/onChange/onBlur.
  // Use defaultControl when you only want to wrap default behavior.
  return (
    <div className="space-y-1">
      {defaultControl}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

export function FormWithCustomSlot() {
  return (
    <FormRuntimeRoot
      rootLayoutId="root"
      fieldSlots={{
        Control: ShadcnControlSlot,
        Label: ({ label }) => <label className="text-sm font-medium">{label}</label>,
        Help: ({ helpText }) =>
          helpText ? <p className="text-xs text-muted-foreground">{helpText}</p> : null,
      }}
    />
  );
}
```

### Option 2: Compound parts with custom controls

```tsx
import { FormField } from "formwright/react";

export function FormWithCompoundFields() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <FormField.Root path="name">
        <FormField.Label />
        <FormField.Control>
          {({ value, onChange, onBlur }) => (
            <input
              value={typeof value === "string" ? value : ""}
              onChange={(event) => onChange(event.target.value)}
              onBlur={onBlur}
            />
          )}
        </FormField.Control>
        <FormField.Error />
      </FormField.Root>
    </div>
  );
}
```

### Option 3: Per-type renderer map (example with Radix Select)

```tsx
import * as React from "react";
import * as Select from "@radix-ui/react-select";
import {
  FormRuntimeRoot,
  createDefaultRendererMaps,
  type FieldRendererComponent,
} from "formwright/react";

const RadixSelectField: FieldRendererComponent = ({ value, onChange, options }) => {
  const selected = typeof value === "string" ? value : "";

  return (
    <Select.Root value={selected} onValueChange={onChange}>
      <Select.Trigger aria-label="Select value">
        <Select.Value placeholder="Choose..." />
      </Select.Trigger>
      <Select.Content>
        <Select.Viewport>
          {(options ?? []).map((opt) => (
            <Select.Item key={opt.value} value={String(opt.value)}>
              <Select.ItemText>{opt.label}</Select.ItemText>
            </Select.Item>
          ))}
        </Select.Viewport>
      </Select.Content>
    </Select.Root>
  );
};

export function FormWithRadixRenderer() {
  const { fieldRendererMap } = createDefaultRendererMaps();

  return (
    <FormRuntimeRoot
      rootLayoutId="root"
      fieldRendererMap={{
        ...fieldRendererMap,
        // Use the field type key from your schema (example: "select")
        select: RadixSelectField,
      }}
    />
  );
}
```

Install whichever UI packages you use:

```bash
npm install @radix-ui/react-select
```

## RHF-First Customizability

Formwright is designed as an RHF-first rendering engine:

- You can plug in your own UI components through compound parts, `fieldRendererMap`, and `fieldSlots`.
- Validation is extensible via schema rules, resolver-based validation, and validator plugins.
- Runtime behavior is extensible through plugins (field/layout/operator/effect/datasource).
- Arrays (primitive and object items) also flow through renderer extension points.

What this means in practice:

- For React Hook Form apps, Formwright is highly customizable and scalable for dynamic form builders.
- Any component that can be adapted to controlled props (`value`/`onChange` or `checked`/`onCheckedChange`) can be integrated.
- `formwright/react` targets RHF specifically. Support for other form libraries would be implemented as separate adapter packages.

## Validation

Formwright supports two validation patterns:

- schema-driven field rules mapped to React Hook Form rules
- custom resolvers (for example Zod/Yup) for advanced and cross-field validation

### Option 1: Schema rules -> RHF rules

```tsx
import { toRHFValidationRules } from "formwright/react";

// Inside a custom renderer where `field` is available:
const rules = toRHFValidationRules(field.definition, field.required);
```

Use this when your field schema contains constraints and you want standard RHF behavior without a custom resolver.

### Option 2: Custom resolver (Zod example)

```tsx
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormRuntimeProvider, FormRuntimeRoot } from "formwright/react";

const schema = z
  .object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export function SignupForm({ runtime }: { runtime: any }) {
  return (
    <FormRuntimeProvider runtime={runtime} validationResolver={zodResolver(schema)}>
      <FormRuntimeRoot rootLayoutId="root" />
    </FormRuntimeProvider>
  );
}
```

Install resolver dependencies:

```bash
npm install zod @hookform/resolvers
```

## Peer Dependencies

`formwright/react` expects:

- `react >= 18`
- `react-dom >= 18`
- `react-hook-form ^7.53.0`
