import type { FormDefinition } from "@formwright/contract";

import { RemoteSchemaValidationError, type RemoteSchemaIssue } from "./errors";

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function parseRuleEffect(effect: unknown, path: string, issues: RemoteSchemaIssue[]): void {
  if (!isObject(effect) || typeof effect.type !== "string" || typeof effect.target !== "string") {
    issues.push({ path, message: "Rule effect must include string type and target" });
    return;
  }

  const requiresValue = effect.type === "setValue" || effect.type === "setOptions" || effect.type === "setLayoutProp";
  if (requiresValue && !("value" in effect)) {
    issues.push({ path, message: `Rule effect ${effect.type} must include value` });
  }

  if (effect.type === "require" && "value" in effect && typeof effect.value !== "boolean") {
    issues.push({ path, message: "Require effect value must be boolean when provided" });
  }

  if (effect.type === "setLayoutProp" && typeof effect.prop !== "string") {
    issues.push({ path, message: "setLayoutProp effect must include string prop" });
  }
}

function parseDataSource(source: unknown, path: string, issues: RemoteSchemaIssue[]): void {
  if (!isObject(source) || typeof source.type !== "string") {
    issues.push({ path, message: "Data source must include a string type" });
    return;
  }

  if (source.type === "static") {
    if (!Array.isArray(source.options)) {
      issues.push({ path, message: "Static data source must include options array" });
    }
    return;
  }

  if (source.type === "remote") {
    if (typeof source.endpoint !== "string") {
      issues.push({ path, message: "Remote data source must include endpoint" });
    }
    if ("dependsOn" in source && !isStringArray(source.dependsOn)) {
      issues.push({ path, message: "Remote data source dependsOn must be string[]" });
    }
    return;
  }

  issues.push({ path, message: `Unsupported data source type: ${source.type}` });
}

function collectLayoutFieldRefs(
  node: unknown,
  knownFieldPaths: Set<string>,
  path: string,
  issues: RemoteSchemaIssue[],
): void {
  if (!isObject(node) || typeof node.type !== "string") {
    issues.push({ path, message: "Layout node must include string type" });
    return;
  }

  if (node.type === "field") {
    if (typeof node.ref !== "string") {
      issues.push({ path, message: "Field layout node must include ref" });
      return;
    }

    if (!knownFieldPaths.has(node.ref)) {
      issues.push({ path: `${path}.ref`, message: `Unknown field reference: ${node.ref}` });
    }
    return;
  }

  if ("children" in node) {
    if (!Array.isArray(node.children)) {
      issues.push({ path: `${path}.children`, message: "children must be an array" });
      return;
    }

    node.children.forEach((child, index) => {
      collectLayoutFieldRefs(child, knownFieldPaths, `${path}.children[${index}]`, issues);
    });
  }

  if ("tabs" in node) {
    if (!Array.isArray(node.tabs)) {
      issues.push({ path: `${path}.tabs`, message: "tabs must be an array" });
      return;
    }

    node.tabs.forEach((tab, tabIndex) => {
      if (!isObject(tab) || !Array.isArray(tab.children)) {
        issues.push({ path: `${path}.tabs[${tabIndex}]`, message: "tab must include children array" });
        return;
      }

      tab.children.forEach((child, index) => {
        collectLayoutFieldRefs(child, knownFieldPaths, `${path}.tabs[${tabIndex}].children[${index}]`, issues);
      });
    });
  }

  if ("steps" in node) {
    if (!Array.isArray(node.steps)) {
      issues.push({ path: `${path}.steps`, message: "steps must be an array" });
      return;
    }

    node.steps.forEach((step, stepIndex) => {
      if (!isObject(step) || !Array.isArray(step.children)) {
        issues.push({ path: `${path}.steps[${stepIndex}]`, message: "step must include children array" });
        return;
      }

      step.children.forEach((child, index) => {
        collectLayoutFieldRefs(child, knownFieldPaths, `${path}.steps[${stepIndex}].children[${index}]`, issues);
      });
    });
  }
}

