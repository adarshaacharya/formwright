import type { FormDefinition } from "@formwright/contract";
import type { BuildFormInput, BuiltRule } from "./types";

function normalizeRules(
  rules: BuiltRule[] | undefined,
): NonNullable<FormDefinition["behaviorSchema"]>["rules"] {
  if (!rules || rules.length === 0) {
    return undefined;
  }

  return rules.map((rule, index) => ({
    id: rule.id ?? `rule-${index + 1}`,
    when: rule.when,
    effects: rule.effects,
  }));
}

export function buildForm(input: BuildFormInput): FormDefinition {
  return {
    version: input.form.version,
    formId: input.form.formId,
    meta: input.form.meta,
    dataSchema: {
      rootType: "object",
      fields: Object.fromEntries(input.fields.map((field) => [field.path, field.data])),
    },
    uiSchema: {
      nodes: Object.fromEntries(input.fields.map((field) => [field.path, field.ui])),
      layout: input.layout,
    },
    behaviorSchema:
      input.rules?.length || input.datasources?.length || input.computed?.length || input.lifecycle
        ? {
            rules: normalizeRules(input.rules),
            dataSources: input.datasources
              ? Object.fromEntries(input.datasources.map((datasource) => [datasource.name, datasource.definition]))
              : undefined,
            computed: input.computed,
            lifecycle: input.lifecycle,
          }
        : undefined,
  };
}
