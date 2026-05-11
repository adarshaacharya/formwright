import type { FieldPath } from "@formwright/contract";
import type { UseFormFieldResult } from "../types/public-types";
import { useFormRuntime } from "./use-form-runtime";

export function useFormField(path: FieldPath): UseFormFieldResult {
  const runtime = useFormRuntime();
  const field = runtime.getResolvedFields()[path];

  if (!field) {
    throw new Error(`Field not found in resolved model: ${path}`);
  }

  const evaluation = runtime.evaluate();
  const state = evaluation.fieldState[path] ?? {
    path,
    visible: true,
    disabled: false,
    readonly: false,
    required: false,
  };

  return {
    field,
    state,
    value: evaluation.values[path],
    error: state.errors?.[0],
    setValue() {
      throw new Error("setValue is not implemented yet in the runtime adapter.");
    },
    onBlur() {
      // Placeholder to keep renderer contracts stable before RHF wiring is implemented.
    },
  };
}
