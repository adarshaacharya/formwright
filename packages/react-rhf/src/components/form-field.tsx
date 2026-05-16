import { createContext, useContext } from "react";
import type { FieldPath } from "@formwright/contract";

import { useDatasourceOptions } from "../hooks/use-datasource-options";
import { useFormField } from "../hooks/use-form-field";
import type {
  FormFieldControlProps,
  FormFieldControlRenderProps,
  FormFieldRootProps,
  RenderFieldProps,
} from "../types/public-types";
import { renderDefaultFieldControl } from "./internal/default-field";

interface FormFieldContextValue {
  props: RenderFieldProps;
}

const formFieldContext = createContext<FormFieldContextValue | null>(null);

function useFormFieldContext(): FormFieldContextValue {
  const context = useContext(formFieldContext);
  if (!context) {
    throw new Error("FormField parts must be rendered inside FormField.Root.");
  }
  return context;
}

export function FormFieldRoot({ path, children }: FormFieldRootProps): React.JSX.Element {
  const { field, state, value, error, setValue, onBlur } = useFormField(path);
  const { loading, options, error: datasourceError } = useDatasourceOptions(path);

  const props: RenderFieldProps = {
    path,
    field,
    state,
    value,
    error: error ?? datasourceError,
    onChange: setValue,
    onBlur,
    loading,
    options,
  };

  return <formFieldContext.Provider value={{ props }}>{children}</formFieldContext.Provider>;
}

export function FormFieldLabel(): React.JSX.Element | null {
  const { props } = useFormFieldContext();
  const { field, state } = props;
  const label = field.uiField?.label ?? field.path;

  if (field.uiField?.accessibility?.labelHidden) {
    return (
      <label
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {label}
      </label>
    );
  }

  return <label aria-hidden={!state.visible}>{label}</label>;
}

export function FormFieldDescription(): React.JSX.Element | null {
  const {
    props: { field },
  } = useFormFieldContext();
  return field.uiField?.description ? <small style={{ color: "#666" }}>{field.uiField.description}</small> : null;
}

export function FormFieldControl({ children }: FormFieldControlProps): React.JSX.Element | null {
  const { props } = useFormFieldContext();

  if (typeof children === "function") {
    return (
      <>
        {children({
          field: props.field,
          state: props.state,
          value: props.value,
          error: props.error,
          onChange: props.onChange,
          onBlur: props.onBlur,
          loading: props.loading,
          options: props.options,
        })}
      </>
    );
  }

  if (children) {
    return <>{children}</>;
  }

  return renderDefaultFieldControl(props);
}

export function FormFieldError(): React.JSX.Element | null {
  const {
    props: { error },
  } = useFormFieldContext();
  return error ? <small style={{ color: "crimson" }}>{error}</small> : null;
}

export function FormFieldHelp(): React.JSX.Element | null {
  const {
    props: { field },
  } = useFormFieldContext();
  return field.uiField?.helpText ? <small style={{ color: "#666" }}>{field.uiField.helpText}</small> : null;
}

export const FormField = {
  Root: FormFieldRoot,
  Label: FormFieldLabel,
  Description: FormFieldDescription,
  Control: FormFieldControl,
  Error: FormFieldError,
  Help: FormFieldHelp,
};
