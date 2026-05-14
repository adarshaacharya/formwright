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
  ArrayRendererSlots,
  FieldRendererComponent,
  FieldRendererSlots,
  LayoutRendererComponent,
  RenderArrayProps,
  RenderFieldProps,
  RenderLayoutProps,
} from "../../types/public-types";
import { DefaultArrayField } from "./default-array-field";
import { DefaultField } from "./default-field";
import { DefaultLayout } from "./default-layout";

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
  fieldSlots,
  arraySlots,
}: {
  path: FieldPath;
  fieldRendererMap: Record<string, FieldRendererComponent>;
  arrayFieldRendererMap: Record<string, ArrayFieldRendererComponent>;
  fieldSlots?: FieldRendererSlots;
  arraySlots?: ArrayRendererSlots;
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
        fieldRendererMap={fieldRendererMap}
        fieldSlots={fieldSlots}
        arrayFieldRendererMap={arrayFieldRendererMap}
        arraySlots={arraySlots}
      />
    );
  }

  return <ScalarFieldNode path={path} fieldRendererMap={fieldRendererMap} fieldSlots={fieldSlots} />;
}

function ScalarFieldNode({
  path,
  fieldRendererMap,
  fieldSlots,
}: {
  path: FieldPath;
  fieldRendererMap: Record<string, FieldRendererComponent>;
  fieldSlots?: FieldRendererSlots;
}): React.JSX.Element | null {
  const { field: runtimeField, state, value, error, setValue, onBlur } = useFormField(path);
  const { loading, options, error: datasourceError } = useDatasourceOptions(path);
  const Renderer =
    fieldRendererMap[runtimeField.rendererKey] ?? fieldRendererMap[runtimeField.fieldType] ?? DefaultField;

  const props: RenderFieldProps = {
    path,
    field: runtimeField,
    state,
    value,
    error: error ?? datasourceError,
    onChange: setValue,
    onBlur,
    loading,
    options,
    slots: fieldSlots,
  };

  return <Renderer {...props} />;
}

function ArrayFieldNode({
  path,
  field,
  fieldRendererMap,
  fieldSlots,
  arrayFieldRendererMap,
  arraySlots,
}: {
  path: FieldPath;
  field: ResolvedFieldModel;
  fieldRendererMap: Record<string, FieldRendererComponent>;
  fieldSlots?: FieldRendererSlots;
  arrayFieldRendererMap: Record<string, ArrayFieldRendererComponent>;
  arraySlots?: ArrayRendererSlots;
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
    itemType: arrayField.itemType,
    items: arrayField.items,
    append: arrayField.append,
    remove: arrayField.remove,
    itemSchema,
    itemLayout,
    itemFieldMeta: componentProps.itemFields,
    fieldRendererMap,
    fieldSlots,
    slots: arraySlots,
  };

  return <Renderer {...props} />;
}

function LayoutNode({
  node,
  fieldRendererMap,
  arrayFieldRendererMap,
  layoutRendererMap,
  fieldSlots,
  arraySlots,
  nodeKey,
}: {
  node: ResolvedLayoutModel;
  fieldRendererMap: Record<string, FieldRendererComponent>;
  arrayFieldRendererMap: Record<string, ArrayFieldRendererComponent>;
  layoutRendererMap: Record<string, LayoutRendererComponent>;
  fieldSlots?: FieldRendererSlots;
  arraySlots?: ArrayRendererSlots;
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
        fieldSlots={fieldSlots}
        arraySlots={arraySlots}
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
        fieldSlots={fieldSlots}
        arraySlots={arraySlots}
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
  fieldSlots?: FieldRendererSlots,
  arraySlots?: ArrayRendererSlots,
): React.JSX.Element | null {
  return (
    <LayoutNode
      node={node}
      nodeKey={key}
      fieldRendererMap={fieldRendererMap}
      arrayFieldRendererMap={arrayFieldRendererMap}
      layoutRendererMap={layoutRendererMap}
      fieldSlots={fieldSlots}
      arraySlots={arraySlots}
    />
  );
}
