import type { DataSourceDefinition } from "@formwright/contract";
import type { DataSourceLoadInput, DataSourceLoadResult, DataSourcePlugin } from "@formwright/core";

import { resolveTemplateObject, resolveTemplateValue, toDependsOnValues } from "../utils/template";

export interface RemoteDatasourcePluginFetchOptions {
  fetchImpl?: typeof fetch;
}

function buildRequest(
  source: Extract<DataSourceDefinition, { type: "remote" }>,
  input: DataSourceLoadInput,
): Request {
  const dependsOnValues = toDependsOnValues(source.dependsOn, input.dependsOnValues);
  const queryMap = source.queryMap ?? {};
  const query = new URLSearchParams();

  for (const [key, template] of Object.entries(queryMap)) {
    const resolved = resolveTemplateValue(template, dependsOnValues, "");
    query.set(key, String(resolved));
  }

  const url = new URL(source.endpoint, "http://localhost");
  for (const [key, value] of query.entries()) {
    url.searchParams.set(key, value);
  }

  const body =
    source.method === "POST" && source.bodyMap
      ? JSON.stringify(resolveTemplateObject(source.bodyMap, dependsOnValues))
      : undefined;

  return new Request(url.toString(), {
    method: source.method ?? "GET",
    headers:
      body !== undefined
        ? {
            "Content-Type": "application/json",
          }
        : undefined,
    body,
  });
}

export function createRemoteDataSourcePlugin(
  options: RemoteDatasourcePluginFetchOptions = {},
): DataSourcePlugin {
  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    kind: "datasource",
    identity: {
      name: "@formwright/plugins-async/datasource/remote",
      version: "0.0.0",
    },
    sourceType: "remote",
    async load(input: DataSourceLoadInput): Promise<DataSourceLoadResult> {
      const source = input.source as Extract<DataSourceDefinition, { type: "remote" }>;
      const request = buildRequest(source, input);
      const response = await fetchImpl(request);

      if (!response.ok) {
        throw new Error(`Failed to load remote datasource from ${source.endpoint}: ${response.status}`);
      }

      const data = (await response.json()) as unknown;
      if (Array.isArray(data)) {
        return { options: data as DataSourceLoadResult["options"] };
      }

      if (data && typeof data === "object" && "options" in data && Array.isArray((data as { options?: unknown }).options)) {
        return { options: (data as { options: DataSourceLoadResult["options"] }).options };
      }

      return {
        meta: {
          response: data,
        },
      };
    },
  };
}
