import { useEffect, useMemo } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

import type { FormRuntimeProviderProps } from "../types/public-types";
import { RuntimeContextProvider } from "./runtime-context";

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
    resolver: validationResolver,
  });
  const evaluationDependencies = useMemo(() => runtime.getEvaluationDependencies(), [runtime]);
  const watchConfig = evaluationDependencies.length > 0 ? { name: evaluationDependencies as never } : {};
  const watchedValues = useWatch({
    control: form.control,
    ...watchConfig,
  }) as unknown;
  const values = useMemo(() => {
    if (!evaluationDependencies.length) return defaultValues;
    if (Array.isArray(watchedValues)) {
      return evaluationDependencies.reduce<Record<string, unknown>>((acc, path, index) => {
        acc[path] = watchedValues[index];
        return acc;
      }, {});
    }
    return watchedValues && typeof watchedValues === "object"
      ? (watchedValues as Record<string, unknown>)
      : defaultValues;
  }, [defaultValues, evaluationDependencies, watchedValues]);
  const evaluation = useMemo(() => runtime.evaluate(values), [runtime, values]);

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
