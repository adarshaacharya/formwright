import type {
  ArrayFieldDefinition,
  DataFieldDefinition,
  FieldPath,
  SelectOption,
  UiFieldNode,
} from "@formwright/contract";
import type {
  ArrayItemDefinition,
  BuiltField,
  ObjectItemDefinition,
  ObjectItemFieldDefinition,
  PrimitiveItemDefinition,
  SelectOptions,
  SelectValue,
} from "./types";

interface CommonFieldOptions {
  label?: string;
  description?: string;
  helpText?: string;
  placeholder?: string;
  renderer?: string;
  componentProps?: Record<string, unknown>;
  wrapperProps?: Record<string, unknown>;
  styleTokens?: Record<string, string | number | boolean>;
  accessibility?: UiFieldNode["accessibility"];
}

interface StringFieldOptions extends CommonFieldOptions {
  required?: boolean;
  default?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

interface NumberFieldOptions extends CommonFieldOptions {
  required?: boolean;
  default?: number;
  minimum?: number;
  maximum?: number;
}

interface BooleanFieldOptions extends CommonFieldOptions {
  required?: boolean;
  default?: boolean;
}

interface SelectFieldOptions extends CommonFieldOptions {
  required?: boolean;
  default?: SelectValue;
  options?: SelectOptions;
  dataSource?: string;
}

interface ArrayFieldOptions extends CommonFieldOptions {
  label?: string;
  item: ArrayItemDefinition;
  minItems?: number;
  maxItems?: number;
}

function buildUiField(
  fieldType: string,
  options: CommonFieldOptions & {
    widget?: string;
    options?: SelectOption[];
    dataSource?: string;
  },
): UiFieldNode {
  return {
    fieldType,
    label: options.label,
    description: options.description,
    helpText: options.helpText,
    placeholder: options.placeholder,
    renderer: options.renderer,
    widget: options.widget,
    componentProps: options.componentProps,
    wrapperProps: options.wrapperProps,
    styleTokens: options.styleTokens,
    accessibility: options.accessibility,
    options: options.options,
    dataSource: options.dataSource,
  };
}

function buildField<Path extends FieldPath>(
  path: Path,
  data: DataFieldDefinition,
  ui: UiFieldNode,
): BuiltField<Path> {
  return { path, data, ui };
}

function inferSelectDataDefinition(options: SelectFieldOptions): DataFieldDefinition {
  const firstValue = options.options?.[0]?.value;

  if (typeof firstValue === "number") {
    return {
      valueType: "number",
      required: options.required,
      default: typeof options.default === "number" ? options.default : undefined,
      enum: options.options?.map((option) => Number(option.value)),
    };
  }

  if (typeof firstValue === "boolean") {
    return {
      valueType: "boolean",
      required: options.required,
      default: typeof options.default === "boolean" ? options.default : undefined,
    };
  }

  return {
    valueType: "string",
    required: options.required,
    default: typeof options.default === "string" ? options.default : undefined,
    enum: options.options?.map((option) => String(option.value)),
  };
}

function toItemFieldDefinition(input: ObjectItemFieldDefinition): DataFieldDefinition {
  return {
    valueType: input.valueType,
    default: input.default,
  } as DataFieldDefinition;
}

function toObjectArrayComponentProps(item: ObjectItemDefinition): Record<string, unknown> {
  const itemFields = Object.fromEntries(
    Object.entries(item.fields).map(([key, value]) => [
      key,
      {
        label: value.label,
        placeholder: value.placeholder,
        inputType: value.inputType,
      },
    ]),
  );

  return {
    itemLayout: item.itemLayout ?? Object.keys(item.fields),
    itemFields,
  };
}

function buildArrayFieldDefinition(item: ArrayItemDefinition, options: ArrayFieldOptions): ArrayFieldDefinition {
  if (item.kind === "object") {
    return {
      valueType: "array",
      itemType: "object",
      minItems: options.minItems,
      maxItems: options.maxItems,
      itemSchema: Object.fromEntries(
        Object.entries(item.fields).map(([key, definition]) => [key, toItemFieldDefinition(definition)]),
      ),
    };
  }

  return {
    valueType: "array",
    itemType: item.valueType,
    minItems: options.minItems,
    maxItems: options.maxItems,
    default: item.defaultValue !== undefined ? [item.defaultValue] : undefined,
  };
}

export const field = {
  text<Path extends FieldPath>(path: Path, options: StringFieldOptions = {}): BuiltField<Path> {
    return buildField(
      path,
      {
        valueType: "string",
        required: options.required,
        default: options.default,
        minLength: options.minLength,
        maxLength: options.maxLength,
        pattern: options.pattern,
      },
      buildUiField("text", options),
    );
  },
  textarea<Path extends FieldPath>(path: Path, options: StringFieldOptions = {}): BuiltField<Path> {
    return buildField(
      path,
      {
        valueType: "string",
        required: options.required,
        default: options.default,
        minLength: options.minLength,
        maxLength: options.maxLength,
        pattern: options.pattern,
      },
      buildUiField("text", { ...options, widget: "textarea" }),
    );
  },
  email<Path extends FieldPath>(path: Path, options: StringFieldOptions = {}): BuiltField<Path> {
    return buildField(
      path,
      {
        valueType: "string",
        required: options.required,
        default: options.default,
        format: "email",
      },
      buildUiField("email", options),
    );
  },
  url<Path extends FieldPath>(path: Path, options: StringFieldOptions = {}): BuiltField<Path> {
    return buildField(
      path,
      {
        valueType: "string",
        required: options.required,
        default: options.default,
        format: "url",
      },
      buildUiField("url", options),
    );
  },
  phone<Path extends FieldPath>(path: Path, options: StringFieldOptions = {}): BuiltField<Path> {
    return buildField(
      path,
      {
        valueType: "string",
        required: options.required,
        default: options.default,
        format: "phone",
      },
      buildUiField("phone", options),
    );
  },
  number<Path extends FieldPath>(path: Path, options: NumberFieldOptions = {}): BuiltField<Path> {
    return buildField(
      path,
      {
        valueType: "number",
        required: options.required,
        default: options.default,
        minimum: options.minimum,
        maximum: options.maximum,
      },
      buildUiField("number", options),
    );
  },
  integer<Path extends FieldPath>(path: Path, options: NumberFieldOptions = {}): BuiltField<Path> {
    return buildField(
      path,
      {
        valueType: "integer",
        required: options.required,
        default: options.default,
        minimum: options.minimum,
        maximum: options.maximum,
      },
      buildUiField("integer", options),
    );
  },
  checkbox<Path extends FieldPath>(path: Path, options: BooleanFieldOptions = {}): BuiltField<Path> {
    return buildField(
      path,
      {
        valueType: "boolean",
        required: options.required,
        default: options.default,
      },
      buildUiField("checkbox", options),
    );
  },
  select<Path extends FieldPath>(path: Path, options: SelectFieldOptions): BuiltField<Path> {
    return buildField(
      path,
      inferSelectDataDefinition(options),
      buildUiField("select", {
        ...options,
        options: options.options,
        dataSource: options.dataSource,
      }),
    );
  },
  date<Path extends FieldPath>(path: Path, options: CommonFieldOptions & { required?: boolean; default?: string } = {}): BuiltField<Path> {
    return buildField(
      path,
      {
        valueType: "date",
        required: options.required,
        default: options.default,
      },
      buildUiField("date", options),
    );
  },
  datetime<Path extends FieldPath>(path: Path, options: CommonFieldOptions & { required?: boolean; default?: string } = {}): BuiltField<Path> {
    return buildField(
      path,
      {
        valueType: "datetime",
        required: options.required,
        default: options.default,
      },
      buildUiField("datetime", options),
    );
  },
  array<Path extends FieldPath>(path: Path, options: ArrayFieldOptions): BuiltField<Path> {
    const componentProps =
      options.item.kind === "object"
        ? {
            ...(options.componentProps ?? {}),
            ...toObjectArrayComponentProps(options.item),
          }
        : options.componentProps;

    return buildField(
      path,
      buildArrayFieldDefinition(options.item, options),
      buildUiField("array", { ...options, componentProps }),
    );
  },
  objectArray<Path extends FieldPath>(
    path: Path,
    options: Omit<ArrayFieldOptions, "item"> & { item: Record<string, ObjectItemFieldDefinition>; itemLayout?: string[] },
  ): BuiltField<Path> {
    return field.array(path, {
      ...options,
      item: {
        kind: "object",
        fields: options.item,
        itemLayout: options.itemLayout,
      },
    });
  },
  stringItem(defaultValue?: string): PrimitiveItemDefinition {
    return { kind: "primitive", valueType: "string", defaultValue };
  },
  numberItem(defaultValue?: number): PrimitiveItemDefinition {
    return { kind: "primitive", valueType: "number", defaultValue };
  },
  booleanItem(defaultValue?: boolean): PrimitiveItemDefinition {
    return { kind: "primitive", valueType: "boolean", defaultValue };
  },
  textItem(options: Omit<ObjectItemFieldDefinition, "valueType"> = {}): ObjectItemFieldDefinition {
    return { valueType: "string", ...options };
  },
};
