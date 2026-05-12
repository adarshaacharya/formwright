import { useMemo, useState } from "react";
import { createFormRuntime } from "@formwright/core";
import { registerAsyncPlugins } from "@formwright/plugins-async";
import { registerBasicPlugins } from "@formwright/plugins-basic";
import { createDefaultRendererMaps } from "@formwright/renderers-default";
import { FormRuntimeProvider, FormRuntimeRoot } from "@formwright/react-rhf";
import { basicSchema } from "./schemas/basic-schema";
import { playgroundValidationResolver } from "./demo/validation";

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

  return (
    <FormRuntimeProvider
      runtime={runtime}
      validationResolver={playgroundValidationResolver}
      hiddenFieldPolicy={hiddenFieldPolicy}
    >
      <div style={{ maxWidth: 520, margin: "40px auto", display: "grid", gap: 20 }}>
        <h1>Formwright Playground</h1>
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
          fieldRendererMap={rendererMaps.fieldRendererMap}
          arrayFieldRendererMap={rendererMaps.arrayFieldRendererMap}
          layoutRendererMap={rendererMaps.layoutRendererMap}
        />
      </div>
    </FormRuntimeProvider>
  );
}
