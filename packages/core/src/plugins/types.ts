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

export function createPluginRegistry(): PluginRegistry {
  const fieldPlugins = new Map<string, FieldPlugin>();
  const layoutPlugins = new Map<string, LayoutPlugin>();
  const validatorPlugins = new Map<string, ValidatorPlugin>();
  const operatorPlugins = new Map<string, OperatorPlugin>();
  const effectPlugins = new Map<string, EffectPlugin>();
  const dataSourcePlugins = new Map<string, DataSourcePlugin>();
  const allPlugins: FormPlugin[] = [];
  const seenIdentity = new Set<string>();

  const register = (plugin: FormPlugin): void => {
    const identityKey = `${plugin.identity.name}@${plugin.identity.version ?? "0"}`;
    if (seenIdentity.has(identityKey)) {
      throw new DuplicatePluginError(plugin.identity);
    }

    seenIdentity.add(identityKey);
    allPlugins.push(plugin);

    if (plugin.kind === "field") fieldPlugins.set(plugin.fieldType, plugin);
    if (plugin.kind === "layout") layoutPlugins.set(plugin.layoutType, plugin);
    if (plugin.kind === "validator") validatorPlugins.set(plugin.validatorType, plugin);
    if (plugin.kind === "operator") operatorPlugins.set(plugin.operatorType, plugin);
    if (plugin.kind === "effect") effectPlugins.set(plugin.effectType, plugin);
    if (plugin.kind === "datasource") dataSourcePlugins.set(plugin.sourceType, plugin);
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
