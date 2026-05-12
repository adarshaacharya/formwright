import type { FieldPath, FormDefinition, LayoutNode, RuleExpression } from "@formwright/contract";
import { createPluginRegistry } from "../plugins/types";
import type { ResolvedFieldModel, ResolvedLayoutModel } from "../resolved/types";
import type { CreateFormRuntimeInput, EffectApplyInput, FormRuntime, OperatorEvaluateInput } from "./types";
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

function collectExpressionDependencies(expression: RuleExpression, dependencies: Set<FieldPath>): void {
  if ("var" in expression) {
    if (!expression.var.startsWith("$")) dependencies.add(expression.var as FieldPath);
    return;
  }

  if ("exists" in expression) {
    dependencies.add(expression.exists as FieldPath);
    return;
  }

  if ("eq" in expression) {
    collectExpressionDependencies(expression.eq[0], dependencies);
    return;
  }

  if ("neq" in expression) {
    collectExpressionDependencies(expression.neq[0], dependencies);
    return;
  }

  if ("gt" in expression) {
    collectExpressionDependencies(expression.gt[0], dependencies);
    return;
  }

  if ("gte" in expression) {
    collectExpressionDependencies(expression.gte[0], dependencies);
    return;
  }

  if ("lt" in expression) {
    collectExpressionDependencies(expression.lt[0], dependencies);
    return;
  }

  if ("lte" in expression) {
    collectExpressionDependencies(expression.lte[0], dependencies);
    return;
  }

  if ("in" in expression) {
    collectExpressionDependencies(expression.in[0], dependencies);
    return;
  }

  if ("and" in expression) {
    for (const node of expression.and) collectExpressionDependencies(node, dependencies);
    return;
  }

  if ("or" in expression) {
    for (const node of expression.or) collectExpressionDependencies(node, dependencies);
    return;
  }

  if ("not" in expression) {
    collectExpressionDependencies(expression.not, dependencies);
  }
}

function collectLayoutDependencies(node: LayoutNode, dependencies: Set<FieldPath>): void {
  if ("visibleWhen" in node && node.visibleWhen) {
    collectExpressionDependencies(node.visibleWhen, dependencies);
  }

  if ("children" in node) {
    for (const child of node.children) collectLayoutDependencies(child, dependencies);
  }

  if ("tabs" in node) {
    for (const tab of node.tabs) {
      for (const child of tab.children) collectLayoutDependencies(child, dependencies);
    }
  }

  if ("steps" in node) {
    for (const step of node.steps) {
      for (const child of step.children) collectLayoutDependencies(child, dependencies);
    }
  }
}

function collectBehaviorDependencies(form: FormDefinition): FieldPath[] {
  const dependencies = new Set<FieldPath>();

  for (const rule of form.behaviorSchema?.rules ?? []) {
    collectExpressionDependencies(rule.when, dependencies);
  }

  for (const computed of form.behaviorSchema?.computed ?? []) {
    for (const path of computed.runOn) dependencies.add(path);
  }

  for (const source of Object.values(form.behaviorSchema?.dataSources ?? {})) {
    if (source.type === "remote") {
      for (const dep of source.dependsOn ?? []) dependencies.add(dep as FieldPath);
    }
  }

  collectLayoutDependencies(form.uiSchema.layout, dependencies);

  return [...dependencies];
}

function evalExpr(
  expr: RuleExpression,
  values: Record<string, unknown>,
  context: Record<string, unknown>,
): unknown {
  if ("var" in expr) {
    if (expr.var.startsWith("$")) {
      return context[expr.var.slice(1)];
    }
    return values[expr.var];
  }
  if ("eq" in expr) {
    return evalExpr(expr.eq[0], values, context) === expr.eq[1];
  }
  if ("neq" in expr) {
    return evalExpr(expr.neq[0], values, context) !== expr.neq[1];
  }
  if ("and" in expr) {
    return expr.and.every((node) => Boolean(evalExpr(node, values, context)));
  }
  if ("or" in expr) {
    return expr.or.some((node) => Boolean(evalExpr(node, values, context)));
  }
  if ("not" in expr) {
    return !Boolean(evalExpr(expr.not, values, context));
  }
  if ("exists" in expr) {
    return values[expr.exists] !== undefined && values[expr.exists] !== null;
  }
  if ("gt" in expr) {
    return Number(evalExpr(expr.gt[0], values, context)) > expr.gt[1];
  }
  if ("gte" in expr) {
    return Number(evalExpr(expr.gte[0], values, context)) >= expr.gte[1];
  }
  if ("lt" in expr) {
    return Number(evalExpr(expr.lt[0], values, context)) < expr.lt[1];
  }
  if ("lte" in expr) {
    return Number(evalExpr(expr.lte[0], values, context)) <= expr.lte[1];
  }
  if ("in" in expr) {
    return expr.in[1].includes(evalExpr(expr.in[0], values, context));
  }
  return false;
}

function getExpressionOperatorType(expr: RuleExpression): string {
  const keys = Object.keys(expr);
  return keys[0] ?? "";
}

