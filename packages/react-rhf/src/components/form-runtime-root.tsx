import type { FieldPath } from "@formwright/contract";
import type { ResolvedLayoutModel } from "@formwright/core";
import { useController, useFormContext } from "react-hook-form";
import type {
  ArrayFieldRendererComponent,
  FieldRendererComponent,
  FormRuntimeRootProps,
  LayoutRendererComponent,
} from "../types/public-types";
import { useFormArray } from "../hooks/use-form-array";
import { useFormField } from "../hooks/use-form-field";
import { useFormLayout } from "../hooks/use-form-layout";
import { useFormRuntime } from "../hooks/use-form-runtime";

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

function DefaultArrayField({ path }: { path: FieldPath }): React.JSX.Element | null {
  const arrayField = useFormArray(path);
  if (!arrayField.visible) return null;

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <label>{path}</label>
      {arrayField.items.map((item, index) => (
        <div key={item.id} style={{ display: "flex", gap: 8 }}>
          <DefaultArrayItemInput path={path} index={index} disabled={arrayField.disabled} />
          <button type="button" onClick={() => arrayField.remove(index)} disabled={arrayField.disabled}>
            remove
          </button>
        </div>
      ))}
      <button type="button" onClick={() => arrayField.append("")} disabled={arrayField.disabled}>
        add item
      </button>
    </div>
  );
}

function DefaultArrayItemInput({
  path,
  index,
  disabled,
}: {
  path: FieldPath;
  index: number;
  disabled: boolean;
}): React.JSX.Element {
  const form = useFormContext<Record<string, unknown>>();
  const itemPath = `${path}.${index}` as const;
  const controller = useController({
    control: form.control,
    name: itemPath,
  });

  return (
    <input
      value={(controller.field.value as string | number | undefined) ?? ""}
      onChange={(event) => controller.field.onChange(event.target.value)}
      onBlur={controller.field.onBlur}
      disabled={disabled}
    />
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
  arrayFieldRendererMap: Record<string, ArrayFieldRendererComponent>,
  layoutRendererMap: Record<string, LayoutRendererComponent>,
): React.JSX.Element | null {
  if (node.type === "field" && node.fieldRef) {
    const arrayRenderer =
      arrayFieldRendererMap[node.rendererKey] ?? arrayFieldRendererMap[node.type] ?? DefaultArrayField;
    const FieldRenderer = fieldRendererMap[node.rendererKey] ?? fieldRendererMap[node.type] ?? DefaultField;
    return (
      <ArrayOrField
        key={key}
        path={node.fieldRef}
        FieldRenderer={FieldRenderer}
        ArrayRenderer={arrayRenderer}
      />
    );
  }

  const LayoutRenderer =
    layoutRendererMap[node.rendererKey] ?? layoutRendererMap[node.type] ?? FallbackLayoutRenderer;
  const children = (node.children ?? []).map((child, index) =>
    renderNode(child, `${key}-${index}`, fieldRendererMap, arrayFieldRendererMap, layoutRendererMap),
  );

  return (
    <LayoutRenderer key={key} layout={node}>
      {children}
    </LayoutRenderer>
  );
}

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
  if (resolved?.valueType === "array") {
    return <ArrayRenderer path={path} />;
  }
  return <FieldRenderer path={path} />;
}

export function FormRuntimeRoot({
  rootLayoutId,
  fieldRendererMap = {},
  arrayFieldRendererMap = {},
  layoutRendererMap = {},
}: FormRuntimeRootProps): React.JSX.Element {
  const { layout } = useFormLayout(rootLayoutId);
  return (
    <div data-formwright-layout={layout.type}>
      {renderNode(layout, rootLayoutId ?? "root", fieldRendererMap, arrayFieldRendererMap, layoutRendererMap)}
    </div>
  );
}
