import type { ArrayFieldDefinition, FieldPath } from "@formwright/contract";
import type { ResolvedFieldModel, ResolvedLayoutModel } from "@formwright/core";

import { useDatasourceOptions } from "../../hooks/use-datasource-options";
import { useFormArray } from "../../hooks/use-form-array";
import { useFormField } from "../../hooks/use-form-field";
import { useFormRuntime } from "../../hooks/use-form-runtime";
import { useRuntimeContext } from "../../provider/runtime-context";
import type { RuntimeAdapterContextValue } from "../../provider/runtime-context";
import type {
  ArrayFieldRendererComponent,
  FieldRendererComponent,
  LayoutRendererComponent,
  RenderArrayProps,
  RenderFieldProps,
  RenderLayoutProps,
} from "../../types/public-types";
import { DefaultArrayField } from "./default-array-field";
import { DefaultField } from "./default-field";

function DefaultLayout({ children }: RenderLayoutProps): React.JSX.Element {
  return <div style={{ display: "grid", gap: 16 }}>{children}</div>;
}

const FallbackLayoutRenderer: LayoutRendererComponent = (props) => <DefaultLayout {...props} />;

function getLayoutState(
  evaluation: RuntimeAdapterContextValue["evaluation"],
  layout: ResolvedLayoutModel,
) {
  return layout.id ? evaluation.layoutState[layout.id] : undefined;
}

function isArrayFieldDefinition(field: ResolvedFieldModel["dataField"]): field is ArrayFieldDefinition {
  return field.valueType === "array";
}

function FieldNode({
  path,
  fieldRendererMap,
  arrayFieldRendererMap,
}: {
  path: FieldPath;
  fieldRendererMap: Record<string, FieldRendererComponent>;
  arrayFieldRendererMap: Record<string, ArrayFieldRendererComponent>;
}): React.JSX.Element | null {
  const runtime = useFormRuntime();
  const resolvedField = runtime.getResolvedFields()[path];

  if (!resolvedField) {
    throw new Error(`Field not found in resolved model: ${path}`);
  }

  if (isArrayFieldDefinition(resolvedField.dataField)) {
    return (
      <ArrayFieldNode
        path={path}
        field={resolvedField}
        arrayFieldRendererMap={arrayFieldRendererMap}
      />
    );
  }

  return <ScalarFieldNode path={path} fieldRendererMap={fieldRendererMap} />;
}

function ScalarFieldNode({
  path,
  fieldRendererMap,
}: {
  path: FieldPath;
  fieldRendererMap: Record<string, FieldRendererComponent>;
}): React.JSX.Element | null {
  const { field: runtimeField, state, value, error, setValue, onBlur } = useFormField(path);
  const { loading, options } = useDatasourceOptions(path);
  const Renderer =
    fieldRendererMap[runtimeField.rendererKey] ?? fieldRendererMap[runtimeField.fieldType] ?? DefaultField;

  const props: RenderFieldProps = {
    path,
    field: runtimeField,
    state,
    value,
    error,
    onChange: setValue,
    onBlur,
    loading,
    options,
  };

  return <Renderer {...props} />;
}

function ArrayFieldNode({
  path,
  field,
  arrayFieldRendererMap,
}: {
  path: FieldPath;
  field: ResolvedFieldModel;
  arrayFieldRendererMap: Record<string, ArrayFieldRendererComponent>;
}): React.JSX.Element | null {
  const { evaluation } = useRuntimeContext();
  const arrayField = useFormArray(path);
  const arrayState = evaluation.fieldState[path] ?? {
    path,
    visible: true,
    disabled: false,
    readonly: false,
    required: false,
  };
  const Renderer =
    arrayFieldRendererMap[field.rendererKey] ?? arrayFieldRendererMap[field.fieldType] ?? DefaultArrayField;
  const itemSchema = isArrayFieldDefinition(field.dataField) ? field.dataField.itemSchema ?? undefined : undefined;
  const componentProps = (field.uiField?.componentProps ?? {}) as {
    itemLayout?: string[];
    itemFields?: Record<string, { label?: string; placeholder?: string; inputType?: string }>;
  };
  const itemLayout = componentProps.itemLayout ?? (itemSchema ? Object.keys(itemSchema) : undefined);

  const props: RenderArrayProps = {
    path,
    field,
    state: arrayState,
    items: arrayField.items,
    append: arrayField.append,
    remove: arrayField.remove,
    itemSchema,
    itemLayout,
    itemFieldMeta: componentProps.itemFields,
  };

  return <Renderer {...props} />;
}

function LayoutNode({
  node,
  fieldRendererMap,
  arrayFieldRendererMap,
  layoutRendererMap,
  nodeKey,
}: {
  node: ResolvedLayoutModel;
  fieldRendererMap: Record<string, FieldRendererComponent>;
  arrayFieldRendererMap: Record<string, ArrayFieldRendererComponent>;
  layoutRendererMap: Record<string, LayoutRendererComponent>;
  nodeKey: string;
}): React.JSX.Element | null {
  const { evaluation } = useRuntimeContext();
  const state = getLayoutState(evaluation, node);

  if (state && !state.visible) {
    return null;
  }

  if (node.type === "field" && node.fieldRef) {
    return (
      <FieldNode
        key={nodeKey}
        path={node.fieldRef}
        fieldRendererMap={fieldRendererMap}
        arrayFieldRendererMap={arrayFieldRendererMap}
      />
    );
  }

  const LayoutRenderer =
    layoutRendererMap[node.rendererKey] ?? layoutRendererMap[node.type] ?? FallbackLayoutRenderer;

  const children = (node.children ?? []).map((child, index) => (
    <LayoutNode
      key={`${nodeKey}-${index}`}
      node={child}
      nodeKey={`${nodeKey}-${index}`}
      fieldRendererMap={fieldRendererMap}
      arrayFieldRendererMap={arrayFieldRendererMap}
      layoutRendererMap={layoutRendererMap}
    />
  ));

  return (
    <LayoutRenderer layout={node} state={state}>
      {children}
    </LayoutRenderer>
  );
}

export function renderNode(
  node: ResolvedLayoutModel,
  key: string,
  fieldRendererMap: Record<string, FieldRendererComponent>,
  arrayFieldRendererMap: Record<string, ArrayFieldRendererComponent>,
  layoutRendererMap: Record<string, LayoutRendererComponent>,
): React.JSX.Element | null {
  return (
    <LayoutNode
      node={node}
      nodeKey={key}
      fieldRendererMap={fieldRendererMap}
      arrayFieldRendererMap={arrayFieldRendererMap}
      layoutRendererMap={layoutRendererMap}
    />
  );
}
