import type { ArrayFieldDefinition, DataFieldDefinition } from "@formwright/contract";
import type { DerivedFieldState, ResolvedFieldModel, ValidatorPlugin } from "@formwright/core";
import { useController, useFormContext, type RegisterOptions } from "react-hook-form";

import { useRuntimeContext } from "../../provider/runtime-context";
import type { ArrayRendererSlots, FieldRendererComponent, RenderArrayProps } from "../../types/public-types";
import { ArrayComposer } from "../array-composer";
import { DefaultField } from "./default-field";
import { useFormRuntime } from "../../hooks/use-form-runtime";
import { toRHFValidationRules } from "../../validation/to-rhf-validation-rules";

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
  const pluginValidationRules = (() => {
    const enabledRuleTypes = dataField.serverValidation?.rules;
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
          uiField: undefined,
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
          uiField: undefined,
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
    uiField: {
      fieldType,
      label,
      description,
      helpText,
      placeholder,
      widget: inputType,
    },
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
      value={controller.field.value}
      error={controller.fieldState.error?.message}
      onChange={controller.field.onChange}
      onBlur={controller.field.onBlur}
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
              readonly={state.readonly}
              required={state.required}
              itemSchema={itemSchema ?? {}}
              itemLayout={computedItemLayout}
              itemFieldMeta={itemFieldMeta ?? {}}
              fieldRendererMap={fieldRendererMap}
              fieldSlots={fieldSlots}
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
