import type { DataFieldDefinition } from "@formwright/contract";
import type { RegisterOptions } from "react-hook-form";

function buildPatternRule(pattern: string): RegisterOptions["pattern"] {
  try {
    return {
      value: new RegExp(pattern),
      message: "Invalid format",
    };
  } catch {
    return undefined;
  }
}

export function toRHFValidationRules(
  field: DataFieldDefinition,
  required: boolean,
): RegisterOptions<Record<string, unknown>, string> {
  const rules: RegisterOptions<Record<string, unknown>, string> = {};
  const validators: NonNullable<RegisterOptions<Record<string, unknown>, string>["validate"]> = {};

  if (required) {
    rules.required = "This field is required";
  }

  if (field.valueType === "string") {
    if (field.minLength !== undefined) {
      rules.minLength = {
        value: field.minLength,
        message: `Minimum length is ${field.minLength}`,
      };
    }

    if (field.maxLength !== undefined) {
      rules.maxLength = {
        value: field.maxLength,
        message: `Maximum length is ${field.maxLength}`,
      };
    }

    if (field.pattern) {
      rules.pattern = buildPatternRule(field.pattern);
    }

    if (field.format === "email") {
      rules.pattern = {
        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: "Enter a valid email address",
      };
    }

    if (field.format === "url") {
      rules.pattern = {
        value: /^(https?:\/\/)[^\s/$.?#].[^\s]*$/i,
        message: "Enter a valid URL",
      };
    }

    if (field.format === "uuid") {
      rules.pattern = {
        value: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        message: "Enter a valid UUID",
      };
    }

    if (field.const !== undefined) {
      validators.const = (value: unknown) =>
        value === field.const || `Value must be exactly "${field.const}"`;
    }

    if (field.enum && field.enum.length > 0) {
      validators.enum = (value: unknown) =>
        field.enum!.includes(String(value)) || "Value must be one of allowed options";
    }
  }

  if (field.valueType === "number" || field.valueType === "integer") {
    if (field.minimum !== undefined) {
      rules.min = {
        value: field.minimum,
        message: `Minimum value is ${field.minimum}`,
      };
    }

    if (field.maximum !== undefined) {
      rules.max = {
        value: field.maximum,
        message: `Maximum value is ${field.maximum}`,
      };
    }

    if (field.const !== undefined) {
      validators.const = (value: unknown) =>
        Number(value) === field.const || `Value must be exactly ${field.const}`;
    }

    if (field.enum && field.enum.length > 0) {
      validators.enum = (value: unknown) =>
        field.enum!.includes(Number(value)) || "Value must be one of allowed options";
    }
  }

  if (field.valueType === "boolean" && field.const !== undefined) {
    validators.const = (value: unknown) =>
      value === field.const || `Value must be exactly ${String(field.const)}`;
  }

  if (Object.keys(validators).length > 0) {
    rules.validate = validators;
  }

  return rules;
}
