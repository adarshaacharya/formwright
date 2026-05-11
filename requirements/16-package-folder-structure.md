# Package Folder Structure

## Purpose

Define a concrete internal folder structure for each package so the codebase can scale without collapsing into generic utility folders or boundary violations.

## Monorepo top level

Recommended top-level layout:

```text
apps/
packages/
requirements/
tooling/
```

Optional later additions:

```text
examples/
scripts/
```

## Top-level package set

Initial recommended packages:

```text
packages/
  contract/
  core/
  react-rhf/
  renderers-default/
  plugins-basic/
  plugins-async/
```

## General package rules

Every package should prefer domain folders over generic buckets.

Avoid:

- `utils/`
- `helpers/`
- `misc/`
- `common/` when it hides unrelated responsibilities

Prefer folders that map to actual architecture concepts.

## `packages/contract`

Purpose:

- schema types
- normalization contracts
- parsing helpers
- migrations
- versioning

Recommended structure:

```text
packages/contract/
  src/
    form-definition/
      types.ts
      guards.ts
      errors.ts
    data-schema/
      types.ts
      guards.ts
      errors.ts
    ui-schema/
      types.ts
      guards.ts
      errors.ts
    behavior-schema/
      types.ts
      guards.ts
      errors.ts
    migrations/
      types.ts
      registry.ts
    normalize/
      normalize-form-definition.ts
      normalize-data-schema.ts
      normalize-ui-schema.ts
      normalize-behavior-schema.ts
    shared/
      path.ts
      identifiers.ts
    index.ts
  package.json
```

Notes:

- keep this package serializable and framework-agnostic
- no React imports
- no runtime network concerns

## `packages/core`

Purpose:

- rule engine
- plugin registries
- schema resolution
- runtime planning
- derived state calculation

Recommended structure:

```text
packages/core/
  src/
    errors/
      types.ts
    plugins/
      field/
        types.ts
        registry.ts
      layout/
        types.ts
        registry.ts
      validator/
        types.ts
        registry.ts
      operator/
        types.ts
        registry.ts
      effect/
        types.ts
        registry.ts
      datasource/
        types.ts
        registry.ts
    rules/
      expression/
        types.ts
        evaluate-rule-expression.ts
        validate-rule-expression.ts
      effects/
        types.ts
        apply-rule-effects.ts
      runtime/
        evaluate-rules.ts
        build-rule-context.ts
    schema-resolution/
      resolve-field-definition.ts
      resolve-ui-node.ts
      resolve-layout-node.ts
      resolve-form-definition.ts
    runtime-state/
      types.ts
      derive-field-state.ts
      derive-layout-state.ts
      build-render-model.ts
    datasources/
      types.ts
      resolve-datasource-definition.ts
    validation/
      types.ts
      build-validation-plan.ts
    orchestration/
      types.ts
      build-runtime-plan.ts
    shared/
      collections.ts
      invariants.ts
    index.ts
  package.json
```

Notes:

- this package should be the strongest candidate for internal Effect usage
- keep business semantics here, not in React adapters

## `packages/react-rhf`

Purpose:

- React integration
- RHF binding
- runtime-to-React bridge

Recommended structure:

```text
packages/react-rhf/
  src/
    provider/
      form-runtime-provider.tsx
      runtime-context.ts
    hooks/
      use-form-runtime.ts
      use-form-field.ts
      use-form-layout.ts
      use-form-submit.ts
      use-datasource-options.ts
    binding/
      register-field.ts
      bind-controller-field.ts
      bind-array-field.ts
    adapters/
      to-render-field-model.ts
      to-render-layout-model.ts
      to-rhf-validation-rules.ts
    state/
      observe-field-state.ts
      observe-form-state.ts
      observe-layout-state.ts
    types/
      public-types.ts
      internal-types.ts
    components/
      form-runtime-root.tsx
    index.ts
  package.json
```

Notes:

- keep React-specific code here
- public APIs should remain plain React and TypeScript
- avoid moving rule logic here

## `packages/renderers-default`

Purpose:

- default renderer implementation
- reference UI kit

Recommended structure:

```text
packages/renderers-default/
  src/
    fields/
      text/
        text-field-renderer.tsx
      textarea/
        textarea-field-renderer.tsx
      number/
        number-field-renderer.tsx
      select/
        select-field-renderer.tsx
      checkbox/
        checkbox-field-renderer.tsx
      radio-group/
        radio-group-field-renderer.tsx
      array/
        array-field-renderer.tsx
    layouts/
      section/
        section-layout-renderer.tsx
      grid/
        grid-layout-renderer.tsx
      stack/
        stack-layout-renderer.tsx
      tabs/
        tabs-layout-renderer.tsx
      stepper/
        stepper-layout-renderer.tsx
    wrappers/
      field-shell.tsx
      field-label.tsx
      field-help-text.tsx
      field-error.tsx
    registry/
      field-renderers.ts
      layout-renderers.ts
    theme/
      tokens.ts
    index.ts
  package.json
```

