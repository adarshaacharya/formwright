# Formwright Cookbook

Practical patterns for integrating Formwright with your design system and custom validation.

## 1) shadcn Input mapped by field type

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

## 2) shadcn Select with datasource options

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

## 3) Date picker with Date <-> string conversion

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

## 4) Checkbox/Switch boolean binding

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

## 5) Slot-only design-system wrapper

```tsx
import { FormRuntimeRoot } from "formwright/react";

export function FormWithThemeSlots() {
  return (
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
  );
}
```

## 6) Mixed approach (recommended)

Use slots for global structure/styling, and use `fieldRendererMap` only for special field types:

```tsx
<FormRuntimeRoot
  rootLayoutId="root"
  fieldSlots={{
    Label: ({ label }) => <label className="text-sm font-medium">{label}</label>,
    Error: ({ error }) => (error ? <p className="text-sm text-destructive">{error}</p> : null),
  }}
  fieldRendererMap={{
    ...createDefaultRendererMaps().fieldRendererMap,
    select: ShadcnSelect,
    date: DateField,
  }}
/>
```

## 7) Validation + error wiring

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
