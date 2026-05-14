import { describe, expect, it, vi } from "vitest";
import { createRemoteDataSourcePlugin } from "./plugins/remote-datasource-plugin";

describe("remote datasource plugin", () => {
  it("loads options from array response and resolves query params", async () => {
    const fetchImpl = vi.fn(async (request: Request) => {
      const url = new URL(request.url);
      expect(url.pathname).toBe("/api/countries");
      expect(url.searchParams.get("region")).toBe("apac");
      return new Response(JSON.stringify([{ label: "Nepal", value: "NP" }]), { status: 200 });
    });

    const plugin = createRemoteDataSourcePlugin({ fetchImpl: fetchImpl as unknown as typeof fetch });

    const result = await plugin.load({
      source: {
        type: "remote",
        endpoint: "http://example.com/api/countries",
        method: "GET",
        dependsOn: ["region"],
        queryMap: { region: "{region}" },
      },
      dependsOnValues: { region: "apac" },
      context: {},
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(result.options).toEqual([{ label: "Nepal", value: "NP" }]);
  });

  it("throws on non-ok response", async () => {
    const plugin = createRemoteDataSourcePlugin({
      fetchImpl: (async () => new Response("bad", { status: 500 })) as unknown as typeof fetch,
    });

    await expect(
      plugin.load({
        source: { type: "remote", endpoint: "http://example.com/api/countries" },
        dependsOnValues: {},
        context: {},
      }),
    ).rejects.toThrow("Failed to load remote datasource");
  });
});
