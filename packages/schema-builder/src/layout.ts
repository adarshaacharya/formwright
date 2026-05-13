import type { FieldPath, LayoutNode } from "@formwright/contract";
import type {
  BuiltField,
  GridLayoutOptions,
  LayoutBaseOptions,
  LayoutFieldOptions,
  StepDefinition,
  TabDefinition,
} from "./types";

function resolveFieldPath(input: BuiltField | FieldPath): FieldPath {
  return typeof input === "string" ? input : input.path;
}

function withBase<T extends LayoutNode>(node: T, options?: LayoutBaseOptions): T {
  return {
    ...node,
    title: options?.title,
    description: options?.description,
    visibleWhen: options?.visibleWhen,
    componentProps: options?.componentProps,
  };
}

export const layout = {
  field(input: BuiltField | FieldPath, options: LayoutFieldOptions = {}) {
    return {
      type: "field" as const,
      ref: resolveFieldPath(input),
      span: options.span,
    };
  },
  stack(id: string, children: LayoutNode[], options?: LayoutBaseOptions) {
    return withBase(
      {
        id,
        type: "stack" as const,
        children,
      },
      options,
    );
  },
  section(id: string, children: LayoutNode[], options?: LayoutBaseOptions) {
    return withBase(
      {
        id,
        type: "section" as const,
        children,
      },
      options,
    );
  },
  grid(id: string, options: GridLayoutOptions, children: Array<LayoutNode & { span?: number }>) {
    return withBase(
      {
        id,
        type: "grid" as const,
        columns: options.columns,
        children,
      },
      options,
    );
  },
  tabs(id: string, tabs: TabDefinition[], options?: LayoutBaseOptions) {
    return withBase(
      {
        id,
        type: "tabs" as const,
        tabs,
      },
      options,
    );
  },
  stepper(id: string, steps: StepDefinition[], options?: LayoutBaseOptions) {
    return withBase(
      {
        id,
        type: "stepper" as const,
        steps,
      },
      options,
    );
  },
  divider(id?: string, options?: LayoutBaseOptions) {
    return withBase(
      {
        id,
        type: "divider" as const,
      },
      options,
    );
  },
};
