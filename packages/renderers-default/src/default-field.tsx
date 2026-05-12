import type { RenderFieldProps } from "@formwright/react-rhf";

export function DefaultField({
  field,
  state,
  value,
  error,
  onChange,
  onBlur,
  loading,
}: RenderFieldProps): React.JSX.Element | null {
  const label = field.uiField?.label ?? field.path;
  if (field.fieldType === "select") {
    return (
      <div style={{ display: state.visible ? "grid" : "none", gap: 6 }}>
        <label>{label}</label>
        <select
          aria-busy={loading ? "true" : "false"}
          value={(value as string | undefined) ?? ""}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          disabled={state.disabled || loading}
        >
          {loading ? <option value="">Loading options...</option> : <option value="">Select an option</option>}
          {(field.uiField?.options ?? []).map((option) => (
            <option key={`${field.path}-${String(option.value)}`} value={String(option.value)} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        {loading ? <small>Loading options…</small> : null}
        {error ? <small style={{ color: "crimson" }}>{error}</small> : null}
      </div>
    );
  }

  return (
    <div style={{ display: state.visible ? "grid" : "none", gap: 6 }}>
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

export function DefaultFieldRenderer(props: RenderFieldProps): React.JSX.Element | null {
  return <DefaultField {...props} />;
}