function parseBehaviorSchema(behaviorSchema: unknown, issues: RemoteSchemaIssue[]): void {
  if (!isObject(behaviorSchema)) {
    issues.push({ path: "form.behaviorSchema", message: "behaviorSchema must be an object" });
    return;
  }

  if ("rules" in behaviorSchema && behaviorSchema.rules !== undefined) {
    if (!Array.isArray(behaviorSchema.rules)) {
      issues.push({ path: "form.behaviorSchema.rules", message: "rules must be an array" });
    } else {
      behaviorSchema.rules.forEach((rule, index) => {
        if (!isObject(rule) || typeof rule.id !== "string" || !Array.isArray(rule.effects)) {
          issues.push({ path: `form.behaviorSchema.rules[${index}]`, message: "rule must include id and effects" });
          return;
        }

        rule.effects.forEach((effect, effectIndex) => {
          parseRuleEffect(effect, `form.behaviorSchema.rules[${index}].effects[${effectIndex}]`, issues);
        });
      });
    }
  }

  if ("dataSources" in behaviorSchema && behaviorSchema.dataSources !== undefined) {
    if (!isObject(behaviorSchema.dataSources)) {
      issues.push({ path: "form.behaviorSchema.dataSources", message: "dataSources must be an object" });
    } else {
      Object.entries(behaviorSchema.dataSources).forEach(([name, source]) => {
        parseDataSource(source, `form.behaviorSchema.dataSources.${name}`, issues);
      });
    }
  }

  if ("computed" in behaviorSchema && behaviorSchema.computed !== undefined) {
    if (!Array.isArray(behaviorSchema.computed)) {
      issues.push({ path: "form.behaviorSchema.computed", message: "computed must be an array" });
    } else {
      behaviorSchema.computed.forEach((item, index) => {
        if (!isObject(item) || typeof item.target !== "string" || !isStringArray(item.runOn)) {
          issues.push({ path: `form.behaviorSchema.computed[${index}]`, message: "computed must include target and runOn" });
        }
      });
    }
  }

  if ("lifecycle" in behaviorSchema && behaviorSchema.lifecycle !== undefined) {
    if (!isObject(behaviorSchema.lifecycle)) {
      issues.push({ path: "form.behaviorSchema.lifecycle", message: "lifecycle must be an object" });
    } else {
      const lifecycle = behaviorSchema.lifecycle;
      const validTypes = new Set(["fetchDataSource", "validateServerRules", "submitTo"]);
      const stages = ["onLoad", "onSubmit"] as const;
      for (const stage of stages) {
        const actions = lifecycle[stage];
        if (actions === undefined) continue;
        if (!Array.isArray(actions)) {
          issues.push({ path: `form.behaviorSchema.lifecycle.${stage}`, message: `${stage} must be an array` });
          continue;
        }

        actions.forEach((action, index) => {
          if (!isObject(action) || typeof action.type !== "string" || !validTypes.has(action.type)) {
            issues.push({ path: `form.behaviorSchema.lifecycle.${stage}[${index}]`, message: "Invalid lifecycle action" });
            return;
          }

          if ((action.type === "fetchDataSource" || action.type === "submitTo") && typeof action.target !== "string") {
            issues.push({ path: `form.behaviorSchema.lifecycle.${stage}[${index}]`, message: `${action.type} requires target` });
          }
        });
      }
    }
  }
}

export function parseFormDefinition(input: unknown): FormDefinition {
  const issues: RemoteSchemaIssue[] = [];

  if (!isObject(input)) {
    throw new RemoteSchemaValidationError([{ path: "form", message: "Form definition must be an object" }]);
  }

  if (input.version !== "1.0") {
    issues.push({ path: "form.version", message: "Form version must be 1.0" });
  }

  if (typeof input.formId !== "string" || input.formId.length === 0) {
    issues.push({ path: "form.formId", message: "formId must be a non-empty string" });
  }

  if (!isObject(input.dataSchema)) {
    issues.push({ path: "form.dataSchema", message: "dataSchema must be an object" });
  }

  const dataSchema = isObject(input.dataSchema) ? input.dataSchema : undefined;
  const fieldPaths = new Set<string>();

  const fieldsRecord = dataSchema?.fields;
  if (!isObject(fieldsRecord)) {
    issues.push({ path: "form.dataSchema.fields", message: "dataSchema.fields must be an object" });
  } else {
    Object.entries(fieldsRecord).forEach(([fieldPath, field]) => {
      fieldPaths.add(fieldPath);
      if (!isObject(field) || typeof field.valueType !== "string") {
        issues.push({ path: `form.dataSchema.fields.${fieldPath}`, message: "field must include valueType" });
      }
    });
  }

  if (!isObject(input.uiSchema)) {
    issues.push({ path: "form.uiSchema", message: "uiSchema must be an object" });
  } else {
    if (!isObject(input.uiSchema.nodes)) {
      issues.push({ path: "form.uiSchema.nodes", message: "uiSchema.nodes must be an object" });
    }

    if (!isObject(input.uiSchema.layout)) {
      issues.push({ path: "form.uiSchema.layout", message: "uiSchema.layout must be an object" });
    } else {
      collectLayoutFieldRefs(input.uiSchema.layout, fieldPaths, "form.uiSchema.layout", issues);
    }
  }

  if (input.behaviorSchema !== undefined) {
    parseBehaviorSchema(input.behaviorSchema, issues);
  }

  if (issues.length > 0) {
    throw new RemoteSchemaValidationError(issues);
  }

  return input as unknown as FormDefinition;
}
