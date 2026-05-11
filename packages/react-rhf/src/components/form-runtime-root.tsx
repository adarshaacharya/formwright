import type { FormRuntimeRootProps } from "../types/public-types";
import { useFormLayout } from "../hooks/use-form-layout";

export function FormRuntimeRoot({ rootLayoutId }: FormRuntimeRootProps): React.JSX.Element {
  const { layout } = useFormLayout(rootLayoutId);
  return <div data-formwright-layout={layout.type} />;
}
