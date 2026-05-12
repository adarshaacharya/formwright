import type { ArrayFieldDefinition, DataFieldDefinition } from "@formwright/contract";
import { useController, useFormContext } from "react-hook-form";

import type { ArrayRendererSlots, RenderArrayProps } from "../../types/public-types";
import { ArrayComposer } from "../array-composer";

function isArrayFieldDefinition(field: DataFieldDefinition): field is ArrayFieldDefinition {
  return field.valueType === "array";
}

function DefaultArrayItemShell({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div style={{ display: "grid", gap: 8, border: "1px solid #ddd", padding: 8 }}>
      {children}
    </div>
  );
}

function PrimitiveArrayItem({
  path,
  index,
  disabled,
  itemType,
}: {
  path: string;
  index: number;
  disabled: boolean;
  itemType?: string;
}): React.JSX.Element {
  const form = useFormContext<Record<string, unknown>>();
  const controller = useController({ control: form.control, name: `${path}.${index}` as const });
  if (itemType === "boolean") {
    return (
      <input
        type="checkbox"
        checked={Boolean(controller.field.value)}
        onChange={(event) => controller.field.onChange(event.target.checked)}
        onBlur={controller.field.onBlur}
        disabled={disabled}
      />
    );
  }

  if (itemType === "number" || itemType === "integer") {
    return (
      <input
        type="number"
        value={(controller.field.value as string | number | undefined) ?? ""}
        onChange={(event) =>
          controller.field.onChange(event.target.value === "" ? undefined : Number(event.target.value))
        }
        onBlur={controller.field.onBlur}
        disabled={disabled}
      />
    );
  }

  return (
    <input
      value={(controller.field.value as string | number | undefined) ?? ""}
      onChange={(event) => controller.field.onChange(event.target.value)}
      onBlur={controller.field.onBlur}
      disabled={disabled}
    />
  );
}

function ObjectArrayItemField({
  path,
  index,
  itemKey,
  disabled,
  label,
  placeholder,
  inputType,
}: {
  path: string;
  index: number;
  itemKey: string;
  disabled: boolean;
  label?: string;
  placeholder?: string;
  inputType?: string;
}): React.JSX.Element {
  const form = useFormContext<Record<string, unknown>>();
  const controller = useController({
    control: form.control,
    name: `${path}.${index}.${itemKey}` as const,
  });
  return (
    <label style={{ display: "grid", gap: 4 }}>
      <span>{label ?? itemKey}</span>
      <input
        type={inputType ?? "text"}
        value={(controller.field.value as string | number | undefined) ?? ""}
        onChange={(event) => controller.field.onChange(event.target.value)}
        onBlur={controller.field.onBlur}
        disabled={disabled}
        placeholder={placeholder}
      />
    </label>
  );
}

function ObjectArrayItem({
  path,
  index,
  disabled,
  itemSchema,
  itemLayout,
  itemFieldMeta,
}: {
  path: string;
  index: number;
  disabled: boolean;
  itemSchema: Record<string, DataFieldDefinition>;
  itemLayout: string[];
  itemFieldMeta: Record<string, { label?: string; placeholder?: string; inputType?: string }>;
}): React.JSX.Element {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {itemLayout.filter((key) => key in itemSchema).map((key) => (
        <ObjectArrayItemField
          key={`${path}-${index}-${key}`}
          path={path}
          index={index}
          itemKey={key}
          disabled={disabled}
          label={itemFieldMeta[key]?.label}
          placeholder={itemFieldMeta[key]?.placeholder}
          inputType={itemFieldMeta[key]?.inputType}
        />
      ))}
    </div>
  );
}

export function DefaultArrayField({
  field,
  state,
  items,
  append,
  remove,
  itemSchema,
  itemLayout,
  itemFieldMeta,
  itemType,
  slots,
}: RenderArrayProps): React.JSX.Element | null {
  const isObjectArray = isArrayFieldDefinition(field.dataField) && field.dataField.itemType === "object";
  const computedItemLayout = itemLayout ?? Object.keys(itemSchema ?? {});
  const ItemShell = slots?.ItemShell ?? DefaultArrayItemShell;
  const footer = (
    <button type="button" onClick={() => append()} disabled={state.disabled}>
      add item
    </button>
  );

  return (
    <ArrayComposer
      field={field}
      state={state}
      label={field.uiField?.label ?? field.path}
      description={field.uiField?.description}
      footer={footer}
      slots={slots}
    >
      {items.map((item, index) => (
        <ItemShell key={item.id} field={field} state={state} index={index}>
          {isObjectArray ? (
            <ObjectArrayItem
              path={field.path}
              index={index}
              disabled={state.disabled}
              itemSchema={itemSchema ?? {}}
              itemLayout={computedItemLayout}
              itemFieldMeta={itemFieldMeta ?? {}}
            />
          ) : (
            <PrimitiveArrayItem path={field.path} index={index} disabled={state.disabled} itemType={itemType} />
          )}
          <button type="button" onClick={() => remove(index)} disabled={state.disabled}>
            remove
          </button>
        </ItemShell>
      ))}
    </ArrayComposer>
  );
}

export function DefaultArrayFieldRenderer(props: RenderArrayProps): React.JSX.Element | null {
  return <DefaultArrayField {...props} />;
}
