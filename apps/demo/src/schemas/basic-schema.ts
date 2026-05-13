import type { FormDefinition } from "@formwright/contract";
import { buildForm, contextRef, datasource, defineForm, field, fieldRef, layout, rule } from "@formwright/schema-builder";

const accountType = field.select("accountType", {
  label: "Account Type",
  required: true,
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

const country = field.select("country", {
  label: "Country",
  renderer: "country-select",
  dataSource: "countries",
});

const contactEmail = field.email("contact.email", {
  label: "Contact Email",
  placeholder: "name@example.com",
});

const tags = field.array("tags", {
  label: "Tags",
  item: field.stringItem(),
});

const addresses = field.objectArray("addresses", {
  label: "Addresses",
  item: {
    street: field.textItem({ label: "Street", placeholder: "123 Main St", default: "" }),
    city: field.textItem({ label: "City", placeholder: "San Francisco", default: "" }),
    zip: field.textItem({ label: "ZIP", placeholder: "94107", inputType: "text", default: "" }),
  },
  itemLayout: ["street", "city", "zip"],
});

export const basicSchema: FormDefinition = buildForm({
  form: defineForm({
    id: "demo-basic",
    meta: {
      title: "Demo Basic Schema",
      mode: "create",
    },
  }),
  fields: [accountType, companyName, country, contactEmail, tags, addresses],
  layout: layout.stack("root-stack", [
    layout.field(accountType),
    layout.field(companyName),
    layout.field(country),
    layout.field(contactEmail),
    layout.field(tags),
    layout.field(addresses),
  ]),
  datasources: [
    datasource.static("countries", [
      { label: "United States", value: "US" },
      { label: "Nepal", value: "NP" },
      { label: "Germany", value: "DE" },
    ]),
  ],
  rules: [
    rule.when(fieldRef(accountType).eq("company")).show(companyName),
    rule.when(fieldRef(accountType).eq("individual")).hide(companyName),
    rule.when(contextRef("mode").eq("view")).disableAll(),
  ],
});
