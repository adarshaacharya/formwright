import type { FieldPath } from "@formwright/contract";
import { useRuntimeContext } from "../provider/runtime-context";
import type { UseDatasourceOptionsResult } from "../types/public-types";
import { useFormRuntime } from "./use-form-runtime";

export function useDatasourceOptions(path: FieldPath): UseDatasourceOptionsResult {
  const runtime = useFormRuntime();
  const { evaluation } = useRuntimeContext();
  const field = runtime.getResolvedFields()[path];
  const state = evaluation.fieldState[path] ?? {
    path,
    visible: true,
    disabled: false,
    readonly: false,
    required: false,
  };

  const staticOptions = field?.uiField?.options;

  return {
    loading: Boolean(state.loading),
    options: staticOptions,
  };
}
