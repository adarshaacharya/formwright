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
import type { DataFieldDefinition } from "@formwright/contract";
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
}

interface FieldRendererBaseProps {
  path: string;
}

interface ArrayFieldRendererBaseProps {
  path: string;
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
}

export interface RenderArrayProps extends ArrayFieldRendererBaseProps {
  field: ResolvedFieldModel;
  state: DerivedFieldState;
  items: Array<{ id: string; value: unknown }>;
  append: (value?: unknown) => void;
  remove: (index: number) => void;
  itemSchema?: Record<string, DataFieldDefinition>;
  itemLayout?: string[];
  itemFieldMeta?: Record<string, { label?: string; placeholder?: string; inputType?: string }>;
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

export interface FormRuntimeSnapshot {
  context?: RuntimeContext;
  evaluation: RuntimeEvaluationResult;
}
