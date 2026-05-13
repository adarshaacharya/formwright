import { useRuntimeContext } from "../provider/runtime-context";
import type { UseFormLayoutResult } from "../types/public-types";
import { useFormRuntime } from "./use-form-runtime";

export function useFormLayout(id?: string): UseFormLayoutResult {
  const runtime = useFormRuntime();
  const { evaluation } = useRuntimeContext();
  const layout = runtime.getResolvedLayout();

  if (!id || id === layout.id) {
    return { layout, state: id ? evaluation.layoutState[id] : undefined };
  }

  // Deep lookup can be added once nested layout resolution is implemented.
  throw new Error(`Layout lookup by id is not implemented for nested layouts: ${id}`);
}
