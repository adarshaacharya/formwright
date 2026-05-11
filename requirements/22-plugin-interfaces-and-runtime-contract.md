# Plugin Interfaces And Runtime Contract

## Purpose

Define the concrete TypeScript-facing interfaces for plugins and the runtime contract they integrate with.

This document should make the plugin system implementable without forcing internal architecture decisions into the public API.

## Core principle

Plugins should extend semantics, not patch internals.

The runtime should expose stable plugin contracts while keeping orchestration details private.

## Plugin categories

The engine should support these public plugin categories:

- field plugins
- layout plugins
- validator plugins
- operator plugins
- effect plugins
- data source plugins

## Shared concepts

### Runtime context

The runtime should expose a plain context object to plugins.

```ts
interface RuntimeContext {
  mode?: "create" | "edit" | "view";
  userRole?: string;
  locale?: string;
  featureFlags?: Record<string, boolean | string | number>;
  meta?: Record<string, unknown>;
}
```

### Plugin identity

All plugins should have stable identity metadata.

```ts
interface PluginIdentity {
  name: string;
  version?: string;
}
```

### Runtime values snapshot

Plugins should receive plain access to current values and derived state through public runtime inputs, not private engine stores.

```ts
interface RuntimeValuesSnapshot {
  values: Record<string, unknown>;
  context: RuntimeContext;
}
```

## Field plugin

Field plugins define semantic field behavior.

```ts
interface FieldPlugin {
  kind: "field";
  identity: PluginIdentity;
  fieldType: string;
  supportedValueTypes?: string[];
  normalize?: (input: FieldPluginNormalizeInput) => FieldPluginNormalizeOutput;
  getDefaultValue?: (input: FieldDefaultValueInput) => unknown;
  getValidationPlan?: (input: FieldValidationPlanInput) => ValidationPlanItem[];
  serialize?: (input: FieldSerializeInput) => unknown;
  deserialize?: (input: FieldDeserializeInput) => unknown;
  getRendererKey?: (input: FieldRendererKeyInput) => string;
}
```

### Field plugin inputs

```ts
interface FieldPluginNormalizeInput {
  path: string;
  dataField: DataFieldDefinition;
  uiField?: UiFieldNode;
  context: RuntimeContext;
}

interface FieldPluginNormalizeOutput {
  fieldType: string;
  normalizedDataField: DataFieldDefinition;
  normalizedUiField?: UiFieldNode;
}

interface FieldDefaultValueInput {
  path: string;
  dataField: DataFieldDefinition;
  uiField?: UiFieldNode;
  context: RuntimeContext;
}

interface FieldValidationPlanInput {
  path: string;
  dataField: DataFieldDefinition;
  uiField?: UiFieldNode;
  context: RuntimeContext;
}

interface FieldSerializeInput {
  path: string;
  value: unknown;
  context: RuntimeContext;
}

interface FieldDeserializeInput {
  path: string;
  value: unknown;
  context: RuntimeContext;
}

interface FieldRendererKeyInput {
  path: string;
  uiField?: UiFieldNode;
  context: RuntimeContext;
}
```

## Layout plugin

Layout plugins define layout node semantics.

```ts
interface LayoutPlugin {
  kind: "layout";
  identity: PluginIdentity;
  layoutType: string;
  normalize?: (input: LayoutNormalizeInput) => LayoutNode;
  validate?: (input: LayoutValidateInput) => void;
  getRendererKey?: (input: LayoutRendererKeyInput) => string;
}

interface LayoutNormalizeInput {
  node: LayoutNode;
  context: RuntimeContext;
}

interface LayoutValidateInput {
  node: LayoutNode;
  context: RuntimeContext;
}

interface LayoutRendererKeyInput {
  node: LayoutNode;
  context: RuntimeContext;
}
```

## Validator plugin

Validator plugins define reusable validation logic.

```ts
interface ValidatorPlugin {
  kind: "validator";
  identity: PluginIdentity;
  validatorType: string;
  supports: (input: ValidatorSupportsInput) => boolean;
  validate: (input: ValidatorRunInput) => ValidationResult;
}

interface ValidatorSupportsInput {
  path: string;
  dataField: DataFieldDefinition;
  uiField?: UiFieldNode;
}

interface ValidatorRunInput {
  path: string;
  value: unknown;
  dataField: DataFieldDefinition;
  uiField?: UiFieldNode;
  values: Record<string, unknown>;
  context: RuntimeContext;
}

interface ValidationResult {
  valid: boolean;
  code?: string;
  message?: string;
  meta?: Record<string, unknown>;
}

interface ValidationPlanItem {
  validatorType: string;
  config?: Record<string, unknown>;
}
```

## Operator plugin

Operator plugins define rule expression operations.

