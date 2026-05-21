<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/formwright-icon-dark.svg" />
    <img src="assets/formwright-icon.svg" alt="Formwright" width="32" height="32" />
  </picture>
</p>

<h1 align="center">Formwright</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/formwright"><img src="https://img.shields.io/npm/v/formwright" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/formwright"><img src="https://img.shields.io/npm/dm/formwright" alt="npm downloads" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/formwright" alt="license" /></a>
</p>

Schema-driven form engine for React. Define fields, layout, rules, and data sources in TypeScript — the runtime handles conditional logic, validation, and rendering.

## Install

```bash
npm install formwright@latest react-hook-form
```

## Skills 
Formwright is agent ready, use our skills and let agent do rest of the work. Refer [full docs on agents skills setup](https://adarshaacharya.github.io/formwright/docs/ai-skills/overview) for different coding agents .

```bash
npx skills add adarshaacharya/formwright --skill formwright
```

## Cookbook
If you want to understand different use cases of Formwright without thinking too much, please [view cookbook here](https://adarshaacharya.github.io/formwright/docs/cookbook/from-adhoc-to-schema)

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
- [Skills](https://adarshaacharya.github.io/formwright/docs/ai-skills/overview)

For npm package [check here](https://www.npmjs.com/package/formwright) 



## Peer dependencies

- `react >= 18`
- `react-dom >= 18`
- `react-hook-form ^7.53.0`

## License

[MIT](./LICENSE)


## Sponsorship

If you find formwright valuable and would like to support its continued development, please consider:

- Sponsoring project
- Reaching out for consulting or custom implementation at hi@adarsha.dev

Or just drop casual email on what you're building using formwright in your project.
