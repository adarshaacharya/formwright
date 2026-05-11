import type { FieldPath, FormDefinition, LayoutNode, RuleExpression } from "@formwright/contract";
import type { ResolvedFieldModel, ResolvedLayoutModel } from "../resolved/types";
import type { CreateFormRuntimeInput, FormRuntime } from "./types";
import type { DerivedFieldState, DerivedLayoutState, RuntimeEvaluationResult } from "./types";

function toResolvedFields(form: FormDefinition): Record<FieldPath, ResolvedFieldModel> {
  const resolved: Record<FieldPath, ResolvedFieldModel> = {};
  for (const [path, dataField] of Object.entries(form.dataSchema.fields)) {
    const uiField = form.uiSchema.nodes[path];
    const fieldType = uiField?.fieldType ?? dataField.valueType;
    const rendererKey = uiField?.renderer ?? fieldType;

    resolved[path] = {
      path,
      fieldType,
      valueType: dataField.valueType,
      rendererKey,
      dataField,
      uiField,
    };
  }
  return resolved;
}

function toResolvedLayout(node: LayoutNode): ResolvedLayoutModel {
  if (node.type === "field") {
    return {
      id: node.id,
      type: node.type,
      rendererKey: node.type,
      fieldRef: node.ref,
      node,
    };
  }

  const children =
    "children" in node
      ? node.children.map(toResolvedLayout)
      : "tabs" in node
      ? node.tabs.flatMap((tab) => tab.children.map(toResolvedLayout))
      : "steps" in node
      ? node.steps.flatMap((step) => step.children.map(toResolvedLayout))
      : undefined;

  return {
    id: node.id,
    type: node.type,
    rendererKey: node.type,
    children,
    node,
  };
}

function getInitialValues(form: FormDefinition): Record<FieldPath, unknown> {
  const values: Record<FieldPath, unknown> = {};
  for (const [path, dataField] of Object.entries(form.dataSchema.fields)) {
    values[path] = dataField.default;
  }
  return values;
}

function getInitialFieldState(form: FormDefinition): Record<FieldPath, DerivedFieldState> {
  const fieldState: Record<FieldPath, DerivedFieldState> = {};
  for (const [path, dataField] of Object.entries(form.dataSchema.fields)) {
    fieldState[path] = {
      path,
      visible: true,
      disabled: Boolean(dataField.readOnly),
      readonly: Boolean(dataField.readOnly),
      required: Boolean(dataField.required),
    };
  }
  return fieldState;
}

function collectLayoutState(
  node: LayoutNode,
  layoutState: Record<string, DerivedLayoutState>,
): void {
  if (node.id) {
    layoutState[node.id] = {
      id: node.id,
      visible: true,
      disabled: false,
    };
  }

  if ("children" in node) {
    for (const child of node.children) collectLayoutState(child, layoutState);
  }

  if ("tabs" in node) {
    for (const tab of node.tabs) {
      for (const child of tab.children) collectLayoutState(child, layoutState);
    }
  }

  if ("steps" in node) {
    for (const step of node.steps) {
      for (const child of step.children) collectLayoutState(child, layoutState);
    }
  }
}

function evalExpr(expr: RuleExpression, values: Record<string, unknown>): unknown {
  if ("var" in expr) {
    return values[expr.var];
  }
  if ("eq" in expr) {
    return evalExpr(expr.eq[0], values) === expr.eq[1];
  }
  if ("neq" in expr) {
    return evalExpr(expr.neq[0], values) !== expr.neq[1];
  }
  if ("and" in expr) {
    return expr.and.every((node) => Boolean(evalExpr(node, values)));
  }
  if ("or" in expr) {
    return expr.or.some((node) => Boolean(evalExpr(node, values)));
  }
  if ("not" in expr) {
    return !Boolean(evalExpr(expr.not, values));
  }
  if ("exists" in expr) {
    return values[expr.exists] !== undefined && values[expr.exists] !== null;
  }
  if ("gt" in expr) {
    return Number(evalExpr(expr.gt[0], values)) > expr.gt[1];
  }
  if ("gte" in expr) {
    return Number(evalExpr(expr.gte[0], values)) >= expr.gte[1];
  }
  if ("lt" in expr) {
    return Number(evalExpr(expr.lt[0], values)) < expr.lt[1];
  }
  if ("lte" in expr) {
    return Number(evalExpr(expr.lte[0], values)) <= expr.lte[1];
  }
  if ("in" in expr) {
    return expr.in[1].includes(evalExpr(expr.in[0], values));
  }
  return false;
}

export function createFormRuntime(input: CreateFormRuntimeInput): FormRuntime {
  const form = input.form;
  const resolvedFields = toResolvedFields(form);
  const resolvedLayout = toResolvedLayout(form.uiSchema.layout);

  return {
    getFormDefinition() {
      return form;
    },
    getResolvedFields() {
      return resolvedFields;
    },
    getResolvedLayout() {
      return resolvedLayout;
    },
    evaluate(runtimeValues): RuntimeEvaluationResult {
      const layoutState: Record<string, DerivedLayoutState> = {};
      collectLayoutState(form.uiSchema.layout, layoutState);
      const fieldState = getInitialFieldState(form);
      const values = { ...getInitialValues(form), ...(runtimeValues ?? {}) };

      for (const rule of form.behaviorSchema?.rules ?? []) {
        const matched = Boolean(evalExpr(rule.when, values));
        if (!matched) continue;

        for (const effect of rule.effects) {
          if (effect.type === "show" && fieldState[effect.target]) {
            fieldState[effect.target].visible = true;
          }
          if (effect.type === "hide" && fieldState[effect.target]) {
            fieldState[effect.target].visible = false;
          }
          if (effect.type === "enable" && fieldState[effect.target]) {
            fieldState[effect.target].disabled = false;
          }
          if (effect.type === "disable" && fieldState[effect.target]) {
            fieldState[effect.target].disabled = true;
          }
          if (effect.type === "require" && fieldState[effect.target]) {
            fieldState[effect.target].required = effect.value ?? true;
          }
          if (effect.type === "setValue") {
            values[effect.target] = effect.value;
          }
          if (effect.type === "clearValue") {
            values[effect.target] = undefined;
          }
          if (effect.type === "setLayoutProp" && layoutState[effect.target] && effect.prop === "visible") {
            layoutState[effect.target].visible = Boolean(effect.value);
          }
        }
      }

      return {
        fieldState,
        layoutState,
        values,
      };
    },
  };
}
