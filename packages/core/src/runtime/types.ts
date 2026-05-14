import type { FormDefinition } from "@formwright/contract";
import type {
  BehaviorRule,
  DataSourceDefinition,
  DataFieldDefinition,
  FieldPath,
  LayoutNode,
  RuleEffect,
  SelectOption,
  UiFieldNode,
} from "@formwright/contract";

import type { ValidationPlanItem, ValidationResult } from "../validation/types";
import type { DerivedStateSnapshot, ResolvedFieldModel, ResolvedLayoutModel } from "../resolved/types";
import type { PluginRegistry } from "../plugins/types";

export interface RuntimeContext {
  mode?: "create" | "edit" | "view";
  userRole?: string;
  locale?: string;
  baseUrl?: string;
  featureFlags?: Record<string, boolean | string | number>;
  meta?: Record<string, unknown>;
}

export interface PluginIdentity {
  name: string;
  version?: string;
}

export interface RuntimeValuesSnapshot {
  values: Record<string, unknown>;
  context: RuntimeContext;
}

export interface FieldPluginNormalizeInput {
  path: FieldPath;
  dataField: DataFieldDefinition;
  uiField?: UiFieldNode;
  context: RuntimeContext;
}

export interface FieldPluginNormalizeOutput {
  fieldType: string;
  normalizedDataField: DataFieldDefinition;
  normalizedUiField?: UiFieldNode;
}

export interface FieldDefaultValueInput {
  path: FieldPath;
  dataField: DataFieldDefinition;
  uiField?: UiFieldNode;
  context: RuntimeContext;
}

export interface FieldValidationPlanInput {
  path: FieldPath;
  dataField: DataFieldDefinition;
  uiField?: UiFieldNode;
  context: RuntimeContext;
}

export interface FieldSerializeInput {
  path: FieldPath;
  value: unknown;
  context: RuntimeContext;
}

export interface FieldDeserializeInput {
  path: FieldPath;
  value: unknown;
  context: RuntimeContext;
}

export interface FieldRendererKeyInput {
  path: FieldPath;
  uiField?: UiFieldNode;
  context: RuntimeContext;
}

export interface LayoutNormalizeInput {
  node: LayoutNode;
  context: RuntimeContext;
}

export interface LayoutValidateInput {
  node: LayoutNode;
  context: RuntimeContext;
}

export interface LayoutRendererKeyInput {
  node: LayoutNode;
  context: RuntimeContext;
}

export interface ValidatorSupportsInput {
  path: FieldPath;
  dataField: DataFieldDefinition;
  uiField?: UiFieldNode;
}

export interface ValidatorRunInput {
  path: FieldPath;
  value: unknown;
  dataField: DataFieldDefinition;
  uiField?: UiFieldNode;
  values: Record<string, unknown>;
  context: RuntimeContext;
}

export interface OperatorEvaluateInput {
  expression: Record<string, unknown>;
  values: Record<string, unknown>;
  context: RuntimeContext;
}

export interface EffectApplyInput {
  effect: RuleEffect;
  values: Record<string, unknown>;
  derivedState: DerivedStateSnapshot;
  context: RuntimeContext;
}

export interface FieldStateMutation {
  path: FieldPath;
  patch: Partial<DerivedFieldState>;
}

export interface LayoutStateMutation {
  id: string;
  patch: Partial<DerivedLayoutState>;
}

export interface ValueMutation {
  path: FieldPath;
  value: unknown;
}

export interface EffectApplyResult {
  fieldMutations?: FieldStateMutation[];
  layoutMutations?: LayoutStateMutation[];
  valueMutations?: ValueMutation[];
}

export interface DataSourceLoadInput {
  source: DataSourceDefinition;
  dependsOnValues: Record<string, unknown>;
  context: RuntimeContext;
}

export interface DataSourceLoadResult {
  options?: SelectOption[];
  meta?: Record<string, unknown>;
}

export interface DerivedFieldState {
  path: FieldPath;
  visible: boolean;
  disabled: boolean;
  readonly: boolean;
  required: boolean;
  loading?: boolean;
  errors?: string[];
}

export interface DerivedLayoutState {
  id?: string;
  visible: boolean;
  disabled?: boolean;
}

export interface CreateFormRuntimeInput {
  form: FormDefinition;
  context?: RuntimeContext;
  plugins?: FormPlugin[];
}

export interface RuntimeEvaluationResult {
  fieldState: Record<FieldPath, DerivedFieldState>;
  layoutState: Record<string, DerivedLayoutState>;
  values: Record<string, unknown>;
  valueMutations?: ValueMutation[];
}

export interface FormRuntime {
  getFormDefinition(): FormDefinition;
  getResolvedFields(): Record<FieldPath, ResolvedFieldModel>;
  getResolvedLayout(): ResolvedLayoutModel;
  getEvaluationDependencies(): FieldPath[];
  getRuntimeContext(): RuntimeContext;
  getPluginRegistry(): PluginRegistry;
  getFieldValidationPlan(path: FieldPath): ValidationPlanItem[];
  serializeFieldValue(path: FieldPath, value: unknown): unknown;
  deserializeFieldValue(path: FieldPath, value: unknown): unknown;
  evaluate(values?: Record<string, unknown>): RuntimeEvaluationResult;
}

export interface FieldPlugin {
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

export interface LayoutPlugin {
  kind: "layout";
  identity: PluginIdentity;
  layoutType: string;
  normalize?: (input: LayoutNormalizeInput) => LayoutNode;
  validate?: (input: LayoutValidateInput) => void;
  getRendererKey?: (input: LayoutRendererKeyInput) => string;
}

export interface ValidatorPlugin {
  kind: "validator";
  identity: PluginIdentity;
  validatorType: string;
  supports: (input: ValidatorSupportsInput) => boolean;
  validate: (input: ValidatorRunInput) => ValidationResult;
}

export interface OperatorPlugin {
  kind: "operator";
  identity: PluginIdentity;
  operatorType: string;
  evaluate: (input: OperatorEvaluateInput) => unknown;
}

export interface EffectPlugin {
  kind: "effect";
  identity: PluginIdentity;
  effectType: string;
  apply: (input: EffectApplyInput) => EffectApplyResult;
}

export interface DataSourcePlugin {
  kind: "datasource";
  identity: PluginIdentity;
  sourceType: string;
  load: (input: DataSourceLoadInput) => Promise<DataSourceLoadResult>;
}

export type FormPlugin =
  | FieldPlugin
  | LayoutPlugin
  | ValidatorPlugin
  | OperatorPlugin
  | EffectPlugin
  | DataSourcePlugin;

export interface RuleTraceEntry {
  rule: BehaviorRule;
  matched: boolean;
  effectsApplied: RuleEffect[];
}
