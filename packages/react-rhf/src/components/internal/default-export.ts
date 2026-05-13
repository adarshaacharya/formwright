export { DefaultField, DefaultFieldRenderer } from "./default-field";
export { DefaultArrayField, DefaultArrayFieldRenderer } from "./default-array-field";
export { DefaultLayout, DefaultLayoutRenderer } from "./default-layout";

import type {
  ArrayFieldRendererComponent,
  FieldRendererComponent,
  LayoutRendererComponent,
} from "../../types/public-types";
import { DefaultArrayFieldRenderer } from "./default-array-field";
import { DefaultFieldRenderer } from "./default-field";
import { DefaultLayoutRenderer } from "./default-layout";

export function createDefaultRendererMaps(): {
  fieldRendererMap: Record<string, FieldRendererComponent>;
  arrayFieldRendererMap: Record<string, ArrayFieldRendererComponent>;
  layoutRendererMap: Record<string, LayoutRendererComponent>;
} {
  return {
    fieldRendererMap: {
      text: DefaultFieldRenderer,
      select: DefaultFieldRenderer,
      email: DefaultFieldRenderer,
      number: DefaultFieldRenderer,
    },
    arrayFieldRendererMap: {
      array: DefaultArrayFieldRenderer,
    },
    layoutRendererMap: {
      stack: DefaultLayoutRenderer,
      section: DefaultLayoutRenderer,
      grid: DefaultLayoutRenderer,
      tabs: DefaultLayoutRenderer,
      stepper: DefaultLayoutRenderer,
      divider: DefaultLayoutRenderer,
    },
  };
}
