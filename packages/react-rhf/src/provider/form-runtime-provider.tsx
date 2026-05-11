import { useMemo } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

import type { FormRuntimeProviderProps } from "../types/public-types";
import { RuntimeContextProvider } from "./runtime-context";

export function FormRuntimeProvider({
  runtime,
  initialValues,
  children,
}: FormRuntimeProviderProps): React.JSX.Element {
  const evaluationValues = runtime.evaluate().values;
  const defaultValues = useMemo(
    () => ({ ...evaluationValues, ...(initialValues ?? {}) }),
    [evaluationValues, initialValues],
  );

  const form = useForm<Record<string, unknown>>({
    defaultValues,
    mode: "onChange",
  });
  const values = useWatch({ control: form.control }) as Record<string, unknown>;
  const evaluation = useMemo(() => runtime.evaluate(values), [runtime, values]);

  return (
    <RuntimeContextProvider value={{ runtime, form, evaluation }}>
      <FormProvider {...form}>{children}</FormProvider>
    </RuntimeContextProvider>
  );
}
