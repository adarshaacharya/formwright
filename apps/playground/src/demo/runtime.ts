import { createFormRuntime } from "@formwright/core";
import { basicSchema } from "../schemas/basic-schema";

export const demoRuntime = createFormRuntime({
  form: basicSchema,
});
