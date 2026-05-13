import type { FormPlugin } from "@formwright/core";

import { createRemoteDataSourcePlugin } from "../plugins/remote-datasource-plugin";
import { createStaticDataSourcePlugin } from "../plugins/static-datasource-plugin";

export function registerAsyncPlugins(): FormPlugin[] {
  return [createStaticDataSourcePlugin(), createRemoteDataSourcePlugin()];
}
