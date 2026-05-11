import type { OperatorPlugin } from "@formwright/core";

function evaluateExpression(
  expr: unknown,
  values: Record<string, unknown>,
  context: Record<string, unknown>,
): unknown {
  if (!expr || typeof expr !== "object") return expr;

  const node = expr as Record<string, unknown>;
  if ("var" in node && typeof node.var === "string") {
    if (node.var.startsWith("$")) {
      return context[node.var.slice(1)];
    }
    return values[node.var];
  }
  if ("eq" in node && Array.isArray(node.eq) && node.eq.length === 2) {
    return evaluateExpression(node.eq[0], values, context) === node.eq[1];
  }
  if ("neq" in node && Array.isArray(node.neq) && node.neq.length === 2) {
    return evaluateExpression(node.neq[0], values, context) !== node.neq[1];
  }
  if ("and" in node && Array.isArray(node.and)) {
    return node.and.every((entry) => Boolean(evaluateExpression(entry, values, context)));
  }
  if ("or" in node && Array.isArray(node.or)) {
    return node.or.some((entry) => Boolean(evaluateExpression(entry, values, context)));
  }
  if ("not" in node) {
    return !Boolean(evaluateExpression(node.not, values, context));
  }
  if ("exists" in node && typeof node.exists === "string") {
    const value = values[node.exists];
    return value !== undefined && value !== null;
  }
  if ("gt" in node && Array.isArray(node.gt) && node.gt.length === 2) {
    return Number(evaluateExpression(node.gt[0], values, context)) > Number(node.gt[1]);
  }
  if ("gte" in node && Array.isArray(node.gte) && node.gte.length === 2) {
    return Number(evaluateExpression(node.gte[0], values, context)) >= Number(node.gte[1]);
  }
  if ("lt" in node && Array.isArray(node.lt) && node.lt.length === 2) {
    return Number(evaluateExpression(node.lt[0], values, context)) < Number(node.lt[1]);
  }
  if ("lte" in node && Array.isArray(node.lte) && node.lte.length === 2) {
    return Number(evaluateExpression(node.lte[0], values, context)) <= Number(node.lte[1]);
  }
  if ("in" in node && Array.isArray(node.in) && node.in.length === 2 && Array.isArray(node.in[1])) {
    return node.in[1].includes(evaluateExpression(node.in[0], values, context));
  }

  return false;
}

function makeOperator(operatorType: string): OperatorPlugin {
  return {
    kind: "operator",
    identity: {
      name: `@formwright/plugins-basic/operator/${operatorType}`,
      version: "0.0.0",
    },
    operatorType,
    evaluate(input) {
      return evaluateExpression(input.expression, input.values, input.context as Record<string, unknown>);
    },
  };
}

export const eqOperatorPlugin = makeOperator("eq");
export const neqOperatorPlugin = makeOperator("neq");
export const andOperatorPlugin = makeOperator("and");
export const orOperatorPlugin = makeOperator("or");
export const notOperatorPlugin = makeOperator("not");
export const existsOperatorPlugin = makeOperator("exists");
export const gtOperatorPlugin = makeOperator("gt");
export const gteOperatorPlugin = makeOperator("gte");
export const ltOperatorPlugin = makeOperator("lt");
export const lteOperatorPlugin = makeOperator("lte");
export const inOperatorPlugin = makeOperator("in");

export const basicOperatorPlugins: OperatorPlugin[] = [
  eqOperatorPlugin,
  neqOperatorPlugin,
  andOperatorPlugin,
  orOperatorPlugin,
  notOperatorPlugin,
  existsOperatorPlugin,
  gtOperatorPlugin,
  gteOperatorPlugin,
  ltOperatorPlugin,
  lteOperatorPlugin,
  inOperatorPlugin,
];
