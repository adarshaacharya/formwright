import type { FieldPath, ValueType } from "../shared/types";

export interface DataSchema {
  rootType: "object";
  fields: Record<FieldPath, DataFieldDefinition>;
}

export interface ServerValidationConfig {
  rules?: string[];
}

export interface BaseDataFieldDefinition {
  valueType: ValueType;
  required?: boolean;
  default?: unknown;
  nullable?: boolean;
  readOnly?: boolean;
  serverValidation?: ServerValidationConfig;
}

export interface StringFieldDefinition extends BaseDataFieldDefinition {
  valueType: "string";
  enum?: string[];
  const?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: "email" | "url" | "uuid" | "phone" | "date" | "datetime";
}

export interface NumberFieldDefinition extends BaseDataFieldDefinition {
  valueType: "number" | "integer";
  enum?: number[];
  const?: number;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
}

export interface BooleanFieldDefinition extends BaseDataFieldDefinition {
  valueType: "boolean";
  const?: boolean;
}

export interface DateFieldDefinition extends BaseDataFieldDefinition {
  valueType: "date" | "datetime";
  minDate?: string;
  maxDate?: string;
}

export interface FileFieldDefinition extends BaseDataFieldDefinition {
  valueType: "file";
  accept?: string[];
  maxFiles?: number;
  maxSizeBytes?: number;
}

export interface JsonFieldDefinition extends BaseDataFieldDefinition {
  valueType: "json";
}

export interface ObjectFieldDefinition extends BaseDataFieldDefinition {
  valueType: "object";
}

export interface ArrayFieldDefinition extends BaseDataFieldDefinition {
  valueType: "array";
  itemType: Exclude<ValueType, "array">;
  itemSchema?: Record<string, DataFieldDefinition>;
  minItems?: number;
  maxItems?: number;
}

export type DataFieldDefinition =
  | StringFieldDefinition
  | NumberFieldDefinition
  | BooleanFieldDefinition
  | DateFieldDefinition
  | FileFieldDefinition
  | JsonFieldDefinition
  | ObjectFieldDefinition
  | ArrayFieldDefinition;
