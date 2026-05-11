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

export interface UseFormRuntimeOptions extends CreateFormRuntimeInput {
  initialValues?: Record<string, unknown>;
}

export interface FormRuntimeProviderProps {
  runtime: FormRuntime;
  initialValues?: Record<string, unknown>;
  children?: React.ReactNode;
}

export interface FormRuntimeRootProps {
  rootLayoutId?: string;
}

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

export interface UseDatasourceOptionsResult {
  loading: boolean;
  options: DataSourceLoadResult["options"];
}

export interface RenderFieldProps {
  field: ResolvedFieldModel;
  state: DerivedFieldState;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
  onBlur?: () => void;
  options?: DataSourceLoadResult["options"];
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
