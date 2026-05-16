import { useEffect, useMemo, useState } from "react";
import type { FieldPath, SelectOption } from "@formwright/contract";
import { useRuntimeContext } from "../provider/runtime-context";
import type { UseDatasourceOptionsResult } from "../types/public-types";
import { useFormRuntime } from "./use-form-runtime";

export function useDatasourceOptions(path: FieldPath): UseDatasourceOptionsResult {
  const runtime = useFormRuntime();
  const { evaluation } = useRuntimeContext();
  const field = runtime.resolveField(path);
  const parentState = field?.parentPath ? evaluation.fieldState[field.parentPath] : undefined;
  const state = evaluation.fieldState[path] ??
    (parentState
      ? {
          ...parentState,
          path,
        }
      : {
          path,
          visible: true,
          disabled: false,
          readonly: false,
          required: false,
        });

  const sourceName = field?.uiField?.dataSource;
  const source = sourceName ? runtime.getFormDefinition().behaviorSchema?.dataSources?.[sourceName] : undefined;
  const plugin = source ? runtime.getPluginRegistry().findDataSource(source.type) : undefined;
  const staticOptions = field?.uiField?.options;
  const runtimeOptions = evaluation.fieldOptions[path];
  const runtimeOptionOverride = runtimeOptions !== staticOptions ? runtimeOptions : undefined;
  const dependsOnValues = useMemo(() => {
    if (!source || source.type !== "remote") return {};
    const values: Record<string, unknown> = {};
    for (const pathName of source.dependsOn ?? []) {
      values[pathName] = evaluation.values[pathName];
    }
    return values;
  }, [evaluation.values, source]);
  const dependsOnSignature = useMemo(() => JSON.stringify(dependsOnValues), [dependsOnValues]);
  const [remoteOptions, setRemoteOptions] = useState<SelectOption[] | undefined>(undefined);
  const [loading, setLoading] = useState(Boolean(source && source.type === "remote"));
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    if (!source) {
      setRemoteOptions(undefined);
      setLoading(false);
      setError(undefined);
      return () => {
        cancelled = true;
      };
    }

    if (!plugin) {
      setRemoteOptions(source.type === "static" ? source.options : runtimeOptionOverride ?? staticOptions);
      setLoading(false);
      setError(undefined);
      return () => {
        cancelled = true;
      };
    }

    if (source.type === "static") {
      setRemoteOptions(runtimeOptionOverride ?? source.options);
      setLoading(false);
      setError(undefined);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    setRemoteOptions(undefined);
    setError(undefined);
    plugin
      .load({
        source,
        dependsOnValues,
        context: runtime.getRuntimeContext(),
      })
      .then((result) => {
        if (!cancelled) {
          setRemoteOptions(result.options ?? runtimeOptionOverride);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRemoteOptions(runtimeOptionOverride ?? staticOptions);
          setError(`Failed to load options for ${path}`);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [dependsOnSignature, plugin, runtime, runtimeOptionOverride, source, staticOptions]);

  return {
    loading: Boolean(state.loading) || loading,
    error,
    options: runtimeOptionOverride ?? remoteOptions ?? staticOptions,
  };
}
