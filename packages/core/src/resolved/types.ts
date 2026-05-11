import type { DataFieldDefinition, FieldPath, LayoutNode, UiFieldNode } from "@formwright/contract";

import type { DerivedFieldState, DerivedLayoutState } from "../runtime/types";

export interface ResolvedFieldModel {
  path: FieldPath;
  fieldType: string;
  valueType: string;
  rendererKey: string;
  dataField: DataFieldDefinition;
  uiField?: UiFieldNode;
}

export interface ResolvedLayoutModel {
  id?: string;
  type: string;
  rendererKey: string;
  children?: ResolvedLayoutModel[];
  fieldRef?: FieldPath;
  node: LayoutNode;
}

export interface DerivedStateSnapshot {
  fields: Record<FieldPath, DerivedFieldState>;
  layouts: Record<string, DerivedLayoutState>;
}
