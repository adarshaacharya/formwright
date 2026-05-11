import type { FieldPath } from "@formwright/contract";
import type { ResolvedLayoutModel } from "@formwright/core";

import { useFormRuntime } from "../../hooks/use-form-runtime";
import type {
  ArrayFieldRendererComponent,
  FieldRendererComponent,
  LayoutRendererComponent,
} from "../../types/public-types";
import { DefaultArrayField } from "./default-array-field";
import { DefaultField } from "./default-field";

function DefaultLayout({ children }: { children?: React.ReactNode }): React.JSX.Element {
  return <div style={{ display: "grid", gap: 16 }}>{children}</div>;
}

const FallbackLayoutRenderer: LayoutRendererComponent = ({ children }) => (
  <DefaultLayout>{children}</DefaultLayout>
);

function ArrayOrField({
  path,
  FieldRenderer,
  ArrayRenderer,
}: {
  path: FieldPath;
  FieldRenderer: FieldRendererComponent;
  ArrayRenderer: ArrayFieldRendererComponent;
}): React.JSX.Element | null {
  const runtime = useFormRuntime();
  const resolved = runtime.getResolvedFields()[path];
  if (resolved?.valueType === "array") return <ArrayRenderer path={path} />;
  return <FieldRenderer path={path} />;
}

export function renderNode(
  node: ResolvedLayoutModel,
  key: string,
  fieldRendererMap: Record<string, FieldRendererComponent>,
  arrayFieldRendererMap: Record<string, ArrayFieldRendererComponent>,
  layoutRendererMap: Record<string, LayoutRendererComponent>,
): React.JSX.Element | null {
  if (node.type === "field" && node.fieldRef) {
    const arrayRenderer =
      arrayFieldRendererMap[node.rendererKey] ?? arrayFieldRendererMap[node.type] ?? DefaultArrayField;
    const fieldRenderer = fieldRendererMap[node.rendererKey] ?? fieldRendererMap[node.type] ?? DefaultField;
    return <ArrayOrField key={key} path={node.fieldRef} FieldRenderer={fieldRenderer} ArrayRenderer={arrayRenderer} />;
  }

  const LayoutRenderer = layoutRendererMap[node.rendererKey] ?? layoutRendererMap[node.type] ?? FallbackLayoutRenderer;
  const children = (node.children ?? []).map((child, index) =>
    renderNode(child, `${key}-${index}`, fieldRendererMap, arrayFieldRendererMap, layoutRendererMap),
  );

  return (
    <LayoutRenderer key={key} layout={node}>
      {children}
    </LayoutRenderer>
  );
}
