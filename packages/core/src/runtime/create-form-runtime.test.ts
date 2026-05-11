import { describe, expect, it } from "vitest";
import type { FormDefinition } from "@formwright/contract";
import { createFormRuntime } from "./create-form-runtime";

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
});
