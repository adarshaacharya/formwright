# Formwright Cookbook

Practical patterns for integrating Formwright with your design system and custom validation.

Submission should stay in app code. `Formwright` renders the form and manages runtime state, while the consuming app keeps `handleSubmit`.

## Integration Style 0: Schema + default renderer (fastest path)

```tsx
import { buildForm, defineForm, field, layout } from "formwright/schema";
import { createFormRuntime } from "formwright/core";
import { FormRuntimeProvider, FormRuntimeRoot } from "formwright/react";
import { registerBasicPlugins } from "formwright/plugins";

const profile = defineForm({ id: "profile" });
const fullName = field.text("fullName", { label: "Full name", required: true });
const email = field.email("email", { label: "Email" });

const form = buildForm({
  form: profile,
  fields: [fullName, email],
  layout: layout.stack("root", [layout.field(fullName), layout.field(email)]),
});

const runtime = createFormRuntime({ form, plugins: registerBasicPlugins() });

export function ProfileForm() {
  return (
    <FormRuntimeProvider runtime={runtime}>
      <FormRuntimeRoot rootLayoutId="root" />
    </FormRuntimeProvider>
  );
}
```

## Integration Style 1: Compound parts with custom inputs

```tsx
import { FormField } from "formwright/react";

export function ProfileFields() {
  return (
    <div className="space-y-4">
      <FormField.Root path="fullName">
        <FormField.Label />
        <FormField.Control>
          {({ value, onChange, onBlur, error, state }) => (
            <input
              className="h-10 w-full rounded-md border px-3"
              value={typeof value === "string" ? value : ""}
              onChange={(event) => onChange(event.target.value)}
              onBlur={onBlur}
              disabled={state.disabled || state.readonly}
              aria-invalid={Boolean(error)}
            />
          )}
        </FormField.Control>
        <FormField.Error />
      </FormField.Root>

      <FormField.Root path="email">
        <FormField.Label />
        <FormField.Control />
        <FormField.Error />
      </FormField.Root>
    </div>
  );
}
```

## Integration Style 2: Schema + per-type shadcn Input mapping

```tsx
import { FormRuntimeRoot, createDefaultRendererMaps, type FieldRendererComponent } from "formwright/react";
import { Input } from "@/components/ui/input";

const ShadcnTextInput: FieldRendererComponent = ({
  value,
  onChange,
  onBlur,
  error,
  field,
}) => {
  const stringValue = typeof value === "string" ? value : "";
  const inputType =
    field.definition.type === "email"
      ? "email"
      : field.definition.type === "password"
      ? "password"
      : "text";

  return (
    <div className="space-y-1">
      <Input
        type={inputType}
        value={stringValue}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
};

export function FormWithShadcnInputs() {
  const { fieldRendererMap } = createDefaultRendererMaps();

  return (
    <FormRuntimeRoot
      rootLayoutId="root"
      fieldRendererMap={{
        ...fieldRendererMap,
        text: ShadcnTextInput,
        email: ShadcnTextInput,
        password: ShadcnTextInput,
      }}
    />
  );
}
```

## Integration Style 3: Schema + per-type shadcn Select with datasource options

```tsx
import { FormRuntimeRoot, createDefaultRendererMaps, type FieldRendererComponent } from "formwright/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ShadcnSelect: FieldRendererComponent = ({ value, onChange, options, error }) => {
  const selected = typeof value === "string" ? value : "";

  return (
    <div className="space-y-1">
      <Select value={selected} onValueChange={onChange}>
        <SelectTrigger aria-invalid={Boolean(error)}>
          <SelectValue placeholder="Choose..." />
        </SelectTrigger>
        <SelectContent>
          {(options ?? []).map((opt) => (
            <SelectItem key={opt.value} value={String(opt.value)}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
};

export function FormWithShadcnSelect() {
  const { fieldRendererMap } = createDefaultRendererMaps();

  return (
    <FormRuntimeRoot
      rootLayoutId="root"
      fieldRendererMap={{ ...fieldRendererMap, select: ShadcnSelect }}
    />
  );
}
```

## Integration Style 4: Schema + date picker with Date <-> string conversion

```tsx
import { type FieldRendererComponent } from "formwright/react";
import { Calendar } from "@/components/ui/calendar";

const DateField: FieldRendererComponent = ({ value, onChange, error }) => {
  const selected = typeof value === "string" && value ? new Date(value) : undefined;

  return (
    <div className="space-y-1">
      <Calendar
        mode="single"
        selected={selected}
        onSelect={(date) => onChange(date ? date.toISOString().slice(0, 10) : "")}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
};
```

