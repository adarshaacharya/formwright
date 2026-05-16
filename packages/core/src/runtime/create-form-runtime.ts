import type {
  ArrayFieldDefinition,
  DataSourceDefinition,
  DataFieldDefinition,
  FieldPath,
  FormDefinition,
  LayoutNode,
  RuleExpression,
  SelectOption,
  UiFieldNode,
} from "@formwright/contract";
import { createPluginRegistry } from "../plugins/types";
import type { ResolvedFieldModel, ResolvedLayoutModel } from "../resolved/types";
import type {
  CreateFormRuntimeInput,
  EffectApplyInput,
  FormRuntime,
  LifecycleStage,
  LifecycleActionResult,
  LifecycleExecutionResult,
  OperatorEvaluateInput,
} from "./types";
import type { DerivedFieldState, DerivedLayoutState, RuntimeEvaluationResult } from "./types";
import type { ValidationPlanItem } from "../validation/types";

function normalizeFieldModel(
  path: FieldPath,
  dataField: DataFieldDefinition,
  initialUiField: UiFieldNode | undefined,
  pluginRegistry: ReturnType<typeof createPluginRegistry>,
  runtimeContext: CreateFormRuntimeInput["context"],
): ResolvedFieldModel {
  const initialFieldType = initialUiField?.fieldType ?? dataField.valueType;
  const fieldPlugin = pluginRegistry.findField(initialFieldType);
  const normalized = fieldPlugin?.normalize
    ? fieldPlugin.normalize({
        path,
        dataField,
        uiField: initialUiField,
        context: runtimeContext ?? {},
      })
    : undefined;
  const normalizedDataField = normalized?.normalizedDataField ?? dataField;
  const normalizedUiField = normalized?.normalizedUiField ?? initialUiField;
  const fieldType = normalized?.fieldType ?? normalizedUiField?.fieldType ?? normalizedDataField.valueType;
  const rendererKey =
    normalizedUiField?.renderer ??
    fieldPlugin?.getRendererKey?.({
      path,
      uiField: normalizedUiField,
      context: runtimeContext ?? {},
    }) ??
    fieldType;

  return {
    path,
    fieldType,
    valueType: normalizedDataField.valueType,
    rendererKey,
    dataField: normalizedDataField,
    uiField: normalizedUiField,
  };
}

function normalizeFields(
  form: FormDefinition,
  pluginRegistry: ReturnType<typeof createPluginRegistry>,
  runtimeContext: CreateFormRuntimeInput["context"],
): Record<FieldPath, ResolvedFieldModel> {
  const resolved: Record<FieldPath, ResolvedFieldModel> = {};
  for (const [path, dataField] of Object.entries(form.dataSchema.fields)) {
    resolved[path] = normalizeFieldModel(path, dataField, form.uiSchema.nodes[path], pluginRegistry, runtimeContext);
  }
  return resolved;
}

function isObjectArrayField(fieldModel: ResolvedFieldModel | undefined): fieldModel is ResolvedFieldModel & {
  dataField: ArrayFieldDefinition;
} {
  return fieldModel?.dataField.valueType === "array" && fieldModel.dataField.itemType === "object";
}

function isArrayField(fieldModel: ResolvedFieldModel | undefined): fieldModel is ResolvedFieldModel & {
  dataField: ArrayFieldDefinition;
} {
  return fieldModel?.dataField.valueType === "array";
}

function toPrimitiveArrayItemUiField(itemType: ArrayFieldDefinition["itemType"]): UiFieldNode {
  return {
    fieldType: itemType === "boolean" ? "checkbox" : itemType,
  };
}

