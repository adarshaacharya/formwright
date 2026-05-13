import type { FieldPath } from "@formwright/contract";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { useRuntimeContext } from "../provider/runtime-context";
import { useFormRuntime } from "./use-form-runtime";

export interface UseFormArrayResult {
  path: FieldPath;
  itemType?: string;
  visible: boolean;
  disabled: boolean;
  readonly: boolean;
  items: Array<{ id: string; value: unknown }>;
  append: (value?: unknown) => void;
  remove: (index: number) => void;
}

export function useFormArray(path: FieldPath): UseFormArrayResult {
  const form = useFormContext<Record<string, unknown>>();
  const runtime = useFormRuntime();
  const { evaluation } = useRuntimeContext();
  const resolvedField = runtime.getResolvedFields()[path];
  const watchedValues = useWatch({ control: form.control, name: path }) as unknown[] | undefined;
  const state = evaluation.fieldState[path] ?? {
    path,
    visible: true,
    disabled: false,
    readonly: false,
    required: false,
  };

  const fieldArray = useFieldArray({
    control: form.control,
    name: path as never,
    shouldUnregister: false,
  }) as unknown as {
    fields: Array<{ id: string }>;
    append: (value: unknown) => void;
    remove: (index: number) => void;
  };

  return {
    path,
    itemType: resolvedField?.dataField.valueType === "array" ? resolvedField.dataField.itemType : undefined,
    visible: state.visible,
    disabled: state.disabled,
    readonly: state.readonly,
    items: fieldArray.fields.map((entry, index) => ({
      id: entry.id,
      value: watchedValues?.[index],
    })),
    append(value?: unknown) {
      if (value !== undefined) {
        fieldArray.append(value as never);
        return;
      }

      if (resolvedField?.dataField.valueType === "array") {
        if (resolvedField.dataField.itemType === "object") {
          const next: Record<string, unknown> = {};
          for (const [key, def] of Object.entries(resolvedField.dataField.itemSchema ?? {})) {
            next[key] = def.default;
          }
          fieldArray.append(next as never);
          return;
        }

        if (resolvedField.dataField.itemType === "number" || resolvedField.dataField.itemType === "integer") {
          fieldArray.append(0 as never);
          return;
        }

        if (resolvedField.dataField.itemType === "boolean") {
          fieldArray.append(false as never);
          return;
        }
      }

      fieldArray.append("" as never);
    },
    remove(index: number) {
      fieldArray.remove(index);
    },
  };
}
