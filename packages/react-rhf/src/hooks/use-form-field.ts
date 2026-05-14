import { useEffect, useMemo, useRef } from "react";
import type { FieldPath } from "@formwright/contract";
import type { ValidatorPlugin } from "@formwright/core";
import { useController, useFormContext, type RegisterOptions } from "react-hook-form";
import { useRuntimeContext } from "../provider/runtime-context";
import type { UseFormFieldResult } from "../types/public-types";
import { toRHFValidationRules } from "../validation/to-rhf-validation-rules";
import { useFormRuntime } from "./use-form-runtime";

export function useFormField(path: FieldPath): UseFormFieldResult {
  const runtime = useFormRuntime();
  const { evaluation, hiddenFieldPolicy } = useRuntimeContext();
  const form = useFormContext<Record<string, unknown>>();
  const field = runtime.getResolvedFields()[path];

  if (!field) {
    throw new Error(`Field not found in resolved model: ${path}`);
  }

  const state = evaluation.fieldState[path] ?? {
    path,
    visible: true,
    disabled: false,
    readonly: false,
    required: false,
  };
  const validationRules = useMemo(
    () => toRHFValidationRules(field.dataField, state.required),
    [field.dataField, state.required],
  );
  const pluginValidationRules = useMemo<
    NonNullable<RegisterOptions<Record<string, unknown>, FieldPath>["validate"]> | undefined
  >(() => {
    const enabledRuleTypes = runtime
      .getFieldValidationPlan(path)
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
          path,
          dataField: field.dataField,
          uiField: field.uiField,
        });
      });

    if (validatorPlugins.length === 0) return undefined;

    const pluginValidators: NonNullable<
      RegisterOptions<Record<string, unknown>, FieldPath>["validate"]
    > = {};
    for (const plugin of validatorPlugins) {
      pluginValidators[plugin.validatorType] = (value) => {
        const result = plugin.validate({
          path,
          value,
          dataField: field.dataField,
          uiField: field.uiField,
          values: evaluation.values,
          context: runtime.getRuntimeContext(),
        });
        return result.valid || result.message || `Validation failed: ${plugin.validatorType}`;
      };
    }
    return pluginValidators;
  }, [evaluation.values, field.dataField, field.uiField, path, runtime]);
  const mergedValidationRules = useMemo(() => {
    if (!pluginValidationRules) return validationRules;
    return {
      ...validationRules,
      validate: {
        ...(typeof validationRules.validate === "object" ? validationRules.validate : {}),
        ...pluginValidationRules,
      },
    };
  }, [pluginValidationRules, validationRules]);
  const controller = useController<Record<string, unknown>, FieldPath>({
    control: form.control,
    name: path,
    shouldUnregister: false,
    rules: mergedValidationRules,
  });
  const wasVisibleRef = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    const wasVisible = wasVisibleRef.current;
    const becameHidden = wasVisible === true && !state.visible;
    const startsHidden = wasVisible === undefined && !state.visible;
    if (becameHidden || startsHidden) {
      if (hiddenFieldPolicy === "clear") {
        form.setValue(path, undefined, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
        form.clearErrors(path);
      }
      if (hiddenFieldPolicy === "unregister") {
        form.unregister(path);
      }
    }
    wasVisibleRef.current = state.visible;
  }, [form, hiddenFieldPolicy, path, state.visible]);

  return {
    field,
    state,
    value: runtime.deserializeFieldValue(path, controller.field.value),
    error: controller.fieldState.error?.message ?? state.errors?.[0],
    setValue(value) {
      controller.field.onChange(runtime.serializeFieldValue(path, value));
    },
    onBlur() {
      controller.field.onBlur();
    },
  };
}
