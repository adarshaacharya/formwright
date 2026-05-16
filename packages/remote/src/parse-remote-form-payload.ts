import type { RemoteFormPayload } from "@formwright/contract";

import { RemoteSchemaValidationError, type RemoteSchemaIssue } from "./errors";
import { parseFormDefinition } from "./parse-form-definition";

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function parseRemoteFormPayload(input: unknown): RemoteFormPayload {
  const issues: RemoteSchemaIssue[] = [];

  if (!isObject(input)) {
    throw new RemoteSchemaValidationError([{ path: "payload", message: "Remote payload must be an object" }]);
  }

  if (input.version !== "1.0") {
    issues.push({ path: "payload.version", message: "Payload version must be 1.0" });
  }

  if (!("form" in input)) {
    issues.push({ path: "payload.form", message: "Payload must include form" });
  }

  if ("initialValues" in input && input.initialValues !== undefined && !isObject(input.initialValues)) {
    issues.push({ path: "payload.initialValues", message: "initialValues must be an object" });
  }

  if ("meta" in input && input.meta !== undefined && !isObject(input.meta)) {
    issues.push({ path: "payload.meta", message: "meta must be an object" });
  }

  if (issues.length > 0) {
    throw new RemoteSchemaValidationError(issues);
  }

  const form = parseFormDefinition(input.form);

  return {
    version: "1.0",
    form,
    initialValues: input.initialValues as Record<string, unknown> | undefined,
    meta: input.meta as RemoteFormPayload["meta"],
  };
}
