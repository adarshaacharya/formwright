import type { FieldPath } from "@formwright/contract";
import { useFormField } from "@formwright/react-rhf";

export function BasicField({ path }: { path: FieldPath }): React.JSX.Element | null {
  const { field, state, value, setValue, onBlur, error } = useFormField(path);

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
