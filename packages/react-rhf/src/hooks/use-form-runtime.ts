import type { CreateFormRuntimeInput, FormRuntime } from "@formwright/core";
import { createFormRuntime } from "@formwright/core";

import { useRuntimeContext } from "../provider/runtime-context";

export function useCreateFormRuntime(input: CreateFormRuntimeInput): FormRuntime {
  return createFormRuntime(input);
}

export function useFormRuntime(): FormRuntime {
  return useRuntimeContext();
}
