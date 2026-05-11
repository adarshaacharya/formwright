import { useEffect, useMemo } from "react";
import type { FieldPath } from "@formwright/contract";
import { useFormContext, useWatch } from "react-hook-form";
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

  const watchedValue = useWatch({ control: form.control, name: path });
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

  useEffect(() => {
    form.register(path, validationRules);
    return () => {
      form.unregister(path);
    };
  }, [form, path, validationRules]);

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
