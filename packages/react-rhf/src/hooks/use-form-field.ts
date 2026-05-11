import { useMemo } from "react";
import type { FieldPath } from "@formwright/contract";
import { useController, useFormContext } from "react-hook-form";
import { useRuntimeContext } from "../provider/runtime-context";
import type { UseFormFieldResult } from "../types/public-types";
import { toRHFValidationRules } from "../validation/to-rhf-validation-rules";
import { useFormRuntime } from "./use-form-runtime";

export function useFormField(path: FieldPath): UseFormFieldResult {
  const runtime = useFormRuntime();
  const { evaluation } = useRuntimeContext();
  const form = useFormContext<Record<string, unknown>>();
  const field = runtime.getResolvedFields()[path];

  if (!field) {
    throw new Error(`Field not found in resolved model: ${path}`);
  }

  const fieldStateMeta = form.getFieldState(path);
  const state = evaluation.fieldState[path] ?? {
    path,
    visible: true,
    disabled: false,
    readonly: false,
    required: false,
  };
  const validationRules = useMemo(
    () => toRHFValidationRules(field.dataField, state.required),
    [field.dataField, state.required],
  );
  const controller = useController<Record<string, unknown>, FieldPath>({
    control: form.control,
    name: path,
    rules: validationRules,
  });

  return {
    field,
    state,
    value: controller.field.value,
    error: controller.fieldState.error?.message ?? fieldStateMeta.error?.message ?? state.errors?.[0],
    setValue(value) {
      controller.field.onChange(value);
    },
    onBlur() {
      controller.field.onBlur();
    },
  };
}
