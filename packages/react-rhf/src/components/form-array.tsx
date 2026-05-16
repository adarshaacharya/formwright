import { createContext, useContext } from "react";
import type { FieldPath } from "@formwright/contract";
import type { ResolvedFieldModel } from "@formwright/core";

import { useFormArray } from "../hooks/use-form-array";
import { useFormRuntime } from "../hooks/use-form-runtime";
import type {
  FormArrayItemProps,
  FormArrayItemsProps,
  FormArrayRemoveProps,
  FormArrayRootProps,
} from "../types/public-types";

interface FormArrayContextValue {
  path: FieldPath;
  field?: ResolvedFieldModel;
  visible: boolean;
  disabled: boolean;
  readonly: boolean;
  items: Array<{ id: string; value: unknown }>;
  append: (value?: unknown) => void;
  remove: (index: number) => void;
}

const formArrayContext = createContext<FormArrayContextValue | null>(null);

function useFormArrayContext(): FormArrayContextValue {
  const context = useContext(formArrayContext);
  if (!context) {
    throw new Error("FormArray parts must be rendered inside FormArray.Root.");
  }
  return context;
}

export function FormArrayRoot({ path, children }: FormArrayRootProps): React.JSX.Element | null {
  const runtime = useFormRuntime();
  const field = runtime.getResolvedFields()[path];
  const array = useFormArray(path);

  if (!field) {
    throw new Error(`Array field not found in resolved model: ${path}`);
  }

  return (
    <formArrayContext.Provider
      value={{
        path,
        field,
        visible: array.visible,
        disabled: array.disabled,
        readonly: array.readonly,
        items: array.items,
        append: array.append,
        remove: array.remove,
      }}
    >
      {children}
    </formArrayContext.Provider>
  );
}

export function FormArrayHeader(): React.JSX.Element | null {
  const { field } = useFormArrayContext();
  if (!field) return null;

  const label = field.uiField?.label ?? field.path;
  const description = field.uiField?.description;

  return (
    <div style={{ display: "grid", gap: 4 }}>
      <label>{label}</label>
      {description ? <small style={{ color: "#666" }}>{description}</small> : null}
    </div>
  );
}

export function FormArrayItems({ children }: FormArrayItemsProps): React.JSX.Element {
  const { items } = useFormArrayContext();
  return <>{items.map((item, index) => children(item, index))}</>;
}

export function FormArrayItem({ children }: FormArrayItemProps): React.JSX.Element {
  const { visible } = useFormArrayContext();
  return <div style={{ display: visible ? "grid" : "none", gap: 8 }}>{children}</div>;
}

export function FormArrayAdd({ children }: { children?: React.ReactNode }): React.JSX.Element {
  const { append, disabled, readonly } = useFormArrayContext();
  return (
    <button type="button" onClick={() => append()} disabled={disabled || readonly}>
      {children ?? "add item"}
    </button>
  );
}

export function FormArrayRemove({ index, children }: FormArrayRemoveProps): React.JSX.Element {
  const { remove, disabled, readonly } = useFormArrayContext();
  return (
    <button type="button" onClick={() => remove(index)} disabled={disabled || readonly}>
      {children ?? "remove"}
    </button>
  );
}

export const FormArray = {
  Root: FormArrayRoot,
  Header: FormArrayHeader,
  Items: FormArrayItems,
  Item: FormArrayItem,
  Add: FormArrayAdd,
  Remove: FormArrayRemove,
};
