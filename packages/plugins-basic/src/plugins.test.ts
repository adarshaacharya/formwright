import { describe, expect, it } from "vitest";
import {
  andOperatorPlugin,
  clearValueEffectPlugin,
  disableEffectPlugin,
  eqOperatorPlugin,
  existsOperatorPlugin,
  gtOperatorPlugin,
  hideEffectPlugin,
  inOperatorPlugin,
  setLayoutPropEffectPlugin,
  setValueEffectPlugin,
  showEffectPlugin,
} from "./index";

describe("plugins-basic operators", () => {
  it("evaluates eq/gt/in/exists/and with values and context variables", () => {
    const values = { accountType: "company", age: 25, tags: "vip" };
    const context = { mode: "edit" as const };

    expect(
      eqOperatorPlugin.evaluate({ expression: { eq: [{ var: "accountType" }, "company"] }, values, context }),
    ).toBe(true);
    expect(gtOperatorPlugin.evaluate({ expression: { gt: [{ var: "age" }, 18] }, values, context })).toBe(true);
    expect(
      inOperatorPlugin.evaluate({ expression: { in: [{ var: "tags" }, ["vip", "new"]] }, values, context }),
    ).toBe(true);
    expect(existsOperatorPlugin.evaluate({ expression: { exists: "accountType" }, values, context })).toBe(true);
    expect(
      andOperatorPlugin.evaluate({
        expression: {
          and: [
            { eq: [{ var: "accountType" }, "company"] },
            { eq: [{ var: "$mode" }, "edit"] },
          ],
        },
        values,
        context,
      }),
    ).toBe(true);
  });
});

describe("plugins-basic effects", () => {
  it("returns expected mutations for core effect types", () => {
    expect(showEffectPlugin.apply({ effect: { type: "show", target: "company.name" }, values: {}, derivedState: { fields: {}, layouts: {} }, context: {} })).toEqual({
      fieldMutations: [{ path: "company.name", patch: { visible: true } }],
    });

    expect(hideEffectPlugin.apply({ effect: { type: "hide", target: "company.name" }, values: {}, derivedState: { fields: {}, layouts: {} }, context: {} })).toEqual({
      fieldMutations: [{ path: "company.name", patch: { visible: false } }],
    });

    expect(disableEffectPlugin.apply({ effect: { type: "disable", target: "company.name" }, values: {}, derivedState: { fields: {}, layouts: {} }, context: {} })).toEqual({
      fieldMutations: [{ path: "company.name", patch: { disabled: true } }],
    });

    expect(setValueEffectPlugin.apply({ effect: { type: "setValue", target: "accountType", value: "company" }, values: {}, derivedState: { fields: {}, layouts: {} }, context: {} })).toEqual({
      valueMutations: [{ path: "accountType", value: "company" }],
    });

    expect(clearValueEffectPlugin.apply({ effect: { type: "clearValue", target: "accountType" }, values: {}, derivedState: { fields: {}, layouts: {} }, context: {} })).toEqual({
      valueMutations: [{ path: "accountType", value: undefined }],
    });

    expect(setLayoutPropEffectPlugin.apply({ effect: { type: "setLayoutProp", target: "company-section", prop: "visible", value: false }, values: {}, derivedState: { fields: {}, layouts: {} }, context: {} })).toEqual({
      layoutMutations: [{ id: "company-section", patch: { visible: false } }],
    });
  });
});
