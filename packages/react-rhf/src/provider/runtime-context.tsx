import { createContext, useContext } from "react";

import type { FormRuntime } from "@formwright/core";

const runtimeContext = createContext<FormRuntime | null>(null);

export function RuntimeContextProvider({
  runtime,
  children,
}: {
  runtime: FormRuntime;
  children?: React.ReactNode;
}): React.JSX.Element {
  return <runtimeContext.Provider value={runtime}>{children}</runtimeContext.Provider>;
}

export function useRuntimeContext(): FormRuntime {
  const runtime = useContext(runtimeContext);
  if (!runtime) {
    throw new Error("FormRuntime context is missing. Wrap components in FormRuntimeProvider.");
  }
  return runtime;
}
