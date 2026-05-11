import type { FieldPath } from "@formwright/contract";
import type { ResolvedLayoutModel } from "@formwright/core";
import type {
  FieldRendererComponent,
  FormRuntimeRootProps,
  LayoutRendererComponent,
} from "../types/public-types";
import { useFormField } from "../hooks/use-form-field";
import { useFormLayout } from "../hooks/use-form-layout";

function DefaultField({ path }: { path: FieldPath }): React.JSX.Element | null {
  const { field, state, value, error, setValue, onBlur } = useFormField(path);
  if (!state.visible) return null;

  const label = field.uiField?.label ?? path;
  if (field.fieldType === "select") {
    return (
      <div style={{ display: "grid", gap: 6 }}>
        <label>{label}</label>
        <select
          value={(value as string | undefined) ?? ""}
          onChange={(event) => setValue(event.target.value)}
          onBlur={onBlur}
          disabled={state.disabled}
        >
          <option value="">Select an option</option>
          {(field.uiField?.options ?? []).map((option) => (
            <option key={`${path}-${String(option.value)}`} value={String(option.value)} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        {error ? <small style={{ color: "crimson" }}>{error}</small> : null}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label>{label}</label>
      <input
        value={(value as string | number | undefined) ?? ""}
        onChange={(event) => setValue(event.target.value)}
        onBlur={onBlur}
        placeholder={field.uiField?.placeholder}
        disabled={state.disabled}
      />
      {error ? <small style={{ color: "crimson" }}>{error}</small> : null}
    </div>
  );
}

function DefaultLayout({ children }: { children?: React.ReactNode }): React.JSX.Element {
  return <div style={{ display: "grid", gap: 16 }}>{children}</div>;
}

const FallbackLayoutRenderer: LayoutRendererComponent = ({ children }) => (
  <DefaultLayout>{children}</DefaultLayout>
);

function renderNode(
  node: ResolvedLayoutModel,
  key: string,
  fieldRendererMap: Record<string, FieldRendererComponent>,
  layoutRendererMap: Record<string, LayoutRendererComponent>,
): React.JSX.Element | null {
  if (node.type === "field" && node.fieldRef) {
    const FieldRenderer = fieldRendererMap[node.rendererKey] ?? fieldRendererMap[node.type] ?? DefaultField;
    return <FieldRenderer key={key} path={node.fieldRef} />;
  }

  const LayoutRenderer =
    layoutRendererMap[node.rendererKey] ?? layoutRendererMap[node.type] ?? FallbackLayoutRenderer;
  const children = (node.children ?? []).map((child, index) =>
    renderNode(child, `${key}-${index}`, fieldRendererMap, layoutRendererMap),
  );

  return (
    <LayoutRenderer key={key} layout={node}>
      {children}
    </LayoutRenderer>
  );
}

export function FormRuntimeRoot({
  rootLayoutId,
  fieldRendererMap = {},
  layoutRendererMap = {},
}: FormRuntimeRootProps): React.JSX.Element {
  const { layout } = useFormLayout(rootLayoutId);
  return (
    <div data-formwright-layout={layout.type}>
      {renderNode(layout, rootLayoutId ?? "root", fieldRendererMap, layoutRendererMap)}
    </div>
  );
}
