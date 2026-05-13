import type { FormDraft } from "./types";

export interface DefineFormInput {
  id: string;
  version?: "1.0";
  meta?: FormDraft["meta"];
}

export function defineForm(input: DefineFormInput): FormDraft {
  return {
    version: input.version ?? "1.0",
    formId: input.id,
    meta: input.meta,
  };
}
