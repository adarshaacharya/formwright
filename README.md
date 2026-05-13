# Formwright

Formwright is a schema-driven form engine for building dynamic forms with runtime rules, plugins, and React rendering support.

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

export function ProfileForm() {
  return (
    <FormRuntimeProvider runtime={runtime}>
      <FormRuntimeRoot rootLayoutId="root" />
    </FormRuntimeProvider>
  );
}
```

## Peer Dependencies

`formwright/react` expects:

- `react >= 18`
- `react-dom >= 18`
- `react-hook-form ^7.53.0`
