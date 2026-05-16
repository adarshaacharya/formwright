import type {
  DataSourcePlugin,
  EffectPlugin,
  FieldPlugin,
  FormPlugin,
  LayoutPlugin,
  OperatorPlugin,
  PluginIdentity,
  ValidatorPlugin,
} from "../runtime/types";

export interface PluginRegistry {
  register(plugin: FormPlugin): void;
  registerMany(plugins: FormPlugin[]): void;
  list(): FormPlugin[];
  findField(fieldType: string): FieldPlugin | undefined;
  findLayout(layoutType: string): LayoutPlugin | undefined;
  findValidator(validatorType: string): ValidatorPlugin | undefined;
  findOperator(operatorType: string): OperatorPlugin | undefined;
  findEffect(effectType: string): EffectPlugin | undefined;
  findDataSource(sourceType: string): DataSourcePlugin | undefined;
}

export class DuplicatePluginError extends Error {
  constructor(public readonly identity: PluginIdentity) {
    super(`Duplicate plugin registration: ${identity.name}`);
    this.name = "DuplicatePluginError";
  }
}

export class DuplicatePluginCapabilityError extends Error {
  constructor(
    public readonly capabilityType: string,
    public readonly capabilityValue: string,
    public readonly existingIdentity: PluginIdentity,
    public readonly nextIdentity: PluginIdentity,
  ) {
    super(
      `Duplicate plugin capability registration for ${capabilityType}:${capabilityValue} (${existingIdentity.name} vs ${nextIdentity.name})`,
    );
    this.name = "DuplicatePluginCapabilityError";
  }
}

export function createPluginRegistry(): PluginRegistry {
  const fieldPlugins = new Map<string, FieldPlugin>();
  const layoutPlugins = new Map<string, LayoutPlugin>();
  const validatorPlugins = new Map<string, ValidatorPlugin>();
  const operatorPlugins = new Map<string, OperatorPlugin>();
  const effectPlugins = new Map<string, EffectPlugin>();
  const dataSourcePlugins = new Map<string, DataSourcePlugin>();
  const allPlugins: FormPlugin[] = [];
  const seenIdentity = new Set<string>();

  const assertCapabilityAvailable = (
    capabilityType: string,
    capabilityValue: string,
    existingPlugin: FormPlugin | undefined,
    nextPlugin: FormPlugin,
  ): void => {
    if (!existingPlugin) return;
    throw new DuplicatePluginCapabilityError(
      capabilityType,
      capabilityValue,
      existingPlugin.identity,
      nextPlugin.identity,
    );
  };

  const register = (plugin: FormPlugin): void => {
    const identityKey = `${plugin.identity.name}@${plugin.identity.version ?? "0"}`;
    if (seenIdentity.has(identityKey)) {
      throw new DuplicatePluginError(plugin.identity);
    }

    seenIdentity.add(identityKey);
    allPlugins.push(plugin);

    if (plugin.kind === "field") {
      assertCapabilityAvailable("field", plugin.fieldType, fieldPlugins.get(plugin.fieldType), plugin);
      fieldPlugins.set(plugin.fieldType, plugin);
    }
    if (plugin.kind === "layout") {
      assertCapabilityAvailable("layout", plugin.layoutType, layoutPlugins.get(plugin.layoutType), plugin);
      layoutPlugins.set(plugin.layoutType, plugin);
    }
    if (plugin.kind === "validator") {
      assertCapabilityAvailable(
        "validator",
        plugin.validatorType,
        validatorPlugins.get(plugin.validatorType),
        plugin,
      );
      validatorPlugins.set(plugin.validatorType, plugin);
    }
    if (plugin.kind === "operator") {
      assertCapabilityAvailable(
        "operator",
        plugin.operatorType,
        operatorPlugins.get(plugin.operatorType),
        plugin,
      );
      operatorPlugins.set(plugin.operatorType, plugin);
    }
    if (plugin.kind === "effect") {
      assertCapabilityAvailable("effect", plugin.effectType, effectPlugins.get(plugin.effectType), plugin);
      effectPlugins.set(plugin.effectType, plugin);
    }
    if (plugin.kind === "datasource") {
      assertCapabilityAvailable(
        "datasource",
        plugin.sourceType,
        dataSourcePlugins.get(plugin.sourceType),
        plugin,
      );
      dataSourcePlugins.set(plugin.sourceType, plugin);
    }
  };

  return {
    register,
    registerMany(plugins) {
      for (const plugin of plugins) register(plugin);
    },
    list() {
      return [...allPlugins];
    },
    findField(fieldType) {
      return fieldPlugins.get(fieldType);
    },
    findLayout(layoutType) {
      return layoutPlugins.get(layoutType);
    },
    findValidator(validatorType) {
      return validatorPlugins.get(validatorType);
    },
    findOperator(operatorType) {
      return operatorPlugins.get(operatorType);
    },
    findEffect(effectType) {
      return effectPlugins.get(effectType);
    },
    findDataSource(sourceType) {
      return dataSourcePlugins.get(sourceType);
    },
  };
}
