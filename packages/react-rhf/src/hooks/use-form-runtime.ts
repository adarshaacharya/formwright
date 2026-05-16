import { useMemo } from "react";
import type { CreateFormRuntimeInput, FormRuntime } from "@formwright/core";
import { createFormRuntime } from "@formwright/core";
import { useFormContext } from "react-hook-form";

import { useRuntimeContext } from "../provider/runtime-context";
import type { UseFormLifecycleResult } from "../types/public-types";

export function useCreateFormRuntime(input: CreateFormRuntimeInput): FormRuntime {
  return useMemo(() => createFormRuntime(input), [input.form, input.context, input.plugins]);
}

export function useFormRuntime(): FormRuntime {
  return useRuntimeContext().runtime;
}

export function useFormLifecycle(): UseFormLifecycleResult {
  const runtime = useFormRuntime();
  const { getValues } = useFormContext<Record<string, unknown>>();

  return {
    runLifecycle(stage) {
      return runtime.runLifecycle(stage, getValues());
    },
    runOnLoad() {
      return runtime.runLifecycle("onLoad", getValues());
    },
    runOnSubmit() {
      return runtime.runLifecycle("onSubmit", getValues());
    },
  };
}
