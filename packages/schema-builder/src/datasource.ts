import type { BuiltDataSource } from "./types";
import type { DataSourceDefinition, SelectOption } from "@formwright/contract";

export const datasource = {
  static(name: string, options: SelectOption[]): BuiltDataSource {
    return {
      name,
      definition: {
        type: "static",
        options,
      },
    };
  },
  remote(
    name: string,
    definition: Omit<Extract<DataSourceDefinition, { type: "remote" }>, "type">,
  ): BuiltDataSource {
    return {
      name,
      definition: {
        type: "remote",
        ...definition,
      },
    };
  },
};
