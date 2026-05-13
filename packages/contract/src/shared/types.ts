export type FormSchemaVersion = "1.0";

export type PrimitiveValueType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "date"
  | "datetime"
  | "file"
  | "json";

export type CompositeValueType = "object" | "array";

export type ValueType = PrimitiveValueType | CompositeValueType;

export type FieldPath = string;

export type FormMode = "create" | "edit" | "view";
