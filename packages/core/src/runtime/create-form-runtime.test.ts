import { describe, expect, it } from "vitest";
import type { FormDefinition } from "@formwright/contract";
import { createFormRuntime } from "./create-form-runtime";
import type { FormPlugin } from "./types";

function makeForm(overrides?: Partial<FormDefinition>): FormDefinition {
  return {
    version: "1.0",
    formId: "test-form",
    dataSchema: {
      rootType: "object",
      fields: {
        accountType: { valueType: "string", default: "individual" },
        "company.name": { valueType: "string" },
        "contact.email": { valueType: "string", required: true },
      },
    },
    uiSchema: {
      nodes: {
        accountType: { fieldType: "select" },
        "company.name": { fieldType: "text" },
        "contact.email": { fieldType: "text" },
      },
      layout: {
        type: "stack",
        id: "root",
        children: [
          { type: "field", ref: "accountType" },
          { type: "field", ref: "company.name" },
          { type: "field", ref: "contact.email" },
        ],
      },
    },
    behaviorSchema: {
      rules: [],
    },
    ...overrides,
  };
}

describe("createFormRuntime", () => {
  it("applies show/hide rule effects by field target", () => {
    const form = makeForm({
      behaviorSchema: {
        rules: [
          {
            id: "show-company-name-when-company",
            when: { eq: [{ var: "accountType" }, "company"] },
            effects: [{ type: "show", target: "company.name" }],
          },
          {
            id: "hide-company-name-when-individual",
            when: { eq: [{ var: "accountType" }, "individual"] },
            effects: [{ type: "hide", target: "company.name" }],
          },
        ],
      },
    });

    const runtime = createFormRuntime({ form });

    const individual = runtime.evaluate({ accountType: "individual" });
    expect(individual.fieldState["company.name"]?.visible).toBe(false);

    const company = runtime.evaluate({ accountType: "company" });
    expect(company.fieldState["company.name"]?.visible).toBe(true);
  });

  it("applies wildcard disable effect to all fields", () => {
    const form = makeForm({
      behaviorSchema: {
        rules: [
          {
            id: "disable-everything",
            when: { eq: [{ var: "accountType" }, "company"] },
            effects: [{ type: "disable", target: "*" }],
          },
        ],
      },
    });

    const runtime = createFormRuntime({ form });
    const result = runtime.evaluate({ accountType: "company" });

    expect(result.fieldState.accountType.disabled).toBe(true);
    expect(result.fieldState["company.name"].disabled).toBe(true);
    expect(result.fieldState["contact.email"].disabled).toBe(true);
  });

  it("resolves context variable expressions (e.g. $mode)", () => {
    const form = makeForm({
      behaviorSchema: {
        rules: [
          {
            id: "disable-all-in-view",
            when: { eq: [{ var: "$mode" }, "view"] },
            effects: [{ type: "disable", target: "*" }],
          },
        ],
      },
    });

    const runtime = createFormRuntime({
      form,
      context: { mode: "view" },
    });

    const result = runtime.evaluate();
    expect(result.fieldState.accountType.disabled).toBe(true);
    expect(result.fieldState["company.name"].disabled).toBe(true);
    expect(result.fieldState["contact.email"].disabled).toBe(true);
  });

  it("collects field dependencies from rules, computed values, data sources, and layout visibility", () => {
    const form = makeForm({
      behaviorSchema: {
        rules: [
          {
            id: "show-company-name-when-company",
            when: { eq: [{ var: "accountType" }, "company"] },
            effects: [{ type: "show", target: "company.name" }],
          },
        ],
        computed: [
          {
            target: "contact.email",
            expression: { concat: [{ var: "accountType" }, "@example.com"] },
            runOn: ["accountType"],
          },
        ],
        dataSources: {
          cities: {
            type: "remote",
            endpoint: "/api/cities",
            dependsOn: ["accountType", "company.name"],
          },
        },
      },
      uiSchema: {
        ...makeForm().uiSchema,
        layout: {
          type: "stack",
          id: "root",
          visibleWhen: { eq: [{ var: "company.name" }, "Acme"] },
          children: [
            { type: "field", ref: "accountType" },
            { type: "field", ref: "company.name" },
            { type: "field", ref: "contact.email" },
          ],
        },
      },
    });

    const runtime = createFormRuntime({ form, context: { mode: "edit" } });
    expect(runtime.getEvaluationDependencies()).toEqual(
      expect.arrayContaining(["accountType", "company.name"]),
    );
    expect(runtime.getEvaluationDependencies()).not.toContain("$mode");
  });

  it("evaluates layout visibleWhen expressions during runtime evaluation", () => {
    const form = makeForm({
      uiSchema: {
        ...makeForm().uiSchema,
        layout: {
          type: "stack",
          id: "root",
          children: [
            { type: "field", ref: "accountType" },
            {
              type: "section",
              id: "company-section",
              visibleWhen: { eq: [{ var: "accountType" }, "company"] },
              children: [{ type: "field", ref: "company.name" }],
            },
          ],
        },
      },
    });

    const runtime = createFormRuntime({ form });

    const individual = runtime.evaluate({ accountType: "individual" });
    expect(individual.layoutState["company-section"]?.visible).toBe(false);

    const company = runtime.evaluate({ accountType: "company" });
    expect(company.layoutState["company-section"]?.visible).toBe(true);
  });

  it("applies field plugin normalization, renderer key, and default value", () => {
    const stringFieldPlugin: FormPlugin = {
      kind: "field",
      identity: { name: "@formwright/test/field-string", version: "0.0.0" },
      fieldType: "text",
      normalize(input) {
        return {
          fieldType: "text",
          normalizedDataField: { ...input.dataField, default: "normalized-default" },
          normalizedUiField: { ...input.uiField, fieldType: "text" },
        };
      },
      getRendererKey() {
        return "custom-text-renderer";
      },
      getDefaultValue() {
        return "plugin-default";
      },
    };

    const runtime = createFormRuntime({
      form: makeForm(),
      plugins: [stringFieldPlugin],
    });

    expect(runtime.getResolvedFields()["company.name"].rendererKey).toBe("custom-text-renderer");
    expect(runtime.evaluate().values["company.name"]).toBe("plugin-default");
  });

  it("applies rule effects in declaration order when multiple rules target the same field", () => {
    const form = makeForm({
      behaviorSchema: {
        rules: [
          {
            id: "disable-company-name",
            when: { eq: [{ var: "accountType" }, "company"] },
            effects: [{ type: "disable", target: "company.name" }],
          },
          {
            id: "enable-company-name-later",
            when: { eq: [{ var: "accountType" }, "company"] },
            effects: [{ type: "enable", target: "company.name" }],
          },
        ],
      },
    });

    const runtime = createFormRuntime({ form });
    const result = runtime.evaluate({ accountType: "company" });
    expect(result.fieldState["company.name"].disabled).toBe(false);
  });
});
