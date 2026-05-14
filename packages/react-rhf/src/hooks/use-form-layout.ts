import type { ResolvedLayoutModel } from "@formwright/core";
import { useRuntimeContext } from "../provider/runtime-context";
import type { UseFormLayoutResult } from "../types/public-types";
import { useFormRuntime } from "./use-form-runtime";

function findLayoutById(node: ResolvedLayoutModel, id: string): ResolvedLayoutModel | undefined {
  if (node.id === id) return node;
  for (const child of node.children ?? []) {
    const found = findLayoutById(child, id);
    if (found) return found;
  }
  return undefined;
}

export function useFormLayout(id?: string): UseFormLayoutResult {
  const runtime = useFormRuntime();
  const { evaluation } = useRuntimeContext();
  const layout = runtime.getResolvedLayout();

  if (!id || id === layout.id) {
    return { layout, state: id ? evaluation.layoutState[id] : undefined };
  }

  const nested = findLayoutById(layout, id);
  if (!nested) {
    throw new Error(`Layout not found in resolved model: ${id}`);
  }

  return { layout: nested, state: evaluation.layoutState[id] };
}