function applyBuiltInEffect(
  effect: EffectApplyInput["effect"],
  fieldState: Record<FieldPath, DerivedFieldState>,
  layoutState: Record<string, DerivedLayoutState>,
  values: Record<string, unknown>,
): void {
  const isWildcardTarget = effect.target === "*";
  const targetFieldPaths = isWildcardTarget ? Object.keys(fieldState) : [effect.target];
  const targetLayoutIds = isWildcardTarget ? Object.keys(layoutState) : [effect.target];

  if (effect.type === "show") {
    for (const path of targetFieldPaths) {
      if (fieldState[path]) fieldState[path].visible = true;
    }
  }
  if (effect.type === "hide") {
    for (const path of targetFieldPaths) {
      if (fieldState[path]) fieldState[path].visible = false;
    }
  }
  if (effect.type === "enable") {
    for (const path of targetFieldPaths) {
      if (fieldState[path]) fieldState[path].disabled = false;
    }
  }
  if (effect.type === "disable") {
    for (const path of targetFieldPaths) {
      if (fieldState[path]) fieldState[path].disabled = true;
    }
  }
  if (effect.type === "require") {
    for (const path of targetFieldPaths) {
      if (fieldState[path]) fieldState[path].required = effect.value ?? true;
    }
  }
  if (effect.type === "setValue") {
    values[effect.target] = effect.value;
  }
  if (effect.type === "clearValue") {
    if (isWildcardTarget) {
      for (const key of Object.keys(values)) values[key] = undefined;
    } else {
      values[effect.target] = undefined;
    }
  }
  if (effect.type === "setLayoutProp" && effect.prop === "visible") {
    for (const id of targetLayoutIds) {
      if (layoutState[id]) layoutState[id].visible = Boolean(effect.value);
    }
  }
}

export function createFormRuntime(input: CreateFormRuntimeInput): FormRuntime {
  const form = input.form;
  const runtimeContext = {
    mode: input.context?.mode ?? form.meta?.mode,
    userRole: input.context?.userRole,
    locale: input.context?.locale ?? form.meta?.locale,
    featureFlags: input.context?.featureFlags,
    meta: input.context?.meta,
  };
  const resolvedFields = toResolvedFields(form);
  const resolvedLayout = toResolvedLayout(form.uiSchema.layout);
  const evaluationDependencies = collectBehaviorDependencies(form);
  const pluginRegistry = createPluginRegistry();
  pluginRegistry.registerMany(input.plugins ?? []);

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
    getEvaluationDependencies() {
      return evaluationDependencies;
    },
    getRuntimeContext() {
      return runtimeContext;
    },
    getPluginRegistry() {
      return pluginRegistry;
    },
    evaluate(runtimeValues): RuntimeEvaluationResult {
      const layoutState: Record<string, DerivedLayoutState> = {};
      collectLayoutState(form.uiSchema.layout, layoutState);
      const fieldState = getInitialFieldState(form);
      const values = { ...getInitialValues(form), ...(runtimeValues ?? {}) };
      const valueMutations: Array<{ path: FieldPath; value: unknown }> = [];

      const pushValueMutation = (path: FieldPath, value: unknown) => {
        valueMutations.push({ path, value });
        values[path] = value;
      };

      for (const rule of form.behaviorSchema?.rules ?? []) {
        const operatorType = getExpressionOperatorType(rule.when);
        const operator = pluginRegistry.findOperator(operatorType);
        const matched = operator
          ? Boolean(
              operator.evaluate({
                expression: rule.when as unknown as OperatorEvaluateInput["expression"],
                values,
                context: runtimeContext,
              }),
            )
          : Boolean(evalExpr(rule.when, values, runtimeContext as Record<string, unknown>));
        if (!matched) continue;

        for (const effect of rule.effects) {
          const effectPlugin = pluginRegistry.findEffect(effect.type);
          if (effectPlugin) {
            const pluginResult = effectPlugin.apply({
              effect,
              values,
              derivedState: { fields: fieldState, layouts: layoutState },
              context: runtimeContext,
            });

            for (const mutation of pluginResult.fieldMutations ?? []) {
              if (mutation.path === "*") {
                for (const path of Object.keys(fieldState)) {
                  fieldState[path] = { ...fieldState[path], ...mutation.patch };
                }
              } else if (fieldState[mutation.path]) {
                fieldState[mutation.path] = { ...fieldState[mutation.path], ...mutation.patch };
              }
            }

            for (const mutation of pluginResult.layoutMutations ?? []) {
              if (mutation.id === "*") {
                for (const id of Object.keys(layoutState)) {
                  layoutState[id] = { ...layoutState[id], ...mutation.patch };
                }
              } else if (layoutState[mutation.id]) {
                layoutState[mutation.id] = { ...layoutState[mutation.id], ...mutation.patch };
              }
            }

            for (const mutation of pluginResult.valueMutations ?? []) {
              if (mutation.path === "*") {
                for (const key of Object.keys(values)) {
                  pushValueMutation(key, mutation.value);
                }
              } else {
                pushValueMutation(mutation.path, mutation.value);
              }
            }
            continue;
          }

          if (effect.type === "setValue") {
            pushValueMutation(effect.target, effect.value);
            continue;
          }
          if (effect.type === "clearValue") {
            if (effect.target === "*") {
              for (const key of Object.keys(values)) pushValueMutation(key, undefined);
            } else {
              pushValueMutation(effect.target, undefined);
            }
            continue;
          }

          applyBuiltInEffect(effect, fieldState, layoutState, values);
        }
      }

      return {
        fieldState,
        layoutState,
        values,
        valueMutations,
      };
    },
  };
}
