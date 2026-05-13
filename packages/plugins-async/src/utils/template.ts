function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function resolveTemplateValue(
  template: string,
  values: Record<string, unknown>,
  fallback: unknown = "",
): string | number | boolean | null {
  const match = template.match(/^\{([^}]+)\}$/);
  if (match) {
    const value = values[match[1]];
    if (value === undefined || value === null) return fallback as null;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return value;
    }
    return JSON.stringify(value);
  }

  return template.replace(/\{([^}]+)\}/g, (_token, key: string) => {
    const value = values[key];
    if (value === undefined || value === null) return "";
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    return JSON.stringify(value);
  });
}

export function resolveTemplateObject(value: unknown, values: Record<string, unknown>): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => resolveTemplateObject(item, values));
  }

  if (isPlainObject(value)) {
    const resolved: Record<string, unknown> = {};
    for (const [key, nextValue] of Object.entries(value)) {
      resolved[key] = resolveTemplateObject(nextValue, values);
    }
    return resolved;
  }

  if (typeof value === "string") {
    return resolveTemplateValue(value, values);
  }

  return value;
}

export function toDependsOnValues(
  dependsOn: string[] | undefined,
  values: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const path of dependsOn ?? []) {
    result[path] = values[path];
  }
  return result;
}
