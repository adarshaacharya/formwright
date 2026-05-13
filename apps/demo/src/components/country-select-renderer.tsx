import { FieldComposer } from "@formwright/react-rhf";
import type { RenderFieldProps } from "@formwright/react-rhf";

export function CountrySelectRenderer({
  field,
  state,
  value,
  error,
  onChange,
  onBlur,
  loading,
  options,
}: RenderFieldProps): React.JSX.Element {
  const label = field.uiField?.label ?? field.path;
  const selectOptions = options ?? field.uiField?.options ?? [];

  return (
    <FieldComposer
      field={field}
      state={state}
      label={label}
      description={field.uiField?.description}
      helpText={field.uiField?.helpText}
      error={error}
    >
      <div style={{ display: "grid", gap: 8, border: "1px solid #0f766e", padding: 10, borderRadius: 10 }}>
        <small style={{ color: "#0f766e", fontWeight: 600 }}>custom renderer</small>
        <select
          aria-busy={loading ? "true" : "false"}
          value={(value as string | undefined) ?? ""}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          disabled={state.disabled || loading}
        >
          {loading ? <option value="">Loading options…</option> : <option value="">Select country</option>}
          {selectOptions.map((option) => (
            <option key={`${field.path}-${String(option.value)}`} value={String(option.value)} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </FieldComposer>
  );
}
