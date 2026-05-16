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

  it("resolves object-array item fields through the core runtime", () => {
    const textFieldPlugin: FormPlugin = {
      kind: "field",
      identity: { name: "@formwright/test/nested-array-text", version: "0.0.0" },
      fieldType: "text",
      getRendererKey() {
        return "nested-array-text-renderer";
      },
      getValidationPlan() {
        return [{ validatorType: "nested-required" }];
      },
    };

    const runtime = createFormRuntime({
      form: {
        version: "1.0",
        formId: "object-array-runtime-form",
        dataSchema: {
          rootType: "object",
          fields: {
            contacts: {
              valueType: "array",
              itemType: "object",
              itemSchema: {
                name: { valueType: "string", default: "" },
              },
            },
          },
        },
        uiSchema: {
          nodes: {
            contacts: {
              fieldType: "array",
              componentProps: {
                itemFields: {
                  name: { label: "Name", inputType: "text" },
                },
              },
            },
          },
          layout: {
            type: "stack",
            id: "root",
            children: [{ type: "field", ref: "contacts" }],
          },
        },
        behaviorSchema: {
          rules: [],
        },
      },
      plugins: [textFieldPlugin],
    });

    const nestedField = runtime.resolveField("contacts.0.name");

    expect(nestedField).toMatchObject({
      path: "contacts.0.name",
      parentPath: "contacts",
      templatePath: "contacts.*.name",
      isCollectionItem: true,
      rendererKey: "nested-array-text-renderer",
      fieldType: "text",
      uiField: {
        label: "Name",
      },
    });
    expect(runtime.getFieldValidationPlan("contacts.0.name")).toEqual([{ validatorType: "nested-required" }]);
  });

  it("resolves primitive array item fields through the core runtime", () => {
    const stringFieldPlugin: FormPlugin = {
      kind: "field",
      identity: { name: "@formwright/test/primitive-array-text", version: "0.0.0" },
      fieldType: "string",
      getRendererKey() {
        return "primitive-array-text-renderer";
      },
    };

    const runtime = createFormRuntime({
      form: {
        version: "1.0",
        formId: "primitive-array-runtime-form",
        dataSchema: {
          rootType: "object",
          fields: {
            tags: {
              valueType: "array",
              itemType: "string",
              default: [],
            },
          },
        },
        uiSchema: {
          nodes: {
            tags: {
              fieldType: "array",
              label: "Tags",
            },
          },
          layout: {
            type: "stack",
            id: "root",
            children: [{ type: "field", ref: "tags" }],
          },
        },
        behaviorSchema: {
          rules: [],
        },
      },
      plugins: [stringFieldPlugin],
    });

    const nestedField = runtime.resolveField("tags.0");

    expect(nestedField).toMatchObject({
      path: "tags.0",
      parentPath: "tags",
      templatePath: "tags.*",
      isCollectionItem: true,
      rendererKey: "primitive-array-text-renderer",
      fieldType: "string",
    });
  });

  it("applies wildcard rule effects to nested array child fields", () => {
    const runtime = createFormRuntime({
      form: {
        version: "1.0",
        formId: "nested-array-rules-form",
        dataSchema: {
          rootType: "object",
          fields: {
            accountType: { valueType: "string", default: "individual" },
            contacts: {
              valueType: "array",
              itemType: "object",
              default: [],
              itemSchema: {
                name: { valueType: "string", default: "" },
              },
            },
          },
        },
        uiSchema: {
          nodes: {
            accountType: { fieldType: "select" },
            contacts: {
              fieldType: "array",
              componentProps: {
                itemFields: {
                  name: { label: "Name", inputType: "text" },
                },
              },
            },
          },
          layout: {
            type: "stack",
            id: "root",
            children: [{ type: "field", ref: "accountType" }, { type: "field", ref: "contacts" }],
          },
        },
        behaviorSchema: {
          rules: [
            {
              id: "hide-contact-names-for-individual",
              when: { eq: [{ var: "accountType" }, "individual"] },
              effects: [{ type: "hide", target: "contacts.*.name" }],
            },
            {
              id: "show-contact-names-for-company",
              when: { eq: [{ var: "accountType" }, "company"] },
              effects: [{ type: "show", target: "contacts.*.name" }],
            },
          ],
        },
      },
    });

    const hidden = runtime.evaluate({
      accountType: "individual",
      contacts: [{ name: "Alice" }, { name: "Bob" }],
    });
    expect(hidden.fieldState["contacts.0.name"]?.visible).toBe(false);
    expect(hidden.fieldState["contacts.1.name"]?.visible).toBe(false);

    const visible = runtime.evaluate({
      accountType: "company",
      contacts: [{ name: "Alice" }],
    });
    expect(visible.fieldState["contacts.0.name"]?.visible).toBe(true);
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

  it("computes derived values and applies dynamic field options", () => {
    const form: FormDefinition = {
      version: "1.0",
      formId: "computed-options-form",
      dataSchema: {
        rootType: "object",
        fields: {
          firstName: { valueType: "string" },
          lastName: { valueType: "string" },
          fullName: { valueType: "string" },
          accountType: {
            valueType: "string",
            default: "individual",
          },
        },
      },
      uiSchema: {
        nodes: {
          firstName: { fieldType: "text" },
          lastName: { fieldType: "text" },
          fullName: { fieldType: "text" },
          accountType: {
            fieldType: "select",
            options: [{ label: "Individual", value: "individual" }],
          },
        },
        layout: {
          type: "stack",
          id: "root",
          children: [
            { type: "field", ref: "firstName" },
            { type: "field", ref: "lastName" },
            { type: "field", ref: "fullName" },
            { type: "field", ref: "accountType" },
          ],
        },
      },
      behaviorSchema: {
        computed: [
          {
            target: "fullName",
            expression: {
              concat: [{ var: "firstName" }, " ", { var: "lastName" }],
            },
            runOn: ["firstName", "lastName"],
          },
        ],
        rules: [
          {
            id: "switch-account-options",
            when: { eq: [{ var: "$mode" }, "edit"] },
            effects: [
              {
                type: "setOptions",
                target: "accountType",
                value: [
                  { label: "Business", value: "company" },
                  { label: "Individual", value: "individual" },
                ],
              },
            ],
          },
        ],
      },
    };

    const runtime = createFormRuntime({ form, context: { mode: "edit" } });
    const result = runtime.evaluate({ firstName: "Ada", lastName: "Lovelace" });

    expect(result.values.fullName).toBe("Ada Lovelace");
    expect(result.fieldOptions.accountType).toEqual([
      { label: "Business", value: "company" },
      { label: "Individual", value: "individual" },
    ]);
    expect(result.valueMutations).toEqual(
      expect.arrayContaining([{ path: "fullName", value: "Ada Lovelace" }]),
    );
  });

  it("runs lightweight lifecycle actions for data loading, validation, and submit targets", async () => {
    const runtime = createFormRuntime({
      form: {
        version: "1.0",
        formId: "lifecycle-form",
        dataSchema: {
          rootType: "object",
          fields: {
            username: {
              valueType: "string",
              serverValidation: {
                rules: ["no-blocked-username"],
              },
            },
          },
        },
        uiSchema: {
          nodes: {
            username: { fieldType: "text" },
          },
          layout: {
            type: "stack",
            id: "root",
            children: [{ type: "field", ref: "username" }],
          },
        },
        behaviorSchema: {
          dataSources: {
            countries: {
              type: "remote",
              endpoint: "/api/countries",
              dependsOn: ["region"],
            },
          },
          lifecycle: {
            onLoad: [{ type: "fetchDataSource", target: "countries" }],
            onSubmit: [
              { type: "validateServerRules" },
              { type: "submitTo", target: "/api/forms" },
            ],
          },
        },
      },
      context: { baseUrl: "http://localhost" },
      plugins: [
        {
          kind: "datasource",
          identity: { name: "@formwright/test/lifecycle-datasource", version: "0.0.0" },
          sourceType: "remote",
          async load(input) {
            expect(input.dependsOnValues.region).toBe("apac");
            return {
              options: [{ label: "Nepal", value: "NP" }],
            };
          },
        },
        {
          kind: "validator",
          identity: { name: "@formwright/test/lifecycle-validator", version: "0.0.0" },
          validatorType: "no-blocked-username",
          supports() {
            return true;
          },
          validate(input) {
            if (String(input.value ?? "") === "blocked") {
              return {
                valid: false,
                message: "Username is blocked",
              };
            }
            return { valid: true };
          },
        },
      ],
    });

    const onLoad = await runtime.runLifecycle("onLoad", { region: "apac" });
    expect(onLoad.actions[0]).toMatchObject({
      status: "completed",
      dataSource: {
        target: "countries",
        options: [{ label: "Nepal", value: "NP" }],
      },
    });

    const onSubmit = await runtime.runLifecycle("onSubmit", { username: "blocked" });
    expect(onSubmit.actions[0]).toMatchObject({
      status: "completed",
      validation: [
        {
          path: "username",
          valid: false,
          message: "Username is blocked",
        },
      ],
    });
    expect(onSubmit.actions[1]).toMatchObject({
      status: "skipped",
      submission: {
        target: "/api/forms",
      },
    });
  });

  it("validates nested array child fields during lifecycle server validation", async () => {
    const runtime = createFormRuntime({
      form: {
        version: "1.0",
        formId: "nested-lifecycle-validation-form",
        dataSchema: {
          rootType: "object",
          fields: {
            contacts: {
              valueType: "array",
              itemType: "object",
              default: [],
              itemSchema: {
                name: {
                  valueType: "string",
                  default: "",
                  serverValidation: {
                    rules: ["required-name"],
                  },
                },
              },
            },
          },
        },
        uiSchema: {
          nodes: {
            contacts: {
              fieldType: "array",
              componentProps: {
                itemFields: {
                  name: { label: "Name", inputType: "text" },
                },
              },
            },
          },
          layout: {
            type: "stack",
            id: "root",
            children: [{ type: "field", ref: "contacts" }],
          },
        },
        behaviorSchema: {
          lifecycle: {
            onSubmit: [{ type: "validateServerRules" }],
          },
        },
      },
      plugins: [
        {
          kind: "validator",
          identity: { name: "@formwright/test/nested-required-name", version: "0.0.0" },
          validatorType: "required-name",
          supports() {
            return true;
          },
          validate(input) {
            const valid = String(input.value ?? "").trim().length > 0;
            return valid ? { valid: true } : { valid: false, message: "Name is required" };
          },
        },
      ],
    });

    const onSubmit = await runtime.runLifecycle("onSubmit", {
      contacts: [{ name: "" }, { name: "Alice" }],
    });

    expect(onSubmit.actions[0]).toMatchObject({
      status: "completed",
      validation: expect.arrayContaining([
        expect.objectContaining({
          path: "contacts.0.name",
          valid: false,
          message: "Name is required",
        }),
        expect.objectContaining({
          path: "contacts.1.name",
          valid: true,
        }),
      ]),
    });
  });
});