function resolveNestedArrayField(
  path: FieldPath,
  resolvedFields: Record<FieldPath, ResolvedFieldModel>,
  pluginRegistry: ReturnType<typeof createPluginRegistry>,
  runtimeContext: CreateFormRuntimeInput["context"],
): ResolvedFieldModel | undefined {
  const segments = path.split(".");

  for (let index = 0; index < segments.length; index += 1) {
    if (!/^\d+$/.test(segments[index])) {
      continue;
    }

    const parentPath = segments.slice(0, index).join(".") as FieldPath;
    const parentField = resolvedFields[parentPath];
    if (!isArrayField(parentField)) {
      return undefined;
    }

    const itemPathSegments = segments.slice(index + 1);
    const itemKey = itemPathSegments.join(".");

    if (!itemKey) {
      if (parentField.dataField.itemType === "object") {
        return undefined;
      }

      const primitiveUiField = toPrimitiveArrayItemUiField(parentField.dataField.itemType);
      const resolvedPrimitiveField = normalizeFieldModel(
        path,
        {
          valueType: parentField.dataField.itemType,
          required: parentField.dataField.required,
          readOnly: parentField.dataField.readOnly,
        } as DataFieldDefinition,
        primitiveUiField,
        pluginRegistry,
        runtimeContext,
      );
      return {
        ...resolvedPrimitiveField,
        parentPath,
        templatePath: `${parentPath}.*` as FieldPath,
        isCollectionItem: true,
      };
    }

    if (!isObjectArrayField(parentField)) {
      return undefined;
    }

    const itemDataField = parentField.dataField.itemSchema?.[itemKey];
    if (!itemDataField) {
      return undefined;
    }

    const componentProps = (parentField.uiField?.componentProps ?? {}) as {
      itemFields?: Record<string, { label?: string; description?: string; helpText?: string; placeholder?: string; inputType?: string }>;
    };
    const itemMeta = componentProps.itemFields?.[itemKey];
    const itemUiField: UiFieldNode = {
      fieldType: itemMeta?.inputType ?? itemDataField.valueType,
      label: itemMeta?.label,
      description: itemMeta?.description,
      helpText: itemMeta?.helpText,
      placeholder: itemMeta?.placeholder,
      widget: itemMeta?.inputType,
    };
    const resolvedItemField = normalizeFieldModel(path, itemDataField, itemUiField, pluginRegistry, runtimeContext);
    return {
      ...resolvedItemField,
      parentPath,
      templatePath: `${parentPath}.*.${itemKey}` as FieldPath,
      isCollectionItem: true,
    };
  }

  return undefined;
}

function normalizeLayout(
  node: LayoutNode,
  pluginRegistry: ReturnType<typeof createPluginRegistry>,
  runtimeContext: CreateFormRuntimeInput["context"],
): LayoutNode {
  const layoutPlugin = pluginRegistry.findLayout(node.type);
  if (!layoutPlugin) return node;

  const normalized = layoutPlugin.normalize?.({
    node,
    context: runtimeContext ?? {},
  }) ?? node;
  layoutPlugin.validate?.({
    node: normalized,
    context: runtimeContext ?? {},
  });
  return normalized;
}

function toResolvedLayout(
  node: LayoutNode,
  pluginRegistry: ReturnType<typeof createPluginRegistry>,
  runtimeContext: CreateFormRuntimeInput["context"],
): ResolvedLayoutModel {
  const normalizedNode = normalizeLayout(node, pluginRegistry, runtimeContext);
  const layoutPlugin = pluginRegistry.findLayout(normalizedNode.type);
  const rendererKey = layoutPlugin?.getRendererKey?.({
    node: normalizedNode,
    context: runtimeContext ?? {},
  }) ?? normalizedNode.type;

  if (normalizedNode.type === "field") {
    return {
      id: normalizedNode.id,
      type: normalizedNode.type,
      rendererKey,
      fieldRef: normalizedNode.ref,
      node: normalizedNode,
    };
  }

  const children =
    "children" in normalizedNode
      ? normalizedNode.children.map((child) => toResolvedLayout(child, pluginRegistry, runtimeContext))
      : "tabs" in normalizedNode
      ? normalizedNode.tabs.flatMap((tab) =>
          tab.children.map((child) => toResolvedLayout(child, pluginRegistry, runtimeContext)),
        )
      : "steps" in normalizedNode
      ? normalizedNode.steps.flatMap((step) =>
          step.children.map((child) => toResolvedLayout(child, pluginRegistry, runtimeContext)),
        )
      : undefined;

  return {
    id: normalizedNode.id,
    type: normalizedNode.type,
    rendererKey,
    children,
    node: normalizedNode,
  };
}

