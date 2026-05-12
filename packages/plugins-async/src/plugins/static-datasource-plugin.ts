import type { DataSourceLoadInput, DataSourceLoadResult, DataSourcePlugin } from "@formwright/core";

export function createStaticDataSourcePlugin(): DataSourcePlugin {
  return {
    kind: "datasource",
    identity: {
      name: "@formwright/plugins-async/datasource/static",
      version: "0.0.0",
    },
    sourceType: "static",
    async load(input: DataSourceLoadInput): Promise<DataSourceLoadResult> {
      const source = input.source as { type: "static"; options: DataSourceLoadResult["options"] };
      return { options: source.options };
    },
  };
}
