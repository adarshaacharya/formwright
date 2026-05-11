export interface ValidationResult {
  valid: boolean;
  code?: string;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface ValidationPlanItem {
  validatorType: string;
  config?: Record<string, unknown>;
}
