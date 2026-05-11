import { useFormLayout } from "@formwright/react-rhf";
import { BasicField } from "./basic-field";

function renderLayoutChildren(layout: ReturnType<typeof useFormLayout>["layout"]): React.JSX.Element[] {
  const children = layout.children ?? [];

  return children.flatMap((child, index) => {
    if (child.type === "field" && child.fieldRef) {
      return [<BasicField key={`field-${child.fieldRef}-${index}`} path={child.fieldRef} />];
    }
    if (child.children?.length) {
      return renderLayoutChildren(child);
    }
    return [];
  });
}

export function BasicLayout(): React.JSX.Element {
  const { layout } = useFormLayout("root-stack");

  return <div style={{ display: "grid", gap: 16 }}>{renderLayoutChildren(layout)}</div>;
}
