import { describe, expect, it } from "vitest";

import { loadRemoteForm } from "./load-remote-form";
import { RemoteSchemaValidationError } from "./errors";

function makeValidPayload() {
  return {
    version: "1.0",
    form: {
      version: "1.0",
      formId: "profile",
      dataSchema: {
        rootType: "object",
        fields: {
          name: { valueType: "string" },
        },
      },
      uiSchema: {
        nodes: {
          name: { fieldType: "text" },
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

describe("loadRemoteForm", () => {
  it("loads and parses payload", async () => {
    const payload = makeValidPayload();
    const fetcher: typeof fetch = async () =>
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    const result = await loadRemoteForm({
      url: "https://example.com/form",
      fetcher,
    });

    expect(result.form.formId).toBe("profile");
  });

  it("throws on non-2xx responses", async () => {
    const fetcher: typeof fetch = async () => new Response("boom", { status: 500 });

    await expect(
      loadRemoteForm({
        url: "https://example.com/form",
        fetcher,
      }),
    ).rejects.toThrow("Failed to load remote form (500)");
  });

  it("throws when payload is invalid", async () => {
    const fetcher: typeof fetch = async () =>
      new Response(JSON.stringify({ version: "1.0", form: { version: "1.0" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    await expect(
      loadRemoteForm({
        url: "https://example.com/form",
        fetcher,
      }),
    ).rejects.toBeInstanceOf(RemoteSchemaValidationError);
  });
});
