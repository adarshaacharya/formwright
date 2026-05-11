import type { ArrayFieldDefinition, DataFieldDefinition } from "@formwright/contract";
import { useController, useFormContext } from "react-hook-form";

import type { RenderArrayProps } from "@formwright/react-rhf";

function isArrayFieldDefinition(field: DataFieldDefinition): field is ArrayFieldDefinition {
  return field.valueType === "array";
}

function buildObjectDefault(itemSchema: Record<string, DataFieldDefinition> | undefined): Record<string, unknown> {
  const next: Record<string, unknown> = {};
  for (const [key, def] of Object.entries(itemSchema ?? {})) next[key] = def.default;
  return next;
}

function PrimitiveArrayItem({
  path,
  index,
  disabled,
}: {
  path: string;
  index: number;
  disabled: boolean;
}): React.JSX.Element {
  const form = useFormContext<Record<string, unknown>>();
  const controller = useController({ control: form.control, name: `${path}.${index}` as const });
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
}: RenderArrayProps): React.JSX.Element | null {
  if (!state.visible) return null;

  const isObjectArray = isArrayFieldDefinition(field.dataField) && field.dataField.itemType === "object";
  const computedItemLayout = itemLayout ?? Object.keys(itemSchema ?? {});

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <label>{field.uiField?.label ?? field.path}</label>
      {items.map((item, index) => (
        <div key={item.id} style={{ display: "grid", gap: 8, border: "1px solid #ddd", padding: 8 }}>
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
            <PrimitiveArrayItem path={field.path} index={index} disabled={state.disabled} />
          )}
          <button type="button" onClick={() => remove(index)} disabled={state.disabled}>
            remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => append(isObjectArray ? buildObjectDefault(itemSchema) : "")}
        disabled={state.disabled}
      >
        add item
      </button>
    </div>
  );
}

export function DefaultArrayFieldRenderer(props: RenderArrayProps): React.JSX.Element | null {
  return <DefaultArrayField {...props} />;
}
