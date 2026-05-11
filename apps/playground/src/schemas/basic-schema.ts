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
      tags: {
        valueType: "array",
        itemType: "string",
      },
      addresses: {
        valueType: "array",
        itemType: "object",
        itemSchema: {
          street: { valueType: "string", default: "" },
          city: { valueType: "string", default: "" },
          zip: { valueType: "string", default: "" },
        },
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
      tags: {
        fieldType: "array",
        label: "Tags",
      },
      addresses: {
        fieldType: "array",
        label: "Addresses",
        componentProps: {
          itemLayout: ["street", "city", "zip"],
          itemFields: {
            street: { label: "Street", placeholder: "123 Main St" },
            city: { label: "City", placeholder: "San Francisco" },
            zip: { label: "ZIP", placeholder: "94107", inputType: "text" },
          },
        },
      },
    },
    layout: {
      type: "stack",
      id: "root-stack",
      children: [
        { type: "field", ref: "accountType" },
        { type: "field", ref: "company.name" },
        { type: "field", ref: "contact.email" },
        { type: "field", ref: "tags" },
        { type: "field", ref: "addresses" },
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
