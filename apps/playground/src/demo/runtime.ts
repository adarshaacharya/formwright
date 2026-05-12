import { createFormRuntime } from "@formwright/core";
import { registerAsyncPlugins } from "@formwright/plugins-async";
import { registerBasicPlugins } from "@formwright/plugins-basic";
import { basicSchema } from "../schemas/basic-schema";

export const demoRuntime = createFormRuntime({
  form: basicSchema,
  plugins: [...registerBasicPlugins(), ...registerAsyncPlugins()],
});
