# Schema Types RFC

## Status

Draft

## Purpose

Define the exact contract shape the backend can send and the frontend runtime can consume.

This document is intentionally implementation-oriented, but it does not introduce runtime code yet.

## Design goals

- backend-safe and serializable
- frontend-friendly for React Hook Form path binding
- extensible through registries and plugins
- explicit separation between data, UI, and behavior
- versionable over time

## Core type model

```ts
type FormSchemaVersion = "1.0";

type PrimitiveValueType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "date"
  | "datetime"
  | "file"
  | "json";

type CompositeValueType = "object" | "array";

type ValueType = PrimitiveValueType | CompositeValueType;

type FormMode = "create" | "edit" | "view";

type WorkflowState = string;

type FieldPath = string;

interface FormDefinition {
  version: FormSchemaVersion;
  formId: string;
  meta?: FormMeta;
  dataSchema: DataSchema;
  uiSchema: UiSchema;
  behaviorSchema?: BehaviorSchema;
}
```

## Meta

```ts
interface FormMeta {
  title?: string;
  description?: string;
  mode?: FormMode;
  locale?: string;
  tenant?: string;
  workflowState?: WorkflowState;
  permissions?: Record<string, boolean>;
  featureFlags?: Record<string, boolean | string | number>;
  tags?: string[];
}
```

## Data schema

The data schema defines the legal data structure and static validation constraints.

```ts
interface DataSchema {
  rootType: "object";
  fields: Record<FieldPath, DataFieldDefinition>;
}

interface BaseDataFieldDefinition {
  valueType: ValueType;
  required?: boolean;
  default?: unknown;
  nullable?: boolean;
  readOnly?: boolean;
  serverValidation?: {
    rules?: string[];
  };
}

interface StringFieldDefinition extends BaseDataFieldDefinition {
  valueType: "string";
  enum?: string[];
  const?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: "email" | "url" | "uuid" | "phone" | "date" | "datetime";
}

interface NumberFieldDefinition extends BaseDataFieldDefinition {
  valueType: "number" | "integer";
  enum?: number[];
  const?: number;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
}

interface BooleanFieldDefinition extends BaseDataFieldDefinition {
  valueType: "boolean";
  const?: boolean;
}

interface DateFieldDefinition extends BaseDataFieldDefinition {
  valueType: "date" | "datetime";
  minDate?: string;
  maxDate?: string;
}

interface FileFieldDefinition extends BaseDataFieldDefinition {
  valueType: "file";
  accept?: string[];
  maxFiles?: number;
  maxSizeBytes?: number;
}

interface JsonFieldDefinition extends BaseDataFieldDefinition {
  valueType: "json";
}

interface ObjectFieldDefinition extends BaseDataFieldDefinition {
  valueType: "object";
}

interface ArrayFieldDefinition extends BaseDataFieldDefinition {
  valueType: "array";
  itemType: Exclude<ValueType, "array">;
  itemSchema?: Record<string, DataFieldDefinition>;
  minItems?: number;
  maxItems?: number;
}

type DataFieldDefinition =
  | StringFieldDefinition
  | NumberFieldDefinition
  | BooleanFieldDefinition
  | DateFieldDefinition
  | FileFieldDefinition
  | JsonFieldDefinition
  | ObjectFieldDefinition
  | ArrayFieldDefinition;
```

## UI schema

The UI schema defines how semantic fields should be presented and arranged.

```ts
interface UiSchema {
  nodes: Record<FieldPath, UiFieldNode>;
  layout: LayoutNode;
}

interface UiFieldNode {
  fieldType: string;
  label?: string;
  description?: string;
  helpText?: string;
  placeholder?: string;
  widget?: string;
  renderer?: string;
  componentProps?: Record<string, unknown>;
  wrapperProps?: Record<string, unknown>;
  styleTokens?: Record<string, string | number | boolean>;
  accessibility?: {
    labelHidden?: boolean;
    ariaDescription?: string;
  };
  options?: SelectOption[];
  dataSource?: string;
}

interface SelectOption {
  label: string;
  value: string | number | boolean;
  disabled?: boolean;
}
```

## Layout schema

Layout is tree-based so containers can express composition cleanly.

