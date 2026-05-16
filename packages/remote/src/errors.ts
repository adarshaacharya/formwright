export interface RemoteSchemaIssue {
  path: string;
  message: string;
}

export class RemoteSchemaValidationError extends Error {
  constructor(public readonly issues: RemoteSchemaIssue[]) {
    super("Invalid remote form payload");
    this.name = "RemoteSchemaValidationError";
  }
}