Notes:

- this package is a reference implementation
- consumers may replace it entirely through scaffolded local files

## `packages/plugins-basic`

Purpose:

- built-in primitive field semantics
- standard validators
- standard operators

Recommended structure:

```text
packages/plugins-basic/
  src/
    fields/
      text-field-plugin.ts
      textarea-field-plugin.ts
      number-field-plugin.ts
      select-field-plugin.ts
      checkbox-field-plugin.ts
      radio-group-field-plugin.ts
      array-field-plugin.ts
    layouts/
      section-layout-plugin.ts
      grid-layout-plugin.ts
      stack-layout-plugin.ts
      tabs-layout-plugin.ts
      stepper-layout-plugin.ts
    operators/
      eq-operator.ts
      neq-operator.ts
      gt-operator.ts
      gte-operator.ts
      lt-operator.ts
      lte-operator.ts
      and-operator.ts
      or-operator.ts
      not-operator.ts
      in-operator.ts
      exists-operator.ts
    validators/
      required-validator.ts
      string-validator.ts
      number-validator.ts
      array-validator.ts
    effects/
      show-effect.ts
      hide-effect.ts
      enable-effect.ts
      disable-effect.ts
      require-effect.ts
      set-value-effect.ts
      clear-value-effect.ts
    registry/
      register-basic-plugins.ts
    index.ts
  package.json
```

Notes:

- this package should contain the default semantic feature set
- do not mix UI components into this package

## `packages/plugins-async`

Purpose:

- async options
- remote validation
- async dependency handling

Recommended structure:

```text
packages/plugins-async/
  src/
    datasources/
      remote-datasource-plugin.ts
      static-datasource-plugin.ts
    validation/
      remote-validator-plugin.ts
    caching/
      datasource-cache.ts
    orchestration/
      load-datasource-options.ts
      invalidate-dependent-options.ts
    errors/
      types.ts
    registry/
      register-async-plugins.ts
    index.ts
  package.json
```

Notes:

- this is another strong candidate for internal Effect usage
- keep request and retry orchestration here, not in renderers

## `apps/playground`

Purpose:

- test schema authoring
- test dynamic rendering
- verify plugin registration
- validate renderer overrides

Recommended structure:

```text
apps/playground/
  src/
    app/
      app.tsx
    schemas/
      examples/
        onboarding-form.ts
        checkout-form.ts
        nested-array-form.ts
    renderers/
      local/
        text-field-renderer.tsx
        select-field-renderer.tsx
    plugins/
      local/
        currency-range-plugin.ts
    scenarios/
      async-options.ts
      workflow-locking.ts
    index.tsx
  package.json
```

Notes:

- use this app to break the system early
- do not let playground-only shortcuts leak back into packages

## `apps/docs-demo`

Purpose:

- documentation examples
- screenshots
- stable reference behaviors

Recommended structure:

```text
apps/docs-demo/
  src/
    examples/
      basic-form.tsx
      custom-renderers.tsx
      async-options.tsx
      conditional-visibility.tsx
    content/
      snippets/
    index.tsx
  package.json
```

## Future CLI package

If a scaffold CLI is added later:

```text
packages/cli/
  src/
    commands/
      init.ts
      add.ts
    templates/
      renderers/
      layouts/
      wrappers/
    transforms/
      update-manifest.ts
    index.ts
```

## File design rules

Recommended file style:

- one main responsibility per file
- stable exported names
- minimal barrel usage
- explicit imports over hidden re-export chains

## Test colocation rule

Either colocate tests beside modules or keep them in a mirrored `__tests__` structure.

Recommended if colocated:

```text
evaluate-rule-expression.ts
evaluate-rule-expression.test.ts
```

This works well for a package-based platform.

## Shared-code rule

If code is only shared by one package, keep it inside that package.

Do not create a `shared` package too early.

Only extract a new package when:

- ownership is clear
- reuse is real
- boundaries are stable

## Final recommendation

Start with explicit package folders and domain-oriented subfolders.

The long-run health of this project depends on resisting:

- generic utility folders
- React leakage into core
- runtime leakage into renderers
- unstructured plugin code
