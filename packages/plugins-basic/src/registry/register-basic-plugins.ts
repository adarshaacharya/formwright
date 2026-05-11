import type { FormPlugin } from "@formwright/core";

import { basicEffectPlugins } from "../effects/plugins";
import { basicOperatorPlugins } from "../operators/plugins";

export function registerBasicPlugins(): FormPlugin[] {
  return [...basicOperatorPlugins, ...basicEffectPlugins];
}
