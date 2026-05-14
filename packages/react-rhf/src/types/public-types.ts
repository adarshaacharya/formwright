import type {
  CreateFormRuntimeInput,
  DataSourceLoadResult,
  DerivedFieldState,
  DerivedLayoutState,
  FormRuntime,
  RuntimeContext,
  RuntimeEvaluationResult,
  ResolvedFieldModel,
  ResolvedLayoutModel,
} from "@formwright/core";
import type { ArrayFieldDefinition, DataFieldDefinition } from "@formwright/contract";
import type { Resolver } from "react-hook-form";

export interface UseFormRuntimeOptions extends CreateFormRuntimeInput {
  initialValues?: Record<string, unknown>;
}

export interface FormRuntimeProviderProps {
  runtime: FormRuntime;
  initialValues?: Record<string, unknown>;
  validationResolver?: Resolver<Record<string, unknown>>;
  hiddenFieldPolicy?: "keep" | "unregister" | "clear";
  children?: React.ReactNode;
}

export interface FormRuntimeRootProps {
  rootLayoutId?: string;
  fieldRendererMap?: Record<string, FieldRendererComponent>;
  arrayFieldRendererMap?: Record<string, ArrayFieldRendererComponent>;
  layoutRendererMap?: Record<string, LayoutRendererComponent>;
  fieldSlots?: FieldRendererSlots;
  arraySlots?: ArrayRendererSlots;
}

interface FieldRendererBaseProps {
  path: string;
}

interface ArrayFieldRendererBaseProps {
  path: string;
}

export interface FieldShellSlotProps {
  field: ResolvedFieldModel;
  state: DerivedFieldState;
  children: React.ReactNode;
}

export interface FieldLabelSlotProps {
  field: ResolvedFieldModel;
  state: DerivedFieldState;
  label: string;
}

export interface FieldDescriptionSlotProps {
  field: ResolvedFieldModel;
  state: DerivedFieldState;
  description?: string;
}

export interface FieldControlSlotProps {
  field: ResolvedFieldModel;
  state: DerivedFieldState;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
  onBlur?: () => void;
  loading?: boolean;
  options?: DataSourceLoadResult["options"];
  defaultControl: React.ReactNode;
}

export interface FieldErrorSlotProps {
  field: ResolvedFieldModel;
  state: DerivedFieldState;
  error?: string;
}

export interface FieldHelpSlotProps {
  field: ResolvedFieldModel;
  state: DerivedFieldState;
  helpText?: string;
}

export interface FieldRendererSlots {
  Shell?: React.ComponentType<FieldShellSlotProps>;
  Label?: React.ComponentType<FieldLabelSlotProps>;
  Description?: React.ComponentType<FieldDescriptionSlotProps>;
  Control?: React.ComponentType<FieldControlSlotProps>;
  Error?: React.ComponentType<FieldErrorSlotProps>;
  Help?: React.ComponentType<FieldHelpSlotProps>;
}

export interface ArrayShellSlotProps {
  field: ResolvedFieldModel;
  state: DerivedFieldState;
  children: React.ReactNode;
}

export interface ArrayHeaderSlotProps {
  field: ResolvedFieldModel;
  state: DerivedFieldState;
  label: string;
}

export interface ArrayItemShellSlotProps {
  field: ResolvedFieldModel;
  state: DerivedFieldState;
  index: number;
  children: React.ReactNode;
}

export interface ArrayActionsSlotProps {
  field: ResolvedFieldModel;
  state: DerivedFieldState;
  index?: number;
  action: "add" | "remove";
  defaultAction: React.ReactNode;
}

export interface ArrayRendererSlots {
  Shell?: React.ComponentType<ArrayShellSlotProps>;
  Header?: React.ComponentType<ArrayHeaderSlotProps>;
  ItemShell?: React.ComponentType<ArrayItemShellSlotProps>;
  Actions?: React.ComponentType<ArrayActionsSlotProps>;
}

export interface RenderFieldProps extends FieldRendererBaseProps {
  field: ResolvedFieldModel;
  state: DerivedFieldState;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
  onBlur?: () => void;
  loading?: boolean;
  options?: DataSourceLoadResult["options"];
  slots?: FieldRendererSlots;
}

export interface RenderArrayProps extends ArrayFieldRendererBaseProps {
  field: ResolvedFieldModel;
  state: DerivedFieldState;
  itemType?: ArrayFieldDefinition["itemType"];
  items: Array<{ id: string; value: unknown }>;
  append: (value?: unknown) => void;
  remove: (index: number) => void;
  itemSchema?: Record<string, DataFieldDefinition>;
  itemLayout?: string[];
  itemFieldMeta?: Record<string, { label?: string; placeholder?: string; inputType?: string }>;
  fieldRendererMap?: Record<string, FieldRendererComponent>;
  fieldSlots?: FieldRendererSlots;
  slots?: ArrayRendererSlots;
}

export type FieldRendererComponent = (props: RenderFieldProps) => React.JSX.Element | null;
export type ArrayFieldRendererComponent = (props: RenderArrayProps) => React.JSX.Element | null;
export type LayoutRendererComponent = (props: RenderLayoutProps) => React.JSX.Element | null;

export interface UseFormFieldResult {
  field: ResolvedFieldModel;
  state: DerivedFieldState;
  value: unknown;
  error?: string;
  setValue: (value: unknown) => void;
  onBlur: () => void;
}

export interface UseFormLayoutResult {
  layout: ResolvedLayoutModel;
  state?: DerivedLayoutState;
}

export interface UseFormArrayResult {
  path: string;
  itemType?: ArrayFieldDefinition["itemType"];
  visible: boolean;
  disabled: boolean;
  readonly: boolean;
  items: Array<{ id: string; value: unknown }>;
  append: (value?: unknown) => void;
  remove: (index: number) => void;
}

export interface UseDatasourceOptionsResult {
  loading: boolean;
  error?: string;
  options: DataSourceLoadResult["options"];
}

export interface RenderLayoutProps {
  layout: ResolvedLayoutModel;
  state?: DerivedLayoutState;
  children?: React.ReactNode;
}

export interface FieldComposerProps {
  field: ResolvedFieldModel;
  state: DerivedFieldState;
  label: string;
  description?: string;
  helpText?: string;
  error?: string;
  children: React.ReactNode;
  slots?: FieldRendererSlots;
}

export interface ArrayComposerProps {
  field: ResolvedFieldModel;
  state: DerivedFieldState;
  label: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  slots?: ArrayRendererSlots;
}

export interface FormRuntimeSnapshot {
  context?: RuntimeContext;
  evaluation: RuntimeEvaluationResult;
}
