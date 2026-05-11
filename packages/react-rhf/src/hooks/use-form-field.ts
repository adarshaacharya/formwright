import type { FieldPath } from "@formwright/contract";
import { useFormContext, useWatch } from "react-hook-form";
import type { UseFormFieldResult } from "../types/public-types";
import { useFormRuntime } from "./use-form-runtime";

export function useFormField(path: FieldPath): UseFormFieldResult {
  const runtime = useFormRuntime();
  const form = useFormContext<Record<string, unknown>>();
  const field = runtime.getResolvedFields()[path];

  if (!field) {
    throw new Error(`Field not found in resolved model: ${path}`);
  }

  const watchedValue = useWatch({ control: form.control, name: path });
  const allValues = form.watch();
  const evaluation = runtime.evaluate(allValues);
  const fieldStateMeta = form.getFieldState(path);
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
    value: watchedValue,
    error: fieldStateMeta.error?.message ?? state.errors?.[0],
    setValue(value) {
      form.setValue(path, value, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    },
    onBlur() {
      form.trigger(path);
    },
  };
}
