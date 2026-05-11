import type { DataFieldDefinition, FieldPath } from "@formwright/contract";
import { useController, useFormContext } from "react-hook-form";

import { useFormArray } from "../../hooks/use-form-array";
import { useFormRuntime } from "../../hooks/use-form-runtime";

type ItemFieldMeta = Record<string, { label?: string; placeholder?: string; inputType?: string }>;

function parseItemLayout(
  componentProps: Record<string, unknown> | undefined,
  itemSchema: Record<string, DataFieldDefinition> | undefined,
): string[] {
  const configured =
    componentProps && Array.isArray(componentProps.itemLayout) ? (componentProps.itemLayout as string[]) : undefined;
  return configured ?? Object.keys(itemSchema ?? {});
}

function parseItemFieldMeta(componentProps: Record<string, unknown> | undefined): ItemFieldMeta {
  if (!componentProps || typeof componentProps.itemFields !== "object") return {};
  return componentProps.itemFields as ItemFieldMeta;
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
  path: FieldPath;
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
  path: FieldPath;
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
  path: FieldPath;
  index: number;
  disabled: boolean;
  itemSchema: Record<string, DataFieldDefinition>;
  itemLayout: string[];
  itemFieldMeta: ItemFieldMeta;
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

export function DefaultArrayField({ path }: { path: FieldPath }): React.JSX.Element | null {
  const runtime = useFormRuntime();
  const resolved = runtime.getResolvedFields()[path];
  const arrayField = useFormArray(path);
  if (!arrayField.visible || !resolved || resolved.valueType !== "array") return null;

  const isObjectArray = resolved.dataField.itemType === "object";
  const itemSchema = resolved.dataField.itemSchema;
  const componentProps = (resolved.uiField?.componentProps ?? {}) as Record<string, unknown>;
  const itemLayout = parseItemLayout(componentProps, itemSchema);
  const itemFieldMeta = parseItemFieldMeta(componentProps);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <label>{resolved.uiField?.label ?? path}</label>
      {arrayField.items.map((item, index) => (
        <div key={item.id} style={{ display: "grid", gap: 8, border: "1px solid #ddd", padding: 8 }}>
          {isObjectArray ? (
            <ObjectArrayItem
              path={path}
              index={index}
              disabled={arrayField.disabled}
              itemSchema={itemSchema ?? {}}
              itemLayout={itemLayout}
              itemFieldMeta={itemFieldMeta}
            />
          ) : (
            <PrimitiveArrayItem path={path} index={index} disabled={arrayField.disabled} />
          )}
          <button type="button" onClick={() => arrayField.remove(index)} disabled={arrayField.disabled}>
            remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => arrayField.append(isObjectArray ? buildObjectDefault(itemSchema) : "")}
        disabled={arrayField.disabled}
      >
        add item
      </button>
    </div>
  );
}
