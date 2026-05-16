# Formwright

[![npm version](https://img.shields.io/npm/v/formwright)](https://www.npmjs.com/package/formwright)
[![npm downloads](https://img.shields.io/npm/dm/formwright)](https://www.npmjs.com/package/formwright)
[![license](https://img.shields.io/npm/l/formwright)](./LICENSE)

Schema-driven form engine for React. Define fields, layout, rules, and data sources in TypeScript — the runtime handles conditional logic, validation, and rendering.

## Install

```bash
npm install formwright@latest react-hook-form
```

## Quick example

```tsx
import { defineForm, buildForm, field, layout } from "formwright/schema";
import { createFormRuntime } from "formwright/core";
import { FormRuntimeProvider, FormRuntimeRoot } from "formwright/react";
import { registerBasicPlugins } from "formwright/plugins";
import { useFormContext } from "react-hook-form";

const form = buildForm({
  form: defineForm({ id: "profile" }),
  fields: [field.text("name", { label: "Name", required: true }), field.email("email", { label: "Email" })],
  layout: layout.stack("root", [layout.field("name"), layout.field("email")]),
});

const runtime = createFormRuntime({ form, plugins: registerBasicPlugins() });

function ProfileForm() {
  const { handleSubmit } = useFormContext();
  return (
    <form onSubmit={handleSubmit(console.log)}>
      <FormRuntimeRoot rootLayoutId="root" />
      <button type="submit">Save</button>
    </form>
  );
}

export default function App() {
  return (
    <FormRuntimeProvider runtime={runtime}>
      <ProfileForm />
    </FormRuntimeProvider>
  );
}
```

## Docs

Full documentation at **[adarshaacharya.github.io/formwright](https://adarshaacharya.github.io/formwright/)**

- [Getting started](https://adarshaacharya.github.io/formwright/docs/quickstart/getting-started)
- [Mental model](https://adarshaacharya.github.io/formwright/docs/concepts/mental-model)
- [Customization](https://adarshaacharya.github.io/formwright/docs/guides/customization)
- [API reference](https://adarshaacharya.github.io/formwright/docs/reference/schema-api)

## Peer dependencies

- `react >= 18`
- `react-dom >= 18`
- `react-hook-form ^7.53.0`

## License

MIT
