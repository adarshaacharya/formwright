import { describe, expect, it } from "vitest";

import { buildForm } from "./build-form";
import { datasource } from "./datasource";
import { field } from "./field";
import { defineForm } from "./form";
import { layout } from "./layout";
import { contextRef, fieldRef, rule } from "./rule";

describe("@formwright/schema-builder", () => {
  it("builds a normalized FormDefinition from field, layout, rule, and datasource helpers", () => {
    const accountType = field.select("accountType", {
      label: "Account Type",
      default: "individual",
      options: [
        { label: "Individual", value: "individual" },
        { label: "Company", value: "company" },
      ],
    });
    const companyName = field.text("company.name", {
      label: "Company Name",
      placeholder: "Enter company name",
    });
    const form = buildForm({
      form: defineForm({ id: "customer-form", meta: { title: "Customer" } }),
      fields: [accountType, companyName],
      layout: layout.stack("root", [layout.field(accountType), layout.field(companyName)]),
      datasources: [datasource.static("countries", [{ label: "Nepal", value: "NP" }])],
      rules: [
        rule.when(fieldRef(accountType).eq("company")).show(companyName),
        rule.when(contextRef("mode").eq("view")).disableAll(),
      ],
    });

    expect(form.formId).toBe("customer-form");
    expect(form.dataSchema.fields.accountType.valueType).toBe("string");
    expect(form.uiSchema.nodes["company.name"].placeholder).toBe("Enter company name");
    expect(form.uiSchema.layout.type).toBe("stack");
    expect(form.behaviorSchema?.dataSources?.countries).toEqual({
      type: "static",
      options: [{ label: "Nepal", value: "NP" }],
    });
    expect(form.behaviorSchema?.rules?.[0]?.effects).toEqual([{ type: "show", target: "company.name" }]);
    expect(form.behaviorSchema?.rules?.[1]?.effects).toEqual([{ type: "disable", target: "*" }]);
  });

  it("builds object arrays with item schema metadata in component props", () => {
    const addresses = field.objectArray("addresses", {
      label: "Addresses",
      item: {
        street: field.textItem({ label: "Street", placeholder: "123 Main St", default: "" }),
        city: field.textItem({ label: "City", placeholder: "Kathmandu", default: "" }),
      },
      itemLayout: ["street", "city"],
    });

    const form = buildForm({
      form: defineForm({ id: "address-form" }),
      fields: [addresses],
      layout: layout.stack("root", [layout.field(addresses)]),
    });

    expect(form.dataSchema.fields.addresses).toMatchObject({
      valueType: "array",
      itemType: "object",
      itemSchema: {
        street: { valueType: "string", default: "" },
        city: { valueType: "string", default: "" },
      },
    });
    expect(form.uiSchema.nodes.addresses.componentProps).toEqual({
      itemLayout: ["street", "city"],
      itemFields: {
        street: { label: "Street", placeholder: "123 Main St", inputType: undefined },
        city: { label: "City", placeholder: "Kathmandu", inputType: undefined },
      },
    });
  });

  it("builds computed fields and lifecycle definitions when provided", () => {
    const accountType = field.select("accountType", {
      label: "Account Type",
      default: "individual",
      options: [
        { label: "Individual", value: "individual" },
        { label: "Company", value: "company" },
      ],
    });

    const form = buildForm({
      form: defineForm({ id: "behavior-form" }),
      fields: [accountType],
      layout: layout.stack("root", [layout.field(accountType)]),
      computed: [
        {
          target: "accountType",
          expression: { var: "accountType" },
          runOn: ["accountType"],
        },
      ],
      lifecycle: {
        onLoad: [{ type: "fetchDataSource", target: "countries" }],
        onSubmit: [{ type: "submitTo", target: "/api/forms" }],
      },
    });

    expect(form.behaviorSchema?.computed).toEqual([
      {
        target: "accountType",
        expression: { var: "accountType" },
        runOn: ["accountType"],
      },
    ]);
    expect(form.behaviorSchema?.lifecycle).toEqual({
      onLoad: [{ type: "fetchDataSource", target: "countries" }],
      onSubmit: [{ type: "submitTo", target: "/api/forms" }],
    });
  });
});
