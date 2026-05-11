import type { FormRuntimeProviderProps } from "../types/public-types";
import { RuntimeContextProvider } from "./runtime-context";

export function FormRuntimeProvider({
  runtime,
  children,
}: FormRuntimeProviderProps): React.JSX.Element {
  return <RuntimeContextProvider runtime={runtime}>{children}</RuntimeContextProvider>;
}
