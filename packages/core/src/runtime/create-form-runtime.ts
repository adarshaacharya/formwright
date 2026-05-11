import type { CreateFormRuntimeInput, FormRuntime } from "./types";

export function createFormRuntime(input: CreateFormRuntimeInput): FormRuntime {
  return {
    getFormDefinition() {
      return input.form;
    },
    getResolvedFields() {
      return {};
    },
    getResolvedLayout() {
      return {
        id: input.form.uiSchema.layout.id,
        type: input.form.uiSchema.layout.type,
        rendererKey: input.form.uiSchema.layout.type,
        node: input.form.uiSchema.layout,
      };
    },
    evaluate() {
      return {
        fieldState: {},
        layoutState: {},
        values: {},
      };
    },
  };
}
