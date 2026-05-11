import type { EffectPlugin } from "@formwright/core";

function makeEffect(effectType: EffectPlugin["effectType"]): EffectPlugin {
  return {
    kind: "effect",
    identity: {
      name: `@formwright/plugins-basic/effect/${effectType}`,
      version: "0.0.0",
    },
    effectType,
    apply(input) {
      const effect = input.effect;

      if (effect.type === "show") {
        return { fieldMutations: [{ path: effect.target, patch: { visible: true } }] };
      }
      if (effect.type === "hide") {
        return { fieldMutations: [{ path: effect.target, patch: { visible: false } }] };
      }
      if (effect.type === "enable") {
        return { fieldMutations: [{ path: effect.target, patch: { disabled: false } }] };
      }
      if (effect.type === "disable") {
        return { fieldMutations: [{ path: effect.target, patch: { disabled: true } }] };
      }
      if (effect.type === "require") {
        return {
          fieldMutations: [{ path: effect.target, patch: { required: effect.value ?? true } }],
        };
      }
      if (effect.type === "setValue") {
        return { valueMutations: [{ path: effect.target, value: effect.value }] };
      }
      if (effect.type === "clearValue") {
        return { valueMutations: [{ path: effect.target, value: undefined }] };
      }
      if (effect.type === "setLayoutProp" && effect.prop === "visible") {
        return {
          layoutMutations: [{ id: effect.target, patch: { visible: Boolean(effect.value) } }],
        };
      }

      return {};
    },
  };
}

export const showEffectPlugin = makeEffect("show");
export const hideEffectPlugin = makeEffect("hide");
export const enableEffectPlugin = makeEffect("enable");
export const disableEffectPlugin = makeEffect("disable");
export const requireEffectPlugin = makeEffect("require");
export const setValueEffectPlugin = makeEffect("setValue");
export const clearValueEffectPlugin = makeEffect("clearValue");
export const setLayoutPropEffectPlugin = makeEffect("setLayoutProp");

export const basicEffectPlugins: EffectPlugin[] = [
  showEffectPlugin,
  hideEffectPlugin,
  enableEffectPlugin,
  disableEffectPlugin,
  requireEffectPlugin,
  setValueEffectPlugin,
  clearValueEffectPlugin,
  setLayoutPropEffectPlugin,
];
