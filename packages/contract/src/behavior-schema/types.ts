import type { FieldPath } from "../shared/types";

export interface SelectOption {
  label: string;
  value: string | number | boolean;
  disabled?: boolean;
}

export type RuleExpression =
  | { var: string }
  | { eq: [RuleExpression, unknown] }
  | { neq: [RuleExpression, unknown] }
  | { gt: [RuleExpression, number] }
  | { gte: [RuleExpression, number] }
  | { lt: [RuleExpression, number] }
  | { lte: [RuleExpression, number] }
  | { in: [RuleExpression, unknown[]] }
  | { and: RuleExpression[] }
  | { or: RuleExpression[] }
  | { not: RuleExpression }
  | { exists: string };

export type RuleEffect =
  | { type: "show"; target: string }
  | { type: "hide"; target: string }
  | { type: "enable"; target: string }
  | { type: "disable"; target: string }
  | { type: "require"; target: string; value?: boolean }
  | { type: "setValue"; target: string; value: unknown }
  | { type: "clearValue"; target: string }
  | { type: "setOptions"; target: string; value: SelectOption[] }
  | { type: "setLayoutProp"; target: string; prop: string; value: unknown };

export interface BehaviorRule {
  id: string;
  when: RuleExpression;
  effects: RuleEffect[];
}

export type DataSourceDefinition = StaticDataSource | RemoteDataSource;

export interface StaticDataSource {
  type: "static";
  options: SelectOption[];
}

export interface RemoteDataSource {
  type: "remote";
  endpoint: string;
  method?: "GET" | "POST";
  dependsOn?: string[];
  queryMap?: Record<string, string>;
  bodyMap?: Record<string, unknown>;
}

export interface ComputedFieldDefinition {
  target: FieldPath;
  expression: RuleExpression | Record<string, unknown>;
  runOn: FieldPath[];
}

export type LifecycleAction =
  | { type: "fetchDataSource"; target: string }
  | { type: "validateServerRules" }
  | { type: "submitTo"; target: string };

export interface LifecycleDefinition {
  onLoad?: LifecycleAction[];
  onSubmit?: LifecycleAction[];
}

export interface BehaviorSchema {
  rules?: BehaviorRule[];
  dataSources?: Record<string, DataSourceDefinition>;
  computed?: ComputedFieldDefinition[];
  lifecycle?: LifecycleDefinition;
}
