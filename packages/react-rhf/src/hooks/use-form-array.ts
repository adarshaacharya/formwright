import type { FieldPath } from "@formwright/contract";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { useRuntimeContext } from "../provider/runtime-context";

export interface UseFormArrayResult {
  path: FieldPath;
  visible: boolean;
  disabled: boolean;
  readonly: boolean;
  items: Array<{ id: string; value: unknown }>;
  append: (value?: unknown) => void;
  remove: (index: number) => void;
}

export function useFormArray(path: FieldPath): UseFormArrayResult {
  const form = useFormContext<Record<string, unknown>>();
  const { evaluation } = useRuntimeContext();
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
    visible: state.visible,
    disabled: state.disabled,
    readonly: state.readonly,
    items: fieldArray.fields.map((entry, index) => ({
      id: entry.id,
      value: watchedValues?.[index],
    })),
    append(value = "") {
      fieldArray.append(value as never);
    },
    remove(index: number) {
      fieldArray.remove(index);
    },
  };
}
