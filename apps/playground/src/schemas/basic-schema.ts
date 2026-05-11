import type { FormDefinition } from "@formwright/contract";

export const basicSchema: FormDefinition = {
  version: "1.0",
  formId: "playground-basic",
  meta: {
    title: "Playground Basic Schema",
    mode: "create",
  },
  dataSchema: {
    rootType: "object",
    fields: {
      accountType: {
        valueType: "string",
        required: true,
        enum: ["individual", "company"],
        default: "individual",
      },
      "company.name": {
        valueType: "string",
      },
      "contact.email": {
        valueType: "string",
        format: "email",
        required: true,
      },
    },
  },
  uiSchema: {
    nodes: {
      accountType: {
        fieldType: "select",
        label: "Account Type",
        options: [
          { label: "Individual", value: "individual" },
          { label: "Company", value: "company" },
        ],
      },
      "company.name": {
        fieldType: "text",
        label: "Company Name",
        placeholder: "Enter company name",
      },
      "contact.email": {
        fieldType: "text",
        label: "Contact Email",
        placeholder: "name@example.com",
      },
    },
    layout: {
      type: "stack",
      id: "root-stack",
      children: [
        { type: "field", ref: "accountType" },
        { type: "field", ref: "company.name" },
        { type: "field", ref: "contact.email" },
      ],
    },
  },
  behaviorSchema: {
    rules: [
      {
        id: "show-company-name-when-company",
        when: {
          eq: [{ var: "accountType" }, "company"],
        },
        effects: [{ type: "show", target: "company.name" }],
      },
      {
        id: "hide-company-name-when-individual",
        when: {
          eq: [{ var: "accountType" }, "individual"],
        },
        effects: [{ type: "hide", target: "company.name" }],
      },
      {
        id: "global-lock-in-view-mode",
        when: {
          eq: [{ var: "$mode" }, "view"],
        },
        effects: [{ type: "disable", target: "*" }],
      },
    ],
  },
};
