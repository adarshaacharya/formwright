import type { ArrayFieldDefinition, DataFieldDefinition } from "@formwright/contract";

import type { ArrayRendererSlots, FieldRendererComponent, RenderArrayProps } from "../../types/public-types";
import { ArrayComposer } from "../array-composer";
import { DefaultField } from "./default-field";
import { useDatasourceOptions } from "../../hooks/use-datasource-options";
import { useFormField } from "../../hooks/use-form-field";

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
  fieldRendererMap,
  fieldSlots,
}: {
  path: string;
  index: number;
  fieldRendererMap?: Record<string, FieldRendererComponent>;
  fieldSlots?: RenderArrayProps["fieldSlots"];
}): React.JSX.Element {
  const fieldPath = `${path}.${index}`;
  const { field, state, value, error, setValue, onBlur } = useFormField(fieldPath as `${string}`);
  const Renderer = fieldRendererMap?.[field.rendererKey] ?? fieldRendererMap?.[field.fieldType] ?? DefaultField;

  return (
    <Renderer
      path={fieldPath}
      field={field}
      state={state}
      value={value}
      error={error}
      onChange={setValue}
      onBlur={onBlur}
      slots={fieldSlots}
    />
  );
}

function ObjectArrayItemField({
  fieldPath,
  fieldRendererMap,
  fieldSlots,
}: {
  fieldPath: string;
  fieldRendererMap?: Record<string, FieldRendererComponent>;
  fieldSlots?: RenderArrayProps["fieldSlots"];
}): React.JSX.Element {
  const { field, state, value, error, setValue, onBlur } = useFormField(fieldPath as `${string}`);
  const { loading, options, error: datasourceError } = useDatasourceOptions(fieldPath as `${string}`);
  const Renderer = fieldRendererMap?.[field.rendererKey] ?? fieldRendererMap?.[field.fieldType] ?? DefaultField;

  return (
    <Renderer
      path={fieldPath}
      field={field}
      state={state}
      value={value}
      error={error ?? datasourceError}
      onChange={setValue}
      onBlur={onBlur}
      loading={loading}
      options={options}
      slots={fieldSlots}
    />
  );
}

function ObjectArrayItem({
  path,
  index,
  itemSchema,
  itemLayout,
  fieldRendererMap,
  fieldSlots,
}: {
  path: string;
  index: number;
  itemSchema: Record<string, DataFieldDefinition>;
  itemLayout: string[];
  fieldRendererMap?: Record<string, FieldRendererComponent>;
  fieldSlots?: RenderArrayProps["fieldSlots"];
}): React.JSX.Element {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {itemLayout.filter((key) => key in itemSchema).map((key) => (
        // Nested object-array fields use the same renderer + validation path as scalar fields.
        <ObjectArrayItemField
          key={`${path}-${index}-${key}`}
          fieldPath={`${path}.${index}.${key}`}
          fieldRendererMap={fieldRendererMap}
          fieldSlots={fieldSlots}
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
  fieldRendererMap,
  fieldSlots,
  itemType,
  slots,
}: RenderArrayProps): React.JSX.Element | null {
  const isObjectArray = isArrayFieldDefinition(field.dataField) && field.dataField.itemType === "object";
  const computedItemLayout = itemLayout ?? Object.keys(itemSchema ?? {});
  const ItemShell = slots?.ItemShell ?? DefaultArrayItemShell;
  const footer = (
    <button type="button" onClick={() => append()} disabled={state.disabled || state.readonly}>
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
              itemSchema={itemSchema ?? {}}
              itemLayout={computedItemLayout}
              fieldRendererMap={fieldRendererMap}
              fieldSlots={fieldSlots}
            />
          ) : (
            <PrimitiveArrayItem
              path={field.path}
              index={index}
              fieldRendererMap={fieldRendererMap}
              fieldSlots={fieldSlots}
            />
          )}
          <button type="button" onClick={() => remove(index)} disabled={state.disabled || state.readonly}>
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