## Integration Style 5: Schema + checkbox/switch boolean binding

```tsx
import { type FieldRendererComponent } from "formwright/react";
import { Switch } from "@/components/ui/switch";

const BooleanSwitch: FieldRendererComponent = ({ value, onChange, error }) => {
  const checked = Boolean(value);

  return (
    <div className="space-y-1">
      <Switch checked={checked} onCheckedChange={onChange} />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
};
```

## Integration Style 6: Schema + slot-only design-system wrapper

```tsx
import { buildForm, defineForm, field, layout } from "formwright/schema";
import { createFormRuntime } from "formwright/core";
import { FormRuntimeProvider, FormRuntimeRoot } from "formwright/react";

const profile = defineForm({ id: "profile-slot-themed" });
const fullName = field.text("fullName", { label: "Full name", required: true });
const email = field.email("email", { label: "Email" });

const form = buildForm({
  form: profile,
  fields: [fullName, email],
  layout: layout.stack("root", [layout.field(fullName), layout.field(email)]),
});
const runtime = createFormRuntime({ form });

export function FormWithThemeSlots() {
  return (
    <FormRuntimeProvider runtime={runtime}>
      <FormRuntimeRoot
        rootLayoutId="root"
        fieldSlots={{
          Shell: ({ children }) => <div className="space-y-2 rounded-md border p-4">{children}</div>,
          Label: ({ label }) => <label className="text-sm font-medium">{label}</label>,
          Error: ({ error }) => (error ? <p className="text-sm text-destructive">{error}</p> : null),
          Help: ({ helpText }) =>
            helpText ? <p className="text-xs text-muted-foreground">{helpText}</p> : null,
        }}
      />
    </FormRuntimeProvider>
  );
}
```

## Integration Style 7: Compound arrays

```tsx
import { FormArray } from "formwright/react";

export function TagArray() {
  return (
    <FormArray.Root path="tags">
      <FormArray.Header />
      <FormArray.Items>
        {(item, index) => (
          <FormArray.Item key={item.id} index={index}>
            <span>{String(item.value ?? "")}</span>
            <FormArray.Remove index={index}>Remove</FormArray.Remove>
          </FormArray.Item>
        )}
      </FormArray.Items>
      <FormArray.Add>Add tag</FormArray.Add>
    </FormArray.Root>
  );
}
```

## Integration Style 8: Schema + mixed mode (slots + per-type renderers)

Use slots for global structure/styling, and use `fieldRendererMap` only for special field types.

```tsx
import { buildForm, defineForm, field, layout } from "formwright/schema";
import { createFormRuntime } from "formwright/core";
import { FormRuntimeProvider, FormRuntimeRoot, createDefaultRendererMaps } from "formwright/react";

const account = defineForm({ id: "account" });
const role = field.select("role", { label: "Role", datasource: "roles" });
const dob = field.date("dob", { label: "Date of birth" });

const form = buildForm({
  form: account,
  fields: [role, dob],
  layout: layout.stack("root", [layout.field(role), layout.field(dob)]),
});
const runtime = createFormRuntime({ form });

export function MixedForm() {
  const { fieldRendererMap } = createDefaultRendererMaps();

  return (
    <FormRuntimeProvider runtime={runtime}>
      <FormRuntimeRoot
        rootLayoutId="root"
        fieldSlots={{
          Label: ({ label }) => <label className="text-sm font-medium">{label}</label>,
          Error: ({ error }) => (error ? <p className="text-sm text-destructive">{error}</p> : null),
        }}
        fieldRendererMap={{
          ...fieldRendererMap,
          select: ShadcnSelect,
          date: DateField,
        }}
      />
    </FormRuntimeProvider>
  );
}
```

## Integration Style 9: Validation + error wiring

Always render `error` in custom controls so users keep validation feedback:

```tsx
const CustomInput: FieldRendererComponent = ({ value, onChange, onBlur, error }) => (
  <div className="space-y-1">
    <input
      className="h-10 w-full rounded-md border px-3"
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      aria-invalid={Boolean(error)}
    />
    {error ? <p className="text-sm text-destructive">{error}</p> : null}
  </div>
);
```

For cross-field validation, pass your resolver to `FormRuntimeProvider`:

```tsx
<FormRuntimeProvider runtime={runtime} validationResolver={zodResolver(schema)}>
  <FormRuntimeRoot rootLayoutId="root" />
</FormRuntimeProvider>
```