```ts
type LayoutNode =
  | SectionLayoutNode
  | GridLayoutNode
  | StackLayoutNode
  | TabsLayoutNode
  | StepperLayoutNode
  | DividerLayoutNode
  | FieldLayoutNode;

interface BaseLayoutNode {
  id?: string;
  type: string;
  title?: string;
  description?: string;
  visibleWhen?: RuleExpression;
  componentProps?: Record<string, unknown>;
}

interface SectionLayoutNode extends BaseLayoutNode {
  type: "section";
  children: LayoutNode[];
}

interface GridLayoutNode extends BaseLayoutNode {
  type: "grid";
  columns: number;
  children: Array<LayoutNode & { span?: number }>;
}

interface StackLayoutNode extends BaseLayoutNode {
  type: "stack";
  children: LayoutNode[];
}

interface TabsLayoutNode extends BaseLayoutNode {
  type: "tabs";
  tabs: Array<{
    id: string;
    label: string;
    children: LayoutNode[];
  }>;
}

interface StepperLayoutNode extends BaseLayoutNode {
  type: "stepper";
  steps: Array<{
    id: string;
    label: string;
    children: LayoutNode[];
  }>;
}

interface DividerLayoutNode extends BaseLayoutNode {
  type: "divider";
}

interface FieldLayoutNode extends BaseLayoutNode {
  type: "field";
  ref: FieldPath;
  span?: number;
}
```

## Behavior schema

Behavior should remain declarative and serializable.

```ts
interface BehaviorSchema {
  rules?: BehaviorRule[];
  dataSources?: Record<string, DataSourceDefinition>;
  computed?: ComputedFieldDefinition[];
  lifecycle?: LifecycleDefinition;
}
```

## Rules

```ts
interface BehaviorRule {
  id: string;
  when: RuleExpression;
  effects: RuleEffect[];
}

type RuleExpression =
  | { var: string }
  | { eq: [RuleExpression, unknown] }
  | { neq: [RuleExpression, unknown] }
  | { gt: [RuleExpression, number] }
  | { gte: [RuleExpression, number] }
  | { lt: [RuleExpression, number] }
  | { lte: [RuleExpression, number] }
  | { in: [RuleExpression, unknown[]] }
  | { and: RuleExpression[] }
  | { or: RuleExpression[] }
  | { not: RuleExpression }
  | { exists: string };

type RuleEffect =
  | { type: "show"; target: string }
  | { type: "hide"; target: string }
  | { type: "enable"; target: string }
  | { type: "disable"; target: string }
  | { type: "require"; target: string; value?: boolean }
  | { type: "setValue"; target: string; value: unknown }
  | { type: "clearValue"; target: string }
  | { type: "setOptions"; target: string; value: SelectOption[] }
  | { type: "setLayoutProp"; target: string; prop: string; value: unknown };
```

## Data sources

```ts
type DataSourceDefinition = StaticDataSource | RemoteDataSource;

interface StaticDataSource {
  type: "static";
  options: SelectOption[];
}

interface RemoteDataSource {
  type: "remote";
  endpoint: string;
  method?: "GET" | "POST";
  dependsOn?: string[];
  queryMap?: Record<string, string>;
  bodyMap?: Record<string, unknown>;
}
```

## Computed fields

```ts
interface ComputedFieldDefinition {
  target: FieldPath;
  expression: RuleExpression | Record<string, unknown>;
  runOn: FieldPath[];
}
```

## Lifecycle

```ts
interface LifecycleDefinition {
  onLoad?: LifecycleAction[];
  onSubmit?: LifecycleAction[];
}

type LifecycleAction =
  | { type: "fetchDataSource"; target: string }
  | { type: "validateServerRules" }
  | { type: "submitTo"; target: string };
```

## Path rules

The path system should follow these rules:

- scalar and object paths use dot notation
- array item access may use bracket notation at runtime
- schema field keys describe semantic paths, not renderer ids
- layout `ref` values must resolve to a known field path

Examples:

- `contact.email`
- `company.name`
- `addresses`
- `addresses[0].city`

## Validation boundaries

Static constraints belong in `dataSchema`.

Dynamic constraints belong in `behaviorSchema.rules`.

Authoritative domain validation still belongs on the backend.

## Extension boundaries

The following contract fields are intentionally open for plugin extension:

- `uiSchema.nodes[*].fieldType`
- `uiSchema.nodes[*].widget`
- `uiSchema.nodes[*].renderer`
- `behaviorSchema.rules[*].effects[*].type`
- layout `type`
- data source `type`

## Constraint

No part of this contract should carry:

- JSX
- raw executable JavaScript
- React component references
- frontend-only import paths
