import { useFormContext } from "react-hook-form";
import type { UseFormLayoutResult } from "../types/public-types";
import { useFormRuntime } from "./use-form-runtime";

export function useFormLayout(id?: string): UseFormLayoutResult {
  const runtime = useFormRuntime();
  const form = useFormContext<Record<string, unknown>>();
  const layout = runtime.getResolvedLayout();
  const evaluation = runtime.evaluate(form.watch());

  if (!id || id === layout.id) {
    return { layout, state: id ? evaluation.layoutState[id] : undefined };
  }

  // Deep lookup can be added once nested layout resolution is implemented.
  throw new Error(`Layout lookup by id is not implemented for nested layouts: ${id}`);
}
