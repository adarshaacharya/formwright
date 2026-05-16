import type { FormDefinition } from "../form-definition/types";

export interface RemoteFormPayloadMeta {
  schemaId?: string;
  schemaVersion?: string;
  etag?: string;
  source?: string;
}

export interface RemoteFormPayload {
  version: "1.0";
  form: FormDefinition;
  initialValues?: Record<string, unknown>;
  meta?: RemoteFormPayloadMeta;
}
