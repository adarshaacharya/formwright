import type { BehaviorRule, FieldPath, FormDefinition, LayoutNode } from "@formwright/contract";
import type { CustomerOnboardingDraft, OptionalFieldKey } from "./examples/customer-onboarding";

export interface SchemaIssue {
  path: string;
  message: string;
}

export interface SchemaMarker {
  path: string;
  message: string;
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isRuleExpression(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  if ("var" in value) {
    return typeof value.var === "string";
  }

  if ("exists" in value) {
    return typeof value.exists === "string";
  }

  if ("not" in value) {
    return isRuleExpression(value.not);
  }

  if ("and" in value || "or" in value) {
    const entries = (value.and ?? value.or) as unknown;
    return Array.isArray(entries) && entries.every(isRuleExpression);
  }

  if ("eq" in value || "neq" in value || "gt" in value || "gte" in value || "lt" in value || "lte" in value || "in" in value) {
    const tuple = (value.eq ?? value.neq ?? value.gt ?? value.gte ?? value.lt ?? value.lte ?? value.in) as unknown;
    return Array.isArray(tuple) && tuple.length === 2;
  }

  return false;
}

function getLayoutFieldRefs(node: LayoutNode): FieldPath[] {
  return collectLayoutFieldRefs(node, []);
}

function findPosition(text: string, token: string): { line: number; column: number } | null {
  const index = text.indexOf(token);
  if (index < 0) {
    return null;
  }

  const before = text.slice(0, index);
  const lines = before.split("\n");
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

function markerFromToken(text: string, path: string, token: string, message: string): SchemaMarker | null {
  const position = findPosition(text, token);
  if (!position) {
    return null;
  }

  return {
    path,
    message,
    startLineNumber: position.line,
    startColumn: position.column,
    endLineNumber: position.line,
    endColumn: position.column + token.length,
  };
}

function collectLayoutFieldRefs(node: LayoutNode, refs: FieldPath[] = []): FieldPath[] {
  if (node.type === "field") {
    refs.push(node.ref);
    return refs;
  }

  if (node.type === "grid" || node.type === "stack" || node.type === "section") {
    for (const child of node.children) {
      collectLayoutFieldRefs(child, refs);
    }
  }

  if (node.type === "tabs") {
    for (const tab of node.tabs) {
      for (const child of tab.children) {
        collectLayoutFieldRefs(child, refs);
      }
    }
  }

  if (node.type === "stepper") {
    for (const step of node.steps) {
      for (const child of step.children) {
        collectLayoutFieldRefs(child, refs);
      }
    }
  }

  return refs;
}

export function validateFormDefinitionShape(schema: unknown): SchemaIssue[] {
  const issues: SchemaIssue[] = [];

  if (!isRecord(schema)) {
    return [{ path: "root", message: "Schema must be an object" }];
  }

  if (typeof schema.version !== "string") {
    issues.push({ path: "version", message: "version must be a string" });
  }

  if (typeof schema.formId !== "string" || schema.formId.length === 0) {
    issues.push({ path: "formId", message: "formId must be a non-empty string" });
  }

  if (!isRecord(schema.dataSchema)) {
    issues.push({ path: "dataSchema", message: "dataSchema must be an object" });
    return issues;
  }

  if (schema.dataSchema.rootType !== "object") {
    issues.push({ path: "dataSchema.rootType", message: "rootType must be 'object'" });
  }

  const fields = schema.dataSchema.fields;
  if (!isRecord(fields)) {
    issues.push({ path: "dataSchema.fields", message: "fields must be an object map" });
    return issues;
  }

  const fieldKeys = Object.keys(fields);
  const fieldSet = new Set(fieldKeys);
  if (fieldKeys.length === 0) {
    issues.push({ path: "dataSchema.fields", message: "at least one field is required" });
  }

  for (const key of fieldKeys) {
    const field = fields[key];
    if (!isRecord(field)) {
      issues.push({ path: `dataSchema.fields.${key}`, message: "field definition must be an object" });
      continue;
    }
    if (typeof field.valueType !== "string") {
      issues.push({ path: `dataSchema.fields.${key}.valueType`, message: "valueType must be a string" });
      continue;
    }

    if (field.valueType === "array") {
      if (field.itemType !== undefined && typeof field.itemType !== "string") {
        issues.push({ path: `dataSchema.fields.${key}.itemType`, message: "itemType must be a string" });
      }
      if (field.itemSchema !== undefined && !isRecord(field.itemSchema)) {
        issues.push({ path: `dataSchema.fields.${key}.itemSchema`, message: "itemSchema must be an object map" });
      }
    }

    if (field.valueType === "string") {
      if (field.enum !== undefined && !isStringArray(field.enum)) {
        issues.push({ path: `dataSchema.fields.${key}.enum`, message: "string enum must be an array of strings" });
      }
      if (field.format !== undefined && typeof field.format !== "string") {
        issues.push({ path: `dataSchema.fields.${key}.format`, message: "format must be a string" });
      }
    }

    if (field.valueType === "number" || field.valueType === "integer") {
      if (field.enum !== undefined && !Array.isArray(field.enum)) {
        issues.push({ path: `dataSchema.fields.${key}.enum`, message: "number enum must be an array" });
      }
    }
  }

  if (!isRecord(schema.uiSchema)) {
    issues.push({ path: "uiSchema", message: "uiSchema must be an object" });
    return issues;
  }

  if (!isRecord(schema.uiSchema.nodes)) {
    issues.push({ path: "uiSchema.nodes", message: "nodes must be an object map" });
  } else {
    for (const key of fieldKeys) {
      if (!(key in schema.uiSchema.nodes)) {
        issues.push({ path: `uiSchema.nodes.${key}`, message: "missing ui node for data field" });
      }
    }
  }

  if (!isRecord(schema.uiSchema.layout)) {
    issues.push({ path: "uiSchema.layout", message: "layout must be an object" });
  } else {
    const layoutRefs = collectLayoutFieldRefs(schema.uiSchema.layout as unknown as LayoutNode);
    for (const ref of layoutRefs) {
      if (!fieldSet.has(ref)) {
        issues.push({ path: `uiSchema.layout`, message: `layout ref '${ref}' not found in dataSchema.fields` });
      }
    }
  }

  if (isRecord(schema.behaviorSchema) && Array.isArray(schema.behaviorSchema.rules)) {
    for (const [index, rule] of schema.behaviorSchema.rules.entries()) {
      if (!isRecord(rule)) {
        issues.push({ path: `behaviorSchema.rules.${index}`, message: "rule must be an object" });
        continue;
      }

      if (typeof rule.id !== "string" || rule.id.length === 0) {
        issues.push({ path: `behaviorSchema.rules.${index}.id`, message: "rule.id must be a non-empty string" });
      }

      if (!isRuleExpression(rule.when)) {
        issues.push({ path: `behaviorSchema.rules.${index}.when`, message: "rule.when must be a valid expression" });
      }

      if (!Array.isArray(rule.effects) || rule.effects.length === 0) {
        issues.push({ path: `behaviorSchema.rules.${index}.effects`, message: "rule.effects must be a non-empty array" });
        continue;
      }

      for (const [effectIndex, effect] of rule.effects.entries()) {
        if (!isRecord(effect) || typeof effect.type !== "string" || typeof effect.target !== "string") {
          issues.push({
            path: `behaviorSchema.rules.${index}.effects.${effectIndex}`,
            message: "rule effect must include type and target",
          });
          continue;
        }

        if (!fieldSet.has(effect.target as FieldPath) && effect.type !== "submitTo") {
          issues.push({
            path: `behaviorSchema.rules.${index}.effects.${effectIndex}.target`,
            message: `target '${effect.target}' does not exist in dataSchema.fields`,
          });
        }
      }
    }
  }

  return issues;
}

export function buildSchemaMarkers(text: string, issues: SchemaIssue[]): SchemaMarker[] {
  return issues
    .map((issue) => {
      const token =
        issue.path === "formId"
          ? "\"formId\""
          : issue.path.includes("dataSchema.fields.")
            ? `"${issue.path.split(".")[2]}"`
            : issue.path.includes("behaviorSchema.rules.")
              ? "\"rules\""
              : issue.path.includes("uiSchema.layout")
                ? "\"layout\""
                : issue.path.includes("uiSchema.nodes.")
                  ? `"${issue.path.split(".")[2]}"`
                  : null;

      if (!token) {
        return null;
      }

      return markerFromToken(text, issue.path, token, issue.message);
    })
    .filter((marker): marker is SchemaMarker => marker !== null);
}

function hasRequireCompanyRule(rules: BehaviorRule[] | undefined): boolean {
  if (!rules) {
    return false;
  }

  return rules.some((rule) =>
    rule.effects.some((effect) => effect.type === "require" && effect.target === "company.name" && effect.value !== false),
  );
}

function findContactColumns(layout: LayoutNode): 1 | 2 {
  if (layout.type === "grid" && layout.id === "contact-grid") {
    return layout.columns === 1 ? 1 : 2;
  }

  if (layout.type === "stack" || layout.type === "grid" || layout.type === "section") {
    for (const child of layout.children) {
      const found = findContactColumns(child);
      if (found) {
        return found;
      }
    }
  }

  if (layout.type === "tabs") {
    for (const tab of layout.tabs) {
      for (const child of tab.children) {
        const found = findContactColumns(child);
        if (found) {
          return found;
        }
      }
    }
  }

  if (layout.type === "stepper") {
    for (const step of layout.steps) {
      for (const child of step.children) {
        const found = findContactColumns(child);
        if (found) {
          return found;
        }
      }
    }
  }

  return 2;
}

export function deriveDraftFromSchema(schema: FormDefinition, previous: CustomerOnboardingDraft): CustomerOnboardingDraft {
  const dataFields = schema.dataSchema.fields;
  const uiNodes = schema.uiSchema.nodes;
  const existing = new Set(Object.keys(dataFields));

  const enabledFields: Record<OptionalFieldKey, boolean> = {
    companyName: existing.has("company.name"),
    country: existing.has("country"),
    contactEmail: existing.has("contact.email"),
    addresses: existing.has("addresses"),
  };

  const layoutRefs = collectLayoutFieldRefs(schema.uiSchema.layout);
  const refToKey: Partial<Record<string, OptionalFieldKey>> = {
    "company.name": "companyName",
    country: "country",
    "contact.email": "contactEmail",
    addresses: "addresses",
  };

  const fromLayout = layoutRefs
    .map((ref) => refToKey[ref])
    .filter((key): key is OptionalFieldKey => Boolean(key));

  const remaining = (Object.keys(enabledFields) as OptionalFieldKey[]).filter(
    (key) => enabledFields[key] && !fromLayout.includes(key),
  );

  const fieldOrder = [...fromLayout, ...remaining];

  const accountTypeDefault = dataFields.accountType;
  const defaultAccountType =
    isRecord(accountTypeDefault) && (accountTypeDefault.default === "company" || accountTypeDefault.default === "individual")
      ? accountTypeDefault.default
      : previous.defaultAccountType;

  return {
    ...previous,
    formTitle: schema.meta?.title ?? previous.formTitle,
    companyLabel:
      (isRecord(uiNodes["company.name"]) && typeof uiNodes["company.name"].label === "string"
        ? uiNodes["company.name"].label
        : previous.companyLabel),
    emailPlaceholder:
      (isRecord(uiNodes["contact.email"]) && typeof uiNodes["contact.email"].placeholder === "string"
        ? uiNodes["contact.email"].placeholder
        : previous.emailPlaceholder),
    defaultAccountType,
    contactColumns: findContactColumns(schema.uiSchema.layout),
    requireCompanyWhenCompanyType: hasRequireCompanyRule(schema.behaviorSchema?.rules),
    enabledFields,
    fieldOrder,
  };
}
