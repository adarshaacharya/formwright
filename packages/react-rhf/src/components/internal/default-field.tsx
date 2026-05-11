import type { RenderFieldProps } from "../../types/public-types";

export function DefaultField({
  field,
  state,
  value,
  error,
  onChange,
  onBlur,
  loading,
}: RenderFieldProps): React.JSX.Element | null {
  if (!state.visible) return null;

  const label = field.uiField?.label ?? field.path;
  if (field.fieldType === "select") {
    return (
      <div style={{ display: "grid", gap: 6 }}>
        <label>{label}</label>
        <select
          value={(value as string | undefined) ?? ""}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          disabled={state.disabled || loading}
        >
          <option value="">Select an option</option>
          {(field.uiField?.options ?? []).map((option) => (
            <option key={`${field.path}-${String(option.value)}`} value={String(option.value)} disabled={option.disabled}>
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
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder={field.uiField?.placeholder}
        disabled={state.disabled || loading}
      />
      {error ? <small style={{ color: "crimson" }}>{error}</small> : null}
    </div>
  );
}
