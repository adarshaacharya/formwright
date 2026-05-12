import type { FormRuntimeRootProps } from "../types/public-types";
import { useFormLayout } from "../hooks/use-form-layout";
import { renderNode } from "./internal/render-node";

export function FormRuntimeRoot({
  rootLayoutId,
  fieldRendererMap = {},
  arrayFieldRendererMap = {},
  layoutRendererMap = {},
  fieldSlots,
  arraySlots,
}: FormRuntimeRootProps): React.JSX.Element {
  const { layout } = useFormLayout(rootLayoutId);
  return (
    <div data-formwright-layout={layout.type}>
      {renderNode(
        layout,
        rootLayoutId ?? "root",
        fieldRendererMap,
        arrayFieldRendererMap,
        layoutRendererMap,
        fieldSlots,
        arraySlots,
      )}
    </div>
  );
}
