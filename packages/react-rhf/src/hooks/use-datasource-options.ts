import type { FieldPath } from "@formwright/contract";
import type { UseDatasourceOptionsResult } from "../types/public-types";
import { useFormField } from "./use-form-field";

export function useDatasourceOptions(path: FieldPath): UseDatasourceOptionsResult {
  const { field, state } = useFormField(path);
  const staticOptions = field.uiField?.options;

  return {
    loading: Boolean(state.loading),
    options: staticOptions,
  };
}
