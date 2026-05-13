import type { FormDefinition } from "@formwright/contract";
import { buildForm, contextRef, datasource, defineForm, field, fieldRef, layout, rule } from "@formwright/schema-builder";

export type OptionalFieldKey = "companyName" | "country" | "contactEmail" | "addresses";

export interface CustomerOnboardingDraft {
  formTitle: string;
  companyLabel: string;
  emailPlaceholder: string;
  defaultAccountType: "individual" | "company";
  contactColumns: 1 | 2;
  requireCompanyWhenCompanyType: boolean;
  enabledFields: Record<OptionalFieldKey, boolean>;
  fieldOrder: OptionalFieldKey[];
}

export const defaultCustomerOnboardingDraft: CustomerOnboardingDraft = {
  formTitle: "Customer Onboarding",
  companyLabel: "Company Name",
  emailPlaceholder: "name@example.com",
  defaultAccountType: "individual",
  contactColumns: 2,
  requireCompanyWhenCompanyType: false,
  enabledFields: {
    companyName: true,
    country: true,
    contactEmail: true,
    addresses: true,
  },
  fieldOrder: ["companyName", "country", "contactEmail", "addresses"],
};

export function buildCustomerOnboardingSchema(draft: CustomerOnboardingDraft): FormDefinition {
  const accountType = field.select("accountType", {
    label: "Account Type",
    required: true,
    default: draft.defaultAccountType,
    options: [
      { label: "Individual", value: "individual" },
      { label: "Company", value: "company" },
    ],
  });

  const companyName = field.text("company.name", {
    label: draft.companyLabel,
    placeholder: "Enter company name",
    description: "Only visible for company accounts.",
  });

  const country = field.select("country", {
    label: "Country",
    dataSource: "countries",
  });

  const contactEmail = field.email("contact.email", {
    label: "Contact Email",
    placeholder: draft.emailPlaceholder,
    helpText: "Used for onboarding communications.",
  });

  const addresses = field.objectArray("addresses", {
    label: "Addresses",
    item: {
      street: field.textItem({ label: "Street", placeholder: "123 Main St", default: "" }),
      city: field.textItem({ label: "City", placeholder: "Kathmandu", default: "" }),
      zip: field.textItem({ label: "ZIP", placeholder: "44600", default: "" }),
    },
    itemLayout: ["street", "city", "zip"],
  });

  const optionalRegistry = {
    companyName,
    country,
    contactEmail,
    addresses,
  } as const;

  const enabledKeys = draft.fieldOrder.filter((key) => draft.enabledFields[key]);
  const enabledFields = enabledKeys.map((key) => optionalRegistry[key]);

  const contactGridItems = [
    draft.enabledFields.country ? layout.field(country, { span: 1 }) : null,
    draft.enabledFields.contactEmail ? layout.field(contactEmail, { span: 1 }) : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  const orderedLayoutNodes = enabledKeys
    .map((key) => {
      if (key === "country" || key === "contactEmail") {
        return null;
      }
      if (key === "companyName") {
        return layout.field(companyName);
      }
      return layout.field(addresses);
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const layoutNodes = [
    layout.field(accountType),
    ...orderedLayoutNodes,
    contactGridItems.length > 0
      ? layout.grid("contact-grid", { columns: draft.contactColumns, title: "Contact" }, contactGridItems)
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  const rules = [rule.when(contextRef("mode").eq("view")).disableAll()];

  if (draft.enabledFields.companyName) {
    rules.push(rule.when(fieldRef(accountType).eq("company")).show(companyName));
    rules.push(rule.when(fieldRef(accountType).eq("individual")).hide(companyName));

    if (draft.requireCompanyWhenCompanyType) {
      rules.push(rule.when(fieldRef(accountType).eq("company")).require(companyName, true));
    }
  }

  return buildForm({
    form: defineForm({
      id: "customer-onboarding",
      meta: {
        title: draft.formTitle,
        mode: "create",
      },
    }),
    fields: [accountType, ...enabledFields],
    layout: layout.stack("root-stack", layoutNodes),
    datasources: [
      datasource.static("countries", [
        { label: "United States", value: "US" },
        { label: "Nepal", value: "NP" },
        { label: "Germany", value: "DE" },
      ]),
    ],
    rules,
  });
}

export function buildCustomerOnboardingSource(draft: CustomerOnboardingDraft): string {
  const enabled = draft.fieldOrder.filter((key) => draft.enabledFields[key]);
  return `// Generated from Schema Lab controls\n// Enabled fields (ordered): ${enabled.join(", ")}\n\nconst accountType = field.select("accountType", {\n  required: true,\n  default: "${draft.defaultAccountType}",\n});\n\nconst form = buildForm({\n  form: defineForm({ id: "customer-onboarding", meta: { title: "${draft.formTitle}" } }),\n  // Optional fields are composed from enabled + ordered keys\n  contactColumns: ${draft.contactColumns},\n  requireCompanyWhenCompanyType: ${String(draft.requireCompanyWhenCompanyType)},\n});`;
}
