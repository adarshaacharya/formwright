import { describe, expect, it } from "vitest";

import { RemoteSchemaValidationError } from "./errors";
import { parseRemoteFormPayload } from "./parse-remote-form-payload";

function makeValidPayload() {
  return {
    version: "1.0" as const,
    form: {
      version: "1.0" as const,
      formId: "profile",
      dataSchema: {
        rootType: "object",
        fields: {
          name: { valueType: "string", required: true },
        },
      },
      uiSchema: {
        nodes: {
          name: { fieldType: "text", label: "Name" },
        },
        layout: {
          type: "stack",
          id: "root",
          children: [{ type: "field", ref: "name" }],
        },
      },
    },
  };
}

describe("parseRemoteFormPayload", () => {
  it("parses a valid remote payload", () => {
    const parsed = parseRemoteFormPayload(makeValidPayload());

    expect(parsed.version).toBe("1.0");
    expect(parsed.form.formId).toBe("profile");
  });

  it("throws when layout references an unknown field", () => {
    const payload = makeValidPayload();
    payload.form.uiSchema.layout = {
      type: "stack",
      id: "root",
      children: [{ type: "field", ref: "missingField" }],
    };

    expect(() => parseRemoteFormPayload(payload)).toThrow(RemoteSchemaValidationError);
  });

  it("throws when payload version is invalid", () => {
    const payload = {
      ...makeValidPayload(),
      version: "2.0",
    };

    expect(() => parseRemoteFormPayload(payload)).toThrow(RemoteSchemaValidationError);
  });
});
