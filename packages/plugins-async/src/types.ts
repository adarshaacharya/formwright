import type { DataSourceDefinition, SelectOption } from "@formwright/contract";
import type { DataSourceLoadInput, DataSourceLoadResult, DataSourcePlugin } from "@formwright/core";

export interface RemoteSourceRequestBuilderResult {
  url: string;
  init?: RequestInit;
}

export interface RemoteDataSourcePluginOptions {
  sourceType?: string;
  identityName?: string;
  version?: string;
}

export type AsyncDataSourcePlugin = DataSourcePlugin;

export type { DataSourceDefinition, DataSourceLoadInput, DataSourceLoadResult, SelectOption };
