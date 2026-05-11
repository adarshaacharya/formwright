import { createContext, useContext } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { FormRuntime, RuntimeEvaluationResult } from "@formwright/core";

export interface RuntimeAdapterContextValue {
  runtime: FormRuntime;
  form: UseFormReturn<Record<string, unknown>>;
  evaluation: RuntimeEvaluationResult;
}

const runtimeContext = createContext<RuntimeAdapterContextValue | null>(null);

export function RuntimeContextProvider({
  value,
  children,
}: {
  value: RuntimeAdapterContextValue;
  children?: React.ReactNode;
}): React.JSX.Element {
  return <runtimeContext.Provider value={value}>{children}</runtimeContext.Provider>;
}

export function useRuntimeContext(): RuntimeAdapterContextValue {
  const runtime = useContext(runtimeContext);
  if (!runtime) {
    throw new Error("FormRuntime context is missing. Wrap components in FormRuntimeProvider.");
  }
  return runtime;
}