```ts
interface OperatorPlugin {
  kind: "operator";
  identity: PluginIdentity;
  operatorType: string;
  evaluate: (input: OperatorEvaluateInput) => unknown;
}

interface OperatorEvaluateInput {
  expression: Record<string, unknown>;
  values: Record<string, unknown>;
  context: RuntimeContext;
}
```

## Effect plugin

Effect plugins define rule effect execution.

```ts
interface EffectPlugin {
  kind: "effect";
  identity: PluginIdentity;
  effectType: string;
  apply: (input: EffectApplyInput) => EffectApplyResult;
}

interface EffectApplyInput {
  effect: RuleEffect;
  values: Record<string, unknown>;
  derivedState: DerivedStateSnapshot;
  context: RuntimeContext;
}

interface EffectApplyResult {
  fieldMutations?: FieldStateMutation[];
  layoutMutations?: LayoutStateMutation[];
  valueMutations?: ValueMutation[];
}
```

## Data source plugin

Data source plugins resolve options or remote data for fields.

```ts
interface DataSourcePlugin {
  kind: "datasource";
  identity: PluginIdentity;
  sourceType: string;
  load: (input: DataSourceLoadInput) => Promise<DataSourceLoadResult>;
}

interface DataSourceLoadInput {
  source: DataSourceDefinition;
  dependsOnValues: Record<string, unknown>;
  context: RuntimeContext;
}

interface DataSourceLoadResult {
  options?: SelectOption[];
  meta?: Record<string, unknown>;
}
```

## Derived state shapes

These types should remain renderer-friendly and plain.

```ts
interface DerivedFieldState {
  path: string;
  visible: boolean;
  disabled: boolean;
  readonly: boolean;
  required: boolean;
  loading?: boolean;
  errors?: string[];
}

interface DerivedLayoutState {
  id?: string;
  visible: boolean;
  disabled?: boolean;
}

interface DerivedStateSnapshot {
  fields: Record<string, DerivedFieldState>;
  layouts: Record<string, DerivedLayoutState>;
}
```

## Mutation shapes

```ts
interface FieldStateMutation {
  path: string;
  patch: Partial<DerivedFieldState>;
}

interface LayoutStateMutation {
  id: string;
  patch: Partial<DerivedLayoutState>;
}

interface ValueMutation {
  path: string;
  value: unknown;
}
```

## Runtime creation contract

The core package should expose a runtime creation API.

```ts
interface CreateFormRuntimeInput {
  form: FormDefinition;
  context?: RuntimeContext;
  plugins?: FormPlugin[];
}

interface FormRuntime {
  getFormDefinition(): FormDefinition;
  getResolvedFields(): Record<string, ResolvedFieldModel>;
  getResolvedLayout(): ResolvedLayoutModel;
  evaluate(): RuntimeEvaluationResult;
}

type FormPlugin =
  | FieldPlugin
  | LayoutPlugin
  | ValidatorPlugin
  | OperatorPlugin
  | EffectPlugin
  | DataSourcePlugin;
```

## Resolved runtime models

These should be public and safe for React adapters to consume.

```ts
interface ResolvedFieldModel {
  path: string;
  fieldType: string;
  valueType: string;
  rendererKey: string;
  dataField: DataFieldDefinition;
  uiField?: UiFieldNode;
}

interface ResolvedLayoutModel {
  id?: string;
  type: string;
  rendererKey: string;
  children?: ResolvedLayoutModel[];
  fieldRef?: string;
  node: LayoutNode;
}

interface RuntimeEvaluationResult {
  fieldState: Record<string, DerivedFieldState>;
  layoutState: Record<string, DerivedLayoutState>;
  values: Record<string, unknown>;
}
```

## Renderer-facing React contract

The React adapter package should expose plain props to renderer components.

```ts
interface RenderFieldProps {
  field: ResolvedFieldModel;
  state: DerivedFieldState;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
  onBlur?: () => void;
  options?: SelectOption[];
}

interface RenderLayoutProps {
  layout: ResolvedLayoutModel;
  state?: DerivedLayoutState;
  children?: React.ReactNode;
}
```

These props should stay plain and renderer-friendly.

## Hook direction

Scaffolded renderers should be able to use hooks like:

- `useFormField(path)`
- `useFormLayout(id)`
- `useDatasourceOptions(path)`

without needing access to registry or orchestration internals.

## Design constraints

1. plugin contracts must stay serializable or plain where possible
2. renderer APIs must stay plain React/TypeScript
3. plugin authors must not need private runtime knowledge
4. internal orchestration may change without breaking public plugin contracts

## Final recommendation

Treat these interfaces as the public design target for:

- `@form/core`
- `@form/react-rhf`
- plugin packages
- scaffolded renderers

Implementation may refine naming, but not the overall boundary model.
