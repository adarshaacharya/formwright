import type { ArrayFieldDefinition, DataFieldDefinition, UiFieldNode } from "@formwright/contract";
import type { DerivedFieldState, ResolvedFieldModel, ValidatorPlugin } from "@formwright/core";
import { useController, useFormContext, type RegisterOptions } from "react-hook-form";

import { useRuntimeContext } from "../../provider/runtime-context";
import type { ArrayRendererSlots, FieldRendererComponent, RenderArrayProps } from "../../types/public-types";
import { ArrayComposer } from "../array-composer";
import { DefaultField } from "./default-field";
import { useFormRuntime } from "../../hooks/use-form-runtime";
import { toRHFValidationRules } from "../../validation/to-rhf-validation-rules";
import { useDatasourceOptions } from "../../hooks/use-datasource-options";

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
  readonly,
  required,
  itemType,
  fieldRendererMap,
  fieldSlots,
}: {
  path: string;
  index: number;
  disabled: boolean;
  readonly: boolean;
  required: boolean;
  itemType?: ArrayFieldDefinition["itemType"];
  fieldRendererMap?: Record<string, FieldRendererComponent>;
  fieldSlots?: RenderArrayProps["fieldSlots"];
}): React.JSX.Element {
  const form = useFormContext<Record<string, unknown>>();
  const runtime = useFormRuntime();
  const fieldPath = `${path}.${index}`;
  const controller = useController({ control: form.control, name: fieldPath });
  const fallbackValueType: DataFieldDefinition["valueType"] = itemType ?? "string";
  const syntheticDataField: DataFieldDefinition = {
    valueType: fallbackValueType,
    required,
  };
  const syntheticUiField: UiFieldNode = {
    fieldType: fallbackValueType === "boolean" ? "checkbox" : fallbackValueType,
  };
  const runtimeField: ResolvedFieldModel = {
    path: fieldPath,
    fieldType: syntheticUiField.fieldType,
    valueType: syntheticDataField.valueType,
    rendererKey: syntheticUiField.fieldType,
    dataField: syntheticDataField,
    uiField: syntheticUiField,
  };
  const runtimeState: DerivedFieldState = {
    path: fieldPath,
    visible: true,
    disabled,
    readonly,
    required,
  };
  const Renderer = fieldRendererMap?.[runtimeField.rendererKey] ?? fieldRendererMap?.[runtimeField.fieldType] ?? DefaultField;

  return (
    <Renderer
      path={fieldPath}
      field={runtimeField}
      state={runtimeState}
      value={runtime.deserializeFieldValue(fieldPath, controller.field.value)}
      error={controller.fieldState.error?.message}
      onChange={(nextValue) => controller.field.onChange(runtime.serializeFieldValue(fieldPath, nextValue))}
      onBlur={controller.field.onBlur}
      slots={fieldSlots}
    />
  );
}

