import { useEffect, useMemo } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

import type { FormRuntimeProviderProps } from "../types/public-types";
import { RuntimeContextProvider } from "./runtime-context";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function flattenValues(
  value: unknown,
  prefix = "",
  output: Record<string, unknown> = {},
): Record<string, unknown> {
  if (Array.isArray(value)) {
    if (prefix) output[prefix] = value;
    for (const [index, item] of value.entries()) {
      if (isPlainObject(item) || Array.isArray(item)) {
        flattenValues(item, prefix ? `${prefix}.${index}` : String(index), output);
      }
    }
    return output;
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    if (prefix && entries.length === 0) {
      output[prefix] = value;
      return output;
    }
    for (const [key, nextValue] of entries) {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      if (isPlainObject(nextValue) || Array.isArray(nextValue)) {
        flattenValues(nextValue, nextPrefix, output);
      } else {
        output[nextPrefix] = nextValue;
      }
    }
    return output;
  }

  if (prefix) {
    output[prefix] = value;
  }
  return output;
}

export function FormRuntimeProvider({
  runtime,
  initialValues,
  validationResolver,
  hiddenFieldPolicy = "keep",
  children,
}: FormRuntimeProviderProps): React.JSX.Element {
  const evaluationValues = useMemo(() => runtime.evaluate().values, [runtime]);
  const defaultValues = useMemo(
    () => ({ ...evaluationValues, ...(initialValues ?? {}) }),
    [evaluationValues, initialValues],
  );

  const form = useForm<Record<string, unknown>>({
    defaultValues,
    mode: "onChange",
    shouldUnregister: false,
    resolver: validationResolver,
  });
  const evaluationDependencies = useMemo(() => runtime.getEvaluationDependencies(), [runtime]);
  const watchedValues = useWatch({ control: form.control });
  const values = useMemo(() => flattenValues(watchedValues), [watchedValues]);
  const dependencySignature = useMemo(
    () =>
      evaluationDependencies
        .map((path) => JSON.stringify(values[path] ?? null))
        .join("\u0000"),
    [evaluationDependencies, values],
  );
  const derivedEvaluation = useMemo(() => runtime.evaluate(values), [runtime, dependencySignature]);
  const evaluation = useMemo(
    () => ({
      ...derivedEvaluation,
      values,
    }),
    [derivedEvaluation, values],
  );
  useEffect(() => {
    for (const mutation of evaluation.valueMutations ?? []) {
      const currentValue = form.getValues(mutation.path);
      if (currentValue !== mutation.value) {
        form.setValue(mutation.path, mutation.value, {
          shouldDirty: true,
          shouldTouch: false,
          shouldValidate: false,
        });
      }
    }
  }, [evaluation.valueMutations, form]);

  return (
    <RuntimeContextProvider value={{ runtime, form, evaluation, hiddenFieldPolicy }}>
      <FormProvider {...form}>{children}</FormProvider>
    </RuntimeContextProvider>
  );
}
