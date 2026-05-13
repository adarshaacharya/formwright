import type { BehaviorSchema } from "../behavior-schema/types";
import type { DataSchema } from "../data-schema/types";
import type { FormMode, FormSchemaVersion } from "../shared/types";
import type { UiSchema } from "../ui-schema/types";

export interface FormMeta {
  title?: string;
  description?: string;
  mode?: FormMode;
  locale?: string;
  tenant?: string;
  workflowState?: string;
  permissions?: Record<string, boolean>;
  featureFlags?: Record<string, boolean | string | number>;
  tags?: string[];
}

export interface FormDefinition {
  version: FormSchemaVersion;
  formId: string;
  meta?: FormMeta;
  dataSchema: DataSchema;
  uiSchema: UiSchema;
  behaviorSchema?: BehaviorSchema;
}
