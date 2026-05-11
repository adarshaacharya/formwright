import type { RuleExpression, SelectOption } from "../behavior-schema/types";
import type { FieldPath } from "../shared/types";

export interface UiSchema {
  nodes: Record<FieldPath, UiFieldNode>;
  layout: LayoutNode;
}

export interface UiFieldNode {
  fieldType: string;
  label?: string;
  description?: string;
  helpText?: string;
  placeholder?: string;
  widget?: string;
  renderer?: string;
  componentProps?: Record<string, unknown>;
  wrapperProps?: Record<string, unknown>;
  styleTokens?: Record<string, string | number | boolean>;
  accessibility?: {
    labelHidden?: boolean;
    ariaDescription?: string;
  };
  options?: SelectOption[];
  dataSource?: string;
}

export type LayoutNode =
  | SectionLayoutNode
  | GridLayoutNode
  | StackLayoutNode
  | TabsLayoutNode
  | StepperLayoutNode
  | DividerLayoutNode
  | FieldLayoutNode;

export interface BaseLayoutNode {
  id?: string;
  type: string;
  title?: string;
  description?: string;
  visibleWhen?: RuleExpression;
  componentProps?: Record<string, unknown>;
}

export interface SectionLayoutNode extends BaseLayoutNode {
  type: "section";
  children: LayoutNode[];
}

export interface GridLayoutNode extends BaseLayoutNode {
  type: "grid";
  columns: number;
  children: Array<LayoutNode & { span?: number }>;
}

export interface StackLayoutNode extends BaseLayoutNode {
  type: "stack";
  children: LayoutNode[];
}

export interface TabsLayoutNode extends BaseLayoutNode {
  type: "tabs";
  tabs: Array<{
    id: string;
    label: string;
    children: LayoutNode[];
  }>;
}

export interface StepperLayoutNode extends BaseLayoutNode {
  type: "stepper";
  steps: Array<{
    id: string;
    label: string;
    children: LayoutNode[];
  }>;
}

export interface DividerLayoutNode extends BaseLayoutNode {
  type: "divider";
}

export interface FieldLayoutNode extends BaseLayoutNode {
  type: "field";
  ref: FieldPath;
  span?: number;
}
