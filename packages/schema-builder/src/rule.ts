import type { BuiltField, BuiltRule, RuleReference } from "./types";
import type { FieldPath, RuleEffect, RuleExpression } from "@formwright/contract";

function resolveFieldPath(input: BuiltField | FieldPath): FieldPath {
  return typeof input === "string" ? input : input.path;
}

function makeReference(path: string): RuleReference {
  const base = { var: path } satisfies RuleExpression;
  return {
    path,
    eq(value) {
      return { eq: [base, value] };
    },
    neq(value) {
      return { neq: [base, value] };
    },
    gt(value) {
      return { gt: [base, value] };
    },
    gte(value) {
      return { gte: [base, value] };
    },
    lt(value) {
      return { lt: [base, value] };
    },
    lte(value) {
      return { lte: [base, value] };
    },
    in(values) {
      return { in: [base, values] };
    },
    exists() {
      return { exists: path };
    },
  };
}

class RuleBuilder {
  constructor(private readonly whenExpression: RuleExpression) {}

  private build(effect: RuleEffect): BuiltRule {
    return {
      when: this.whenExpression,
      effects: [effect],
    };
  }

  show(target: BuiltField | FieldPath): BuiltRule {
    return this.build({ type: "show", target: resolveFieldPath(target) });
  }

  hide(target: BuiltField | FieldPath): BuiltRule {
    return this.build({ type: "hide", target: resolveFieldPath(target) });
  }

  enable(target: BuiltField | FieldPath): BuiltRule {
    return this.build({ type: "enable", target: resolveFieldPath(target) });
  }

  disable(target: BuiltField | FieldPath): BuiltRule {
    return this.build({ type: "disable", target: resolveFieldPath(target) });
  }

  require(target: BuiltField | FieldPath, value = true): BuiltRule {
    return this.build({ type: "require", target: resolveFieldPath(target), value });
  }

  setValue(target: BuiltField | FieldPath, value: unknown): BuiltRule {
    return this.build({ type: "setValue", target: resolveFieldPath(target), value });
  }

  clearValue(target: BuiltField | FieldPath): BuiltRule {
    return this.build({ type: "clearValue", target: resolveFieldPath(target) });
  }

  disableAll(): BuiltRule {
    return this.build({ type: "disable", target: "*" });
  }
}

export function fieldRef(input: BuiltField | FieldPath): RuleReference {
  return makeReference(resolveFieldPath(input));
}

export function contextRef(name: string): RuleReference {
  return makeReference(`$${name}`);
}

export const rule = {
  when(expression: RuleExpression) {
    return new RuleBuilder(expression);
  },
};
