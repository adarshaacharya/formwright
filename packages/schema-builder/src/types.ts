import type {
  BehaviorRule,
  ComputedFieldDefinition,
  DataFieldDefinition,
  DataSourceDefinition,
  FieldLayoutNode,
  FieldPath,
  FormDefinition,
  FormMeta,
  FormSchemaVersion,
  GridLayoutNode,
  LayoutNode,
  RuleEffect,
  RuleExpression,
  SelectOption,
  LifecycleDefinition,
  SectionLayoutNode,
  StackLayoutNode,
  StepperLayoutNode,
  TabsLayoutNode,
  UiFieldNode,
} from "@formwright/contract";

export interface FormDraft {
  version: FormSchemaVersion;
  formId: string;
  meta?: FormMeta;
}

export interface BuiltField<Path extends FieldPath = FieldPath> {
  path: Path;
  data: DataFieldDefinition;
  ui: UiFieldNode;
}

export interface PrimitiveItemDefinition {
  kind: "primitive";
  valueType: Exclude<DataFieldDefinition["valueType"], "array" | "object">;
  defaultValue?: unknown;
}

export interface ObjectItemFieldDefinition {
  valueType: Exclude<DataFieldDefinition["valueType"], "array" | "object">;
  default?: unknown;
  label?: string;
  placeholder?: string;
  inputType?: string;
}

export interface ObjectItemDefinition {
  kind: "object";
  fields: Record<string, ObjectItemFieldDefinition>;
  itemLayout?: string[];
}

export type ArrayItemDefinition = PrimitiveItemDefinition | ObjectItemDefinition;

export interface BuiltRule {
  id?: string;
  when: RuleExpression;
  effects: RuleEffect[];
}

export interface BuiltDataSource {
  name: string;
  definition: DataSourceDefinition;
}

export interface LayoutFieldOptions {
  span?: number;
}

export interface LayoutBaseOptions {
  title?: string;
  description?: string;
  visibleWhen?: RuleExpression;
  componentProps?: Record<string, unknown>;
}

export interface GridLayoutOptions extends LayoutBaseOptions {
  columns: number;
}

export interface TabDefinition {
  id: string;
  label: string;
  children: LayoutNode[];
}

export interface StepDefinition {
  id: string;
  label: string;
  children: LayoutNode[];
}

export interface BuildFormInput {
  form: FormDraft;
  fields: BuiltField[];
  layout: LayoutNode;
  rules?: BuiltRule[];
  datasources?: BuiltDataSource[];
  computed?: ComputedFieldDefinition[];
  lifecycle?: LifecycleDefinition;
}

export interface RuleReference {
  path: string;
  eq: (value: unknown) => RuleExpression;
  neq: (value: unknown) => RuleExpression;
  gt: (value: number) => RuleExpression;
  gte: (value: number) => RuleExpression;
  lt: (value: number) => RuleExpression;
  lte: (value: number) => RuleExpression;
  in: (values: unknown[]) => RuleExpression;
  exists: () => RuleExpression;
}

export type BuiltLayoutNode =
  | LayoutNode
  | SectionLayoutNode
  | GridLayoutNode
  | StackLayoutNode
  | TabsLayoutNode
  | StepperLayoutNode
  | FieldLayoutNode;

export type BuiltFormDefinition = FormDefinition;

export type SelectValue = string | number | boolean;
export type SelectOptions = SelectOption[];
