import type { FieldPath } from "@formwright/contract";
import type { ResolvedLayoutModel } from "@formwright/core";
import type { FormRuntimeRootProps } from "../types/public-types";
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

function renderNode(node: ResolvedLayoutModel, key: string): React.JSX.Element | null {
  if (node.type === "field" && node.fieldRef) {
    return <DefaultField key={key} path={node.fieldRef} />;
  }

  if (node.type === "stack" || node.type === "grid" || node.type === "section") {
    return (
      <div key={key} style={{ display: "grid", gap: 16 }}>
        {(node.children ?? []).map((child, index) => renderNode(child, `${key}-${index}`))}
      </div>
    );
  }

  return (
    <div key={key} style={{ display: "grid", gap: 16 }}>
      {(node.children ?? []).map((child, index) => renderNode(child, `${key}-${index}`))}
    </div>
  );
}

export function FormRuntimeRoot({ rootLayoutId }: FormRuntimeRootProps): React.JSX.Element {
  const { layout } = useFormLayout(rootLayoutId);
  return <div data-formwright-layout={layout.type}>{renderNode(layout, rootLayoutId ?? "root")}</div>;
}