function ObjectArrayItemField({
  path,
  index,
  itemKey,
  disabled,
  required,
  readonly,
  fieldPath,
  rendererKey,
  fieldType,
  dataField,
  label,
  description,
  helpText,
  placeholder,
  inputType,
  fieldRendererMap,
  fieldSlots,
}: {
  path: string;
  index: number;
  itemKey: string;
  disabled: boolean;
  required: boolean;
  readonly: boolean;
  fieldPath: string;
  rendererKey: string;
  fieldType: string;
  dataField: DataFieldDefinition;
  label?: string;
  description?: string;
  helpText?: string;
  placeholder?: string;
  inputType?: string;
  fieldRendererMap?: Record<string, FieldRendererComponent>;
  fieldSlots?: RenderArrayProps["fieldSlots"];
}): React.JSX.Element {
  const form = useFormContext<Record<string, unknown>>();
  const runtime = useFormRuntime();
  const { evaluation } = useRuntimeContext();
  const fieldUi: UiFieldNode = {
    fieldType,
    label,
    description,
    helpText,
    placeholder,
    widget: inputType,
  };
  const { loading, options, error: datasourceError } = useDatasourceOptions(fieldPath as `${string}`);
  const pluginValidationRules = (() => {
    const enabledRuleTypes = runtime
      .getFieldValidationPlan(fieldPath)
      .map((item) => item.validatorType);
    const validatorPlugins = runtime
      .getPluginRegistry()
      .list()
      .filter((plugin): plugin is ValidatorPlugin => plugin.kind === "validator")
      .filter((plugin) => {
        if (enabledRuleTypes && enabledRuleTypes.length > 0) {
          return enabledRuleTypes.includes(plugin.validatorType);
        }
        return plugin.supports({
          path: fieldPath,
          dataField,
          uiField: fieldUi,
        });
      });

    if (validatorPlugins.length === 0) return undefined;
    const pluginValidators: NonNullable<
      RegisterOptions<Record<string, unknown>, string>["validate"]
    > = {};
    for (const plugin of validatorPlugins) {
      pluginValidators[plugin.validatorType] = (value) => {
        const result = plugin.validate({
          path: fieldPath,
          value,
          dataField,
          uiField: fieldUi,
          values: evaluation.values,
          context: runtime.getRuntimeContext(),
        });
        return result.valid || result.message || `Validation failed: ${plugin.validatorType}`;
      };
    }
    return pluginValidators;
  })();
  const baseRules = toRHFValidationRules(dataField, required);
  const mergedRules = {
    ...baseRules,
    validate: {
      ...(typeof baseRules.validate === "object" ? baseRules.validate : {}),
      ...(pluginValidationRules ?? {}),
    },
  } as RegisterOptions<Record<string, unknown>, string>;
  const controller = useController({
    control: form.control,
    name: `${path}.${index}.${itemKey}` as const,
    rules: mergedRules as unknown as RegisterOptions<Record<string, unknown>, `${string}.${number}.${string}`>,
  });
  const runtimeField: ResolvedFieldModel = {
    path: fieldPath,
    fieldType,
    valueType: dataField.valueType,
    rendererKey,
    dataField,
    uiField: fieldUi,
  };
  const runtimeState: DerivedFieldState = {
    path: fieldPath,
    visible: true,
    disabled,
    readonly,
    required,
  };
  const Renderer = fieldRendererMap?.[rendererKey] ?? fieldRendererMap?.[fieldType] ?? DefaultField;

  return (
    <Renderer
      path={fieldPath}
      field={runtimeField}
      state={runtimeState}
      value={runtime.deserializeFieldValue(fieldPath, controller.field.value)}
      error={controller.fieldState.error?.message ?? datasourceError}
      onChange={(nextValue) => controller.field.onChange(runtime.serializeFieldValue(fieldPath, nextValue))}
      onBlur={controller.field.onBlur}
      loading={loading}
      options={options}
      slots={fieldSlots}
    />
  );
}

function ObjectArrayItem({
  path,
  index,
  disabled,
  readonly,
  required,
  itemSchema,
  itemLayout,
  itemFieldMeta,
  fieldRendererMap,
  fieldSlots,
}: {
  path: string;
  index: number;
  disabled: boolean;
  readonly: boolean;
  required: boolean;
  itemSchema: Record<string, DataFieldDefinition>;
  itemLayout: string[];
  itemFieldMeta: Record<string, { label?: string; placeholder?: string; inputType?: string }>;
  fieldRendererMap?: Record<string, FieldRendererComponent>;
  fieldSlots?: RenderArrayProps["fieldSlots"];
}): React.JSX.Element {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {itemLayout.filter((key) => key in itemSchema).map((key) => (
        // Nested object-array fields use the same renderer + validation path as scalar fields.
        <ObjectArrayItemField
          key={`${path}-${index}-${key}`}
          path={path}
          index={index}
          itemKey={key}
          disabled={disabled}
          readonly={readonly}
          required={required}
          fieldPath={`${path}.${index}.${key}`}
          fieldType={itemSchema[key].valueType}
          rendererKey={itemFieldMeta[key]?.inputType ?? itemSchema[key].valueType}
          dataField={itemSchema[key]}
          label={itemFieldMeta[key]?.label}
          description={undefined}
          helpText={undefined}
          placeholder={itemFieldMeta[key]?.placeholder}
          inputType={itemFieldMeta[key]?.inputType}
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
  itemFieldMeta,
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
              disabled={state.disabled}
              readonly={state.readonly}
              required={state.required}
              itemSchema={itemSchema ?? {}}
              itemLayout={computedItemLayout}
              itemFieldMeta={itemFieldMeta ?? {}}
              fieldRendererMap={fieldRendererMap}
              fieldSlots={fieldSlots}
            />
          ) : (
            <PrimitiveArrayItem
              path={field.path}
              index={index}
              disabled={state.disabled}
              readonly={state.readonly}
              required={state.required}
              itemType={itemType}
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
