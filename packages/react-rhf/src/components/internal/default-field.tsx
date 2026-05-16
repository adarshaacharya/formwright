import type { RenderFieldProps } from "../../types/public-types";
import { FieldComposer } from "../field-composer";

export function renderDefaultFieldControl(props: RenderFieldProps): React.JSX.Element {
  return buildDefaultControl(
    props.field,
    props.state,
    props.value,
    props.error,
    props.onChange,
    props.onBlur,
    props.loading,
    props.options,
  );
}

function buildDefaultControl(
  field: RenderFieldProps["field"],
  state: RenderFieldProps["state"],
  value: unknown,
  error: string | undefined,
  onChange: RenderFieldProps["onChange"],
  onBlur: RenderFieldProps["onBlur"],
  loading: boolean | undefined,
  options: RenderFieldProps["options"],
): React.JSX.Element {
  const widget = field.uiField?.widget;
  const controlType = widget ?? field.fieldType;
  const label = field.uiField?.label ?? field.path;

  if (controlType === "select") {
    const selectOptions = options ?? field.uiField?.options ?? [];
    return (
      <>
        <select
          aria-busy={loading ? "true" : "false"}
          value={(value as string | undefined) ?? ""}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          disabled={state.disabled || state.readonly || loading}
          aria-label={label}
        >
          {loading ? <option value="">Loading options…</option> : <option value="">Select an option</option>}
          {selectOptions.map((option) => (
            <option
              key={`${field.path}-${String(option.value)}`}
              value={String(option.value)}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        {loading ? <small>Loading options…</small> : null}
      </>
    );
  }

  if (controlType === "radio-group") {
    const radioOptions = options ?? field.uiField?.options ?? [];
    return (
      <fieldset style={{ display: "grid", gap: 6, border: 0, padding: 0 }}>
        <legend>{label}</legend>
        <div style={{ display: "grid", gap: 8 }}>
          {radioOptions.map((option) => (
            <label key={`${field.path}-${String(option.value)}`} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="radio"
                name={field.path}
                checked={String(value ?? "") === String(option.value)}
                onChange={() => onChange(option.value)}
                onBlur={onBlur}
                disabled={state.disabled || state.readonly || loading || option.disabled}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  if (controlType === "checkbox" || field.fieldType === "boolean") {
    return (
      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
          onBlur={onBlur}
          disabled={state.disabled || state.readonly || loading}
        />
        <span>{label}</span>
      </label>
    );
  }

  if (controlType === "textarea") {
    return (
      <textarea
        aria-label={label}
        value={(value as string | undefined) ?? ""}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder={field.uiField?.placeholder}
        disabled={state.disabled || state.readonly || loading}
      />
    );
  }

  if (controlType === "number" || controlType === "integer") {
    return (
      <input
        type="number"
        aria-label={label}
        value={(value as string | number | undefined) ?? ""}
        onChange={(event) => onChange(event.target.value === "" ? undefined : Number(event.target.value))}
        onBlur={onBlur}
        placeholder={field.uiField?.placeholder}
        disabled={state.disabled || state.readonly || loading}
      />
    );
  }

  if (controlType === "email" || controlType === "url" || controlType === "phone" || controlType === "date" || controlType === "datetime") {
    const inputType =
      controlType === "datetime" ? "datetime-local" : controlType === "phone" ? "tel" : controlType;
    return (
      <input
        type={inputType}
        aria-label={label}
        value={(value as string | number | undefined) ?? ""}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder={field.uiField?.placeholder}
        disabled={state.disabled || state.readonly || loading}
      />
    );
  }

  return (
    <input
      aria-label={label}
      value={(value as string | number | undefined) ?? ""}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      placeholder={field.uiField?.placeholder}
      disabled={state.disabled || state.readonly || loading}
    />
  );
}

export function DefaultField({
  field,
  state,
  value,
  error,
  onChange,
  onBlur,
  loading,
  options,
  slots,
}: RenderFieldProps): React.JSX.Element | null {
  const label = field.uiField?.label ?? field.path;
  const description = field.uiField?.description;
  const helpText = field.uiField?.helpText;
  const Control = slots?.Control;
  const defaultControl = renderDefaultFieldControl({
    field,
    state,
    value,
    error,
    onChange,
    onBlur,
    loading,
    options,
    path: field.path,
  });

  return (
    <FieldComposer
      field={field}
      state={state}
      label={label}
      description={description}
      helpText={helpText}
      error={error}
      slots={slots}
    >
      {Control ? (
        <Control
          field={field}
          state={state}
          value={value}
          error={error}
          onChange={onChange}
          onBlur={onBlur}
          loading={loading}
          options={options}
          defaultControl={defaultControl}
        />
      ) : (
        defaultControl
      )}
    </FieldComposer>
  );
}

export function DefaultFieldRenderer(props: RenderFieldProps): React.JSX.Element | null {
  return <DefaultField {...props} />;
}