function getInitialValues(
  resolvedFields: Record<FieldPath, ResolvedFieldModel>,
  pluginRegistry: ReturnType<typeof createPluginRegistry>,
  runtimeContext: CreateFormRuntimeInput["context"],
): Record<FieldPath, unknown> {
  const values: Record<FieldPath, unknown> = {};
  for (const [path, fieldModel] of Object.entries(resolvedFields)) {
    const plugin = pluginRegistry.findField(fieldModel.fieldType);
    const pluginDefault = plugin?.getDefaultValue?.({
      path,
      dataField: fieldModel.dataField,
      uiField: fieldModel.uiField,
      context: runtimeContext ?? {},
    });
    values[path] = pluginDefault ?? fieldModel.dataField.default;
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

function getInitialFieldOptions(
  resolvedFields: Record<FieldPath, ResolvedFieldModel>,
): Record<FieldPath, SelectOption[] | undefined> {
  const fieldOptions: Record<FieldPath, SelectOption[] | undefined> = {};
  for (const [path, fieldModel] of Object.entries(resolvedFields)) {
    fieldOptions[path] = fieldModel.uiField?.options;
  }
  return fieldOptions;
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

function applyLayoutVisibilityFromNode(
  node: LayoutNode,
  values: Record<string, unknown>,
  context: Record<string, unknown>,
  layoutState: Record<string, DerivedLayoutState>,
  parentVisible = true,
): void {
  const ownVisible =
    "visibleWhen" in node && node.visibleWhen ? Boolean(evalExpr(node.visibleWhen, values, context)) : true;
  const visible = parentVisible && ownVisible;

  if (node.id && layoutState[node.id]) {
    layoutState[node.id].visible = visible;
  }

  if ("children" in node) {
    for (const child of node.children) {
      applyLayoutVisibilityFromNode(child, values, context, layoutState, visible);
    }
  }
  if ("tabs" in node) {
    for (const tab of node.tabs) {
      for (const child of tab.children) {
        applyLayoutVisibilityFromNode(child, values, context, layoutState, visible);
      }
    }
  }
  if ("steps" in node) {
    for (const step of node.steps) {
      for (const child of step.children) {
        applyLayoutVisibilityFromNode(child, values, context, layoutState, visible);
      }
    }
  }
}

function collectDependenciesFromUnknown(expression: unknown, dependencies: Set<FieldPath>): void {
  if (Array.isArray(expression)) {
    for (const item of expression) collectDependenciesFromUnknown(item, dependencies);
    return;
  }

  if (!expression || typeof expression !== "object") {
    return;
  }

  const record = expression as Record<string, unknown>;

  if (typeof record.var === "string") {
    if (!record.var.startsWith("$")) dependencies.add(record.var as FieldPath);
    return;
  }

  if (typeof record.exists === "string") {
    dependencies.add(record.exists as FieldPath);
    return;
  }

  if (typeof record.concat !== "undefined") {
    collectDependenciesFromUnknown(record.concat, dependencies);
    return;
  }

  for (const value of Object.values(record)) {
    collectDependenciesFromUnknown(value, dependencies);
  }
}

function collectLayoutDependencies(node: LayoutNode, dependencies: Set<FieldPath>): void {
  if ("visibleWhen" in node && node.visibleWhen) {
    collectDependenciesFromUnknown(node.visibleWhen, dependencies);
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
    collectDependenciesFromUnknown(rule.when, dependencies);
  }

  for (const computed of form.behaviorSchema?.computed ?? []) {
    for (const path of computed.runOn) dependencies.add(path);
    collectDependenciesFromUnknown(computed.expression, dependencies);
  }

  for (const source of Object.values(form.behaviorSchema?.dataSources ?? {})) {
    if (source.type === "remote") {
      for (const dep of source.dependsOn ?? []) dependencies.add(dep as FieldPath);
    }
  }

  collectLayoutDependencies(form.uiSchema.layout, dependencies);

  return [...dependencies];
}

function getPathValue(values: Record<string, unknown>, path: FieldPath): unknown {
  if (path in values) {
    return values[path];
  }

  const segments = path.split(".");
  let current: unknown = values;
  for (const segment of segments) {
    if (current === null || typeof current !== "object") {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

function setPathValue(values: Record<string, unknown>, path: FieldPath, value: unknown): void {
  if (path in values) {
    values[path] = value;
    return;
  }

  const segments = path.split(".");
  let current: unknown = values;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    if (current === null || typeof current !== "object") {
      values[path] = value;
      return;
    }

    const container = current as Record<string, unknown>;
    const nextSegment = segments[index + 1];
    const existing = container[segment];
    if (existing === undefined) {
      container[segment] = /^\d+$/.test(nextSegment) ? [] : {};
    }
    current = container[segment];
  }

  if (current === null || typeof current !== "object") {
    values[path] = value;
    return;
  }

  (current as Record<string, unknown>)[segments[segments.length - 1]] = value;
}

function collectConcreteArrayItemPaths(
  values: Record<string, unknown>,
  resolvedFields: Record<FieldPath, ResolvedFieldModel>,
): FieldPath[] {
  const paths: FieldPath[] = [];

  for (const [path, fieldModel] of Object.entries(resolvedFields)) {
    if (!isArrayField(fieldModel)) {
      continue;
    }

    const arrayValue = getPathValue(values, path as FieldPath);
    if (!Array.isArray(arrayValue)) {
      continue;
    }

    for (let index = 0; index < arrayValue.length; index += 1) {
      if (fieldModel.dataField.itemType === "object") {
        for (const itemKey of Object.keys(fieldModel.dataField.itemSchema ?? {})) {
          paths.push(`${path}.${index}.${itemKey}` as FieldPath);
        }
        continue;
      }

      paths.push(`${path}.${index}` as FieldPath);
    }
  }

  return paths;
}

function collectRuntimeFieldPaths(
  values: Record<string, unknown>,
  resolvedFields: Record<FieldPath, ResolvedFieldModel>,
): FieldPath[] {
  return [...(Object.keys(resolvedFields) as FieldPath[]), ...collectConcreteArrayItemPaths(values, resolvedFields)];
}

function seedConcreteArrayItemState(
  values: Record<string, unknown>,
  resolvedFields: Record<FieldPath, ResolvedFieldModel>,
  resolveField: (path: FieldPath) => ResolvedFieldModel | undefined,
  fieldState: Record<FieldPath, DerivedFieldState>,
  fieldOptions: Record<FieldPath, SelectOption[] | undefined>,
): void {
  for (const path of collectConcreteArrayItemPaths(values, resolvedFields)) {
    const resolvedField = resolveField(path);
    if (!resolvedField) {
      continue;
    }

    const parentState = resolvedField.parentPath ? fieldState[resolvedField.parentPath] : undefined;
    fieldState[path] = parentState
      ? { ...parentState, path }
      : {
          path,
          visible: true,
          disabled: Boolean(resolvedField.dataField.readOnly),
          readonly: Boolean(resolvedField.dataField.readOnly),
          required: Boolean(resolvedField.dataField.required),
        };
    fieldOptions[path] = resolvedField.uiField?.options;
  }
}

function expandFieldTargetPaths(
  target: FieldPath,
  fieldState: Record<FieldPath, DerivedFieldState>,
): FieldPath[] {
  if (target === "*") {
    return Object.keys(fieldState) as FieldPath[];
  }

  if (!target.includes("*")) {
    return [target];
  }

  const escaped = target.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^.]+");
  const pattern = new RegExp(`^${escaped}$`);
  return (Object.keys(fieldState) as FieldPath[]).filter((path) => pattern.test(path));
}

function resolveExpressionValue(
  expression: unknown,
  values: Record<string, unknown>,
  context: Record<string, unknown>,
): unknown {
  if (Array.isArray(expression)) {
    return expression.map((item) => resolveExpressionValue(item, values, context));
  }

  if (!expression || typeof expression !== "object") {
    return expression;
  }

  const record = expression as Record<string, unknown>;

  if (typeof record.var === "string") {
    if (record.var.startsWith("$")) {
      return context[record.var.slice(1)];
    }
    return getPathValue(values, record.var as FieldPath);
  }
  if (Array.isArray(record.eq) && record.eq.length === 2) {
    return resolveExpressionValue(record.eq[0], values, context) === record.eq[1];
  }
  if (Array.isArray(record.neq) && record.neq.length === 2) {
    return resolveExpressionValue(record.neq[0], values, context) !== record.neq[1];
  }
  if (Array.isArray(record.and)) {
    return record.and.every((node) => Boolean(resolveExpressionValue(node, values, context)));
  }
  if (Array.isArray(record.or)) {
    return record.or.some((node) => Boolean(resolveExpressionValue(node, values, context)));
  }
  if (typeof record.not !== "undefined") {
    return !Boolean(resolveExpressionValue(record.not, values, context));
  }
  if (typeof record.exists === "string") {
    const value = getPathValue(values, record.exists as FieldPath);
    return value !== undefined && value !== null;
  }
  if (Array.isArray(record.gt) && record.gt.length === 2) {
    return Number(resolveExpressionValue(record.gt[0], values, context)) > Number(record.gt[1]);
  }
  if (Array.isArray(record.gte) && record.gte.length === 2) {
    return Number(resolveExpressionValue(record.gte[0], values, context)) >= Number(record.gte[1]);
  }
  if (Array.isArray(record.lt) && record.lt.length === 2) {
    return Number(resolveExpressionValue(record.lt[0], values, context)) < Number(record.lt[1]);
  }
  if (Array.isArray(record.lte) && record.lte.length === 2) {
    return Number(resolveExpressionValue(record.lte[0], values, context)) <= Number(record.lte[1]);
  }
  if (Array.isArray(record.in) && record.in.length === 2 && Array.isArray(record.in[1])) {
    return record.in[1].includes(resolveExpressionValue(record.in[0], values, context));
  }
  if (Array.isArray(record.concat)) {
    return record.concat.map((part) => resolveExpressionValue(part, values, context)).join("");
  }

  const resolvedObject: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    resolvedObject[key] = resolveExpressionValue(value, values, context);
  }
  return resolvedObject;
}

function evalExpr(
  expr: RuleExpression,
  values: Record<string, unknown>,
  context: Record<string, unknown>,
): boolean {
  return Boolean(resolveExpressionValue(expr, values, context));
}

function applyComputedValues(
  form: FormDefinition,
  values: Record<string, unknown>,
  context: Record<string, unknown>,
  pushValueMutation: (path: FieldPath, value: unknown) => void,
): void {
  for (const computed of form.behaviorSchema?.computed ?? []) {
    const nextValue = resolveExpressionValue(computed.expression, values, context);
    if (values[computed.target] !== nextValue) {
      pushValueMutation(computed.target, nextValue);
    }
  }
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
  fieldOptions: Record<FieldPath, SelectOption[] | undefined>,
): void {
  const isWildcardTarget = effect.target === "*";
  const targetFieldPaths = expandFieldTargetPaths(effect.target, fieldState);
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
    for (const path of targetFieldPaths) {
      setPathValue(values, path, effect.value);
    }
  }
  if (effect.type === "clearValue") {
    if (isWildcardTarget) {
      for (const key of Object.keys(values)) values[key] = undefined;
    } else {
      for (const path of targetFieldPaths) {
        setPathValue(values, path, undefined);
      }
    }
  }
  if (effect.type === "setLayoutProp" && effect.prop === "visible") {
    for (const id of targetLayoutIds) {
      if (layoutState[id]) layoutState[id].visible = Boolean(effect.value);
    }
  }
  if (effect.type === "setOptions") {
    for (const path of targetFieldPaths) {
      if (fieldState[path]) fieldOptions[path] = effect.value;
    }
  }
}

function getLifecycleActions(form: FormDefinition, stage: LifecycleStage) {
  return form.behaviorSchema?.lifecycle?.[stage] ?? [];
}

function buildDependsOnValues(
  source: DataSourceDefinition,
  values: Record<string, unknown>,
): Record<string, unknown> {
  const dependsOnValues: Record<string, unknown> = {};
  const dependsOn = "dependsOn" in source ? source.dependsOn : undefined;
  for (const path of dependsOn ?? []) {
    dependsOnValues[path] = getPathValue(values, path as FieldPath);
  }
  return dependsOnValues;
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
  const pluginRegistry = createPluginRegistry();
  pluginRegistry.registerMany(input.plugins ?? []);
  const resolvedFields = normalizeFields(form, pluginRegistry, runtimeContext);
  const resolvedLayout = toResolvedLayout(form.uiSchema.layout, pluginRegistry, runtimeContext);
  const evaluationDependencies = collectBehaviorDependencies(form);
  const initialValues = getInitialValues(resolvedFields, pluginRegistry, runtimeContext);
  const initialFieldOptions = getInitialFieldOptions(resolvedFields);
  const resolveField = (path: FieldPath) =>
    resolvedFields[path] ?? resolveNestedArrayField(path, resolvedFields, pluginRegistry, runtimeContext);

  const getFieldPluginForPath = (path: FieldPath) => {
    const model = resolveField(path);
    if (!model) return undefined;
    return pluginRegistry.findField(model.fieldType);
  };

  const runtime: FormRuntime = {
    getFormDefinition() {
      return form;
    },
    getResolvedFields() {
      return resolvedFields;
    },
    resolveField(path: FieldPath) {
      return resolveField(path);
    },
    getResolvedLayout() {
      return resolvedLayout;
    },
    getLifecycleDefinition() {
      return form.behaviorSchema?.lifecycle;
    },
    getLifecycleActions(stage: LifecycleStage) {
      return getLifecycleActions(form, stage);
    },
    async runLifecycle(stage: LifecycleStage, runtimeValues?: Record<string, unknown>): Promise<LifecycleExecutionResult> {
      const evaluation = runtime.evaluate(runtimeValues);
      const values = evaluation.values;
      const actions = getLifecycleActions(form, stage);
      const results: LifecycleActionResult[] = [];
      let hasBlockingValidationFailure = false;

      for (const action of actions) {
        if (action.type === "fetchDataSource") {
          const source = form.behaviorSchema?.dataSources?.[action.target];
          if (!source) {
            results.push({ action, status: "skipped" });
            continue;
          }

          const plugin = pluginRegistry.findDataSource(source.type);
          if (!plugin) {
            results.push({ action, status: "unsupported" });
            continue;
          }

          const loaded = await plugin.load({
            source,
            dependsOnValues: buildDependsOnValues(source, values),
            context: runtimeContext,
          });

          results.push({
            action,
            status: "completed",
            dataSource: {
              target: action.target,
              options: loaded.options,
              meta: loaded.meta,
            },
          });
          continue;
        }

        if (action.type === "validateServerRules") {
          const validationEntries: NonNullable<LifecycleActionResult["validation"]> = [];
          let unsupported = false;

          for (const path of collectRuntimeFieldPaths(values, resolvedFields)) {
            const fieldModel = runtime.resolveField(path);
            if (!fieldModel) continue;
            const fieldPlan = runtime.getFieldValidationPlan(path);
            if (fieldPlan.length === 0) continue;

            for (const item of fieldPlan) {
              const validator = pluginRegistry.findValidator(item.validatorType);
              if (!validator) {
                unsupported = true;
                validationEntries.push({
                  path,
                  valid: false,
                  code: "unsupported-validator",
                  message: `Unsupported validator: ${item.validatorType}`,
                });
                continue;
              }

              const result = validator.validate({
                path,
                value: getPathValue(values, path),
                dataField: fieldModel.dataField,
                uiField: fieldModel.uiField,
                values,
                context: runtimeContext,
              });

              validationEntries.push({
                path,
                valid: result.valid,
                code: result.code,
                message: result.message,
                meta: result.meta,
              });
            }
          }

          results.push({
            action,
            status: unsupported ? "unsupported" : "completed",
            validation: validationEntries,
          });
          if (validationEntries.some((entry) => entry.valid === false)) {
            hasBlockingValidationFailure = true;
          }
          continue;
        }

        if (action.type === "submitTo") {
          if (hasBlockingValidationFailure) {
            results.push({
              action,
              status: "skipped",
              submission: {
                target: action.target,
                values,
              },
            });
            continue;
          }

          results.push({
            action,
            status: "completed",
            submission: {
              target: action.target,
              values,
            },
          });
        }
      }

      return { stage, actions: results };
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
    getFieldValidationPlan(path: FieldPath): ValidationPlanItem[] {
      const model = resolveField(path);
      if (!model) return [];
      const plugin = getFieldPluginForPath(path);
      const pluginPlan = plugin?.getValidationPlan?.({
        path,
        dataField: model.dataField,
        uiField: model.uiField,
        context: runtimeContext ?? {},
      }) ?? [];
      const serverPlan = (model.dataField.serverValidation?.rules ?? []).map((validatorType) => ({
        validatorType,
      }));
      return [...serverPlan, ...pluginPlan];
    },
    serializeFieldValue(path: FieldPath, value: unknown): unknown {
      const plugin = getFieldPluginForPath(path);
      if (!plugin?.serialize) return value;
      return plugin.serialize({
        path,
        value,
        context: runtimeContext ?? {},
      });
    },
    deserializeFieldValue(path: FieldPath, value: unknown): unknown {
      const plugin = getFieldPluginForPath(path);
      if (!plugin?.deserialize) return value;
      return plugin.deserialize({
        path,
        value,
        context: runtimeContext ?? {},
      });
    },
    evaluate(runtimeValues): RuntimeEvaluationResult {
      const layoutState: Record<string, DerivedLayoutState> = {};
      collectLayoutState(form.uiSchema.layout, layoutState);
      const fieldState = getInitialFieldState(form);
      const values = { ...initialValues, ...(runtimeValues ?? {}) };
      const fieldOptions = { ...initialFieldOptions };
      const valueMutations: Array<{ path: FieldPath; value: unknown }> = [];

      const pushValueMutation = (path: FieldPath, value: unknown) => {
        valueMutations.push({ path, value });
        setPathValue(values, path, value);
      };

      seedConcreteArrayItemState(values, resolvedFields, resolveField, fieldState, fieldOptions);

      applyComputedValues(form, values, runtimeContext as Record<string, unknown>, pushValueMutation);

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
            for (const path of expandFieldTargetPaths(effect.target, fieldState)) {
              pushValueMutation(path, effect.value);
            }
            continue;
          }
          if (effect.type === "clearValue") {
            if (effect.target === "*") {
              for (const key of Object.keys(values)) pushValueMutation(key, undefined);
            } else {
              for (const path of expandFieldTargetPaths(effect.target, fieldState)) {
                pushValueMutation(path, undefined);
              }
            }
            continue;
          }

          applyBuiltInEffect(effect, fieldState, layoutState, values, fieldOptions);
        }
      }

      applyComputedValues(form, values, runtimeContext as Record<string, unknown>, pushValueMutation);
      applyLayoutVisibilityFromNode(
        form.uiSchema.layout,
        values,
        runtimeContext as Record<string, unknown>,
        layoutState,
      );

      return {
        fieldState,
        layoutState,
        values,
        fieldOptions,
        valueMutations,
      };
    },
  };

  return runtime;
}
