import type {
  FieldComposerProps,
  FieldDescriptionSlotProps,
  FieldErrorSlotProps,
  FieldHelpSlotProps,
  FieldLabelSlotProps,
  FieldShellSlotProps,
} from "../types/public-types";

const visuallyHiddenStyles: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

function DefaultShell({ state, children }: FieldShellSlotProps): React.JSX.Element {
  return <div style={{ display: state.visible ? "grid" : "none", gap: 6 }}>{children}</div>;
}

function DefaultLabel({ field, label }: FieldLabelSlotProps): React.JSX.Element {
  if (field.uiField?.accessibility?.labelHidden) {
    return <label style={visuallyHiddenStyles}>{label}</label>;
  }

  return <label>{label}</label>;
}

function DefaultDescription({ description }: FieldDescriptionSlotProps): React.JSX.Element | null {
  return description ? <small style={{ color: "#666" }}>{description}</small> : null;
}

function DefaultHelp({ helpText }: FieldHelpSlotProps): React.JSX.Element | null {
  return helpText ? <small style={{ color: "#666" }}>{helpText}</small> : null;
}

function DefaultError({ error }: FieldErrorSlotProps): React.JSX.Element | null {
  return error ? <small style={{ color: "crimson" }}>{error}</small> : null;
}

export function FieldComposer({
  field,
  state,
  label,
  description,
  helpText,
  error,
  children,
  slots,
}: FieldComposerProps): React.JSX.Element {
  const Shell = slots?.Shell ?? DefaultShell;
  const Label = slots?.Label ?? DefaultLabel;
  const Description = slots?.Description ?? DefaultDescription;
  const Help = slots?.Help ?? DefaultHelp;
  const Error = slots?.Error ?? DefaultError;

  return (
    <Shell field={field} state={state}>
      <Label field={field} state={state} label={label} />
      <Description field={field} state={state} description={description} />
      {children}
      <Help field={field} state={state} helpText={helpText} />
      <Error field={field} state={state} error={error} />
    </Shell>
  );
}
