import { useMemo, useState } from "react";
import { createFormRuntime } from "@formwright/core";
import { registerAsyncPlugins } from "@formwright/plugins-async";
import { registerBasicPlugins } from "@formwright/plugins-basic";
import { createDefaultRendererMaps } from "@formwright/renderers-default";
import { FormRuntimeProvider, FormRuntimeRoot } from "@formwright/react-rhf";
import type { FieldRendererSlots } from "@formwright/react-rhf";
import { basicSchema } from "./schemas/basic-schema";
import { demoValidationResolver } from "./demo/validation";
import { CountrySelectRenderer } from "./components/country-select-renderer";

export function App(): React.JSX.Element {
  const [mode, setMode] = useState<"create" | "view">("create");
  const [hiddenFieldPolicy, setHiddenFieldPolicy] = useState<"keep" | "clear" | "unregister">("keep");
  const runtime = useMemo(
    () =>
      createFormRuntime({
        form: basicSchema,
        context: { mode, baseUrl: typeof window !== "undefined" ? window.location.origin : undefined },
        plugins: [...registerBasicPlugins(), ...registerAsyncPlugins()],
      }),
    [mode],
  );
  const rendererMaps = useMemo(() => createDefaultRendererMaps(), []);
  const fieldRendererMap = useMemo(
    () => ({
      ...rendererMaps.fieldRendererMap,
      "country-select": CountrySelectRenderer,
    }),
    [rendererMaps],
  );
  const fieldSlots = useMemo(
    (): FieldRendererSlots => ({
      Control: ({ field, value, state, onChange, onBlur, loading, defaultControl }) => {
        if (field.path !== "contact.email") {
          return <>{defaultControl}</>;
        }

        return (
          <div style={{ display: "grid", gap: 4, border: "1px solid #8b5cf6", padding: 8, borderRadius: 8 }}>
            <small style={{ color: "#6b21a8" }}>custom slot control</small>
            <input
              type="email"
              value={(value as string | undefined) ?? ""}
              onChange={(event) => onChange(event.target.value)}
              onBlur={onBlur}
              disabled={state.disabled || loading}
              placeholder="custom email input"
            />
          </div>
        );
      },
    }),
    [],
  );

  return (
    <FormRuntimeProvider
      runtime={runtime}
      validationResolver={demoValidationResolver}
      hiddenFieldPolicy={hiddenFieldPolicy}
    >
      <div style={{ maxWidth: 520, margin: "40px auto", display: "grid", gap: 20 }}>
        <h1>Formwright Demo</h1>
        <p>Change account type to see rule-based show/hide behavior.</p>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <strong>Mode:</strong>
          <button type="button" onClick={() => setMode("create")} disabled={mode === "create"}>
            create
          </button>
          <button type="button" onClick={() => setMode("view")} disabled={mode === "view"}>
            view
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <strong>Hidden policy:</strong>
          <button type="button" onClick={() => setHiddenFieldPolicy("keep")} disabled={hiddenFieldPolicy === "keep"}>
            keep
          </button>
          <button type="button" onClick={() => setHiddenFieldPolicy("clear")} disabled={hiddenFieldPolicy === "clear"}>
            clear
          </button>
          <button
            type="button"
            onClick={() => setHiddenFieldPolicy("unregister")}
            disabled={hiddenFieldPolicy === "unregister"}
          >
            unregister
          </button>
        </div>
        <FormRuntimeRoot
          rootLayoutId="root-stack"
          fieldRendererMap={fieldRendererMap}
          arrayFieldRendererMap={rendererMaps.arrayFieldRendererMap}
          layoutRendererMap={rendererMaps.layoutRendererMap}
          fieldSlots={fieldSlots}
        />
      </div>
    </FormRuntimeProvider>
  );
}
