import { useMemo, useState } from "react";
import { createFormRuntime } from "@formwright/core";
import { registerAsyncPlugins } from "@formwright/plugins-async";
import { registerBasicPlugins } from "@formwright/plugins-basic";
import { FormRuntimeProvider, FormRuntimeRoot } from "@formwright/react-rhf";
import { createDefaultRendererMaps } from "@formwright/renderers-default";
import {
  buildCustomerOnboardingSchema,
  buildCustomerOnboardingSource,
  defaultCustomerOnboardingDraft,
  type CustomerOnboardingDraft,
  type OptionalFieldKey,
} from "./examples/customer-onboarding";

const panelStyle: React.CSSProperties = {
  border: "1px solid #d6d3d1",
  borderRadius: 18,
  background: "rgba(255,255,255,0.78)",
  boxShadow: "0 18px 45px rgba(25, 30, 45, 0.08)",
  overflow: "hidden",
};



const optionalFieldLabels: Record<OptionalFieldKey, string> = {
  companyName: "Company Name",
  country: "Country",
  contactEmail: "Contact Email",
  addresses: "Addresses",
};

function moveField(order: OptionalFieldKey[], key: OptionalFieldKey, direction: "up" | "down"): OptionalFieldKey[] {
  const index = order.indexOf(key);
  if (index < 0) {
    return order;
  }
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= order.length) {
    return order;
  }
  const next = [...order];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
const preStyle: React.CSSProperties = {
  margin: 0,
  padding: 20,
  fontSize: 12,
  lineHeight: 1.6,
  overflow: "auto",
  maxHeight: 640,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  background: "linear-gradient(180deg, #111827 0%, #1f2937 100%)",
  color: "#f9fafb",
};

export function App(): React.JSX.Element {
  const [mode, setMode] = useState<"create" | "view">("create");
  const [draft, setDraft] = useState<CustomerOnboardingDraft>(defaultCustomerOnboardingDraft);
  const rendererMaps = useMemo(() => createDefaultRendererMaps(), []);
  const schema = useMemo(() => buildCustomerOnboardingSchema(draft), [draft]);
  const source = useMemo(() => buildCustomerOnboardingSource(draft), [draft]);
  const runtime = useMemo(
    () =>
      createFormRuntime({
        form: schema,
        context: {
          mode,
          baseUrl: typeof window !== "undefined" ? window.location.origin : undefined,
        },
        plugins: [...registerBasicPlugins(), ...registerAsyncPlugins()],
      }),
    [mode, schema],
  );
  const compiledSchema = useMemo(() => JSON.stringify(schema, null, 2), [schema]);

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 32,
        background:
          "radial-gradient(circle at top left, rgba(251,191,36,0.24), transparent 30%), linear-gradient(135deg, #f4f1ea 0%, #e7ecf5 100%)",
        color: "#111827",
      }}
    >
      <div style={{ maxWidth: 1480, margin: "0 auto", display: "grid", gap: 20 }}>
        <div style={{ display: "grid", gap: 10 }}>
          <span style={{ letterSpacing: 2, textTransform: "uppercase", fontSize: 12, color: "#92400e" }}>
            Authoring Lab
          </span>
          <h1 style={{ margin: 0, fontSize: "clamp(32px, 5vw, 56px)", lineHeight: 1 }}>Formwright Schema Lab</h1>
          <p style={{ margin: 0, maxWidth: 760, fontSize: 16, lineHeight: 1.6, color: "#374151" }}>
            Builder source on the left, compiled `FormDefinition` in the middle, live runtime preview on the right.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <strong>Runtime mode:</strong>
          <button type="button" onClick={() => setMode("create")} disabled={mode === "create"}>
            create
          </button>
          <button type="button" onClick={() => setMode("view")} disabled={mode === "view"}>
            view
          </button>
        </div>

        <section
          style={{
            ...panelStyle,
            background: "rgba(255,255,255,0.9)",
            padding: 16,
            display: "grid",
            gap: 12,
          }}
        >
          <strong>Interactive Builder Controls</strong>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span>Form title</span>
              <input
                value={draft.formTitle}
                onChange={(event) => setDraft((previous) => ({ ...previous, formTitle: event.target.value }))}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span>Company label</span>
              <input
                value={draft.companyLabel}
                onChange={(event) => setDraft((previous) => ({ ...previous, companyLabel: event.target.value }))}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span>Email placeholder</span>
              <input
                value={draft.emailPlaceholder}
                onChange={(event) => setDraft((previous) => ({ ...previous, emailPlaceholder: event.target.value }))}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span>Default account type</span>
              <select
                value={draft.defaultAccountType}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    defaultAccountType: event.target.value as CustomerOnboardingDraft["defaultAccountType"],
                  }))
                }
              >
                <option value="individual">individual</option>
                <option value="company">company</option>
              </select>
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span>Contact grid columns</span>
              <select
                value={String(draft.contactColumns)}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    contactColumns: Number(event.target.value) as CustomerOnboardingDraft["contactColumns"],
                  }))
                }
              >
                <option value="1">1 column</option>
                <option value="2">2 columns</option>
              </select>
            </label>
            <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 22 }}>
              <input
                type="checkbox"
                checked={draft.requireCompanyWhenCompanyType}
                onChange={(event) =>
                  setDraft((previous) => ({
                    ...previous,
                    requireCompanyWhenCompanyType: event.target.checked,
                  }))
                }
              />
              <span>Require company name for company account type</span>
            </label>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <strong>Field Composition</strong>
            {draft.fieldOrder.map((key, index) => (
              <div
                key={key}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(140px, 1fr) auto auto auto",
                  gap: 8,
                  alignItems: "center",
                  padding: "8px 10px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  background: "#fff",
                }}
              >
                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={draft.enabledFields[key]}
                    onChange={(event) =>
                      setDraft((previous) => ({
                        ...previous,
                        enabledFields: {
                          ...previous.enabledFields,
                          [key]: event.target.checked,
                        },
                      }))
                    }
                  />
                  <span>{optionalFieldLabels[key]}</span>
                </label>
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() =>
                    setDraft((previous) => ({
                      ...previous,
                      fieldOrder: moveField(previous.fieldOrder, key, "up"),
                    }))
                  }
                >
                  Up
                </button>
                <button
                  type="button"
                  disabled={index === draft.fieldOrder.length - 1}
                  onClick={() =>
                    setDraft((previous) => ({
                      ...previous,
                      fieldOrder: moveField(previous.fieldOrder, key, "down"),
                    }))
                  }
                >
                  Down
                </button>
                <span style={{ fontSize: 12, color: "#6b7280", textAlign: "right" }}>#{index + 1}</span>
              </div>
            ))}
          </div>
        </section>

        <div
          style={{
            display: "grid",
            gap: 20,
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            alignItems: "start",
          }}
        >
          <section style={panelStyle}>
            <header style={{ padding: "18px 20px", borderBottom: "1px solid #e7e5e4", background: "#fffaf0" }}>
              <strong>Builder Source</strong>
            </header>
            <pre style={preStyle}>{source}</pre>
          </section>

          <section style={panelStyle}>
            <header style={{ padding: "18px 20px", borderBottom: "1px solid #e7e5e4", background: "#eff6ff" }}>
              <strong>Compiled Schema</strong>
            </header>
            <pre style={preStyle}>{compiledSchema}</pre>
          </section>

          <section style={{ ...panelStyle, background: "rgba(255,255,255,0.9)" }}>
            <header style={{ padding: "18px 20px", borderBottom: "1px solid #e7e5e4", background: "#f0fdf4" }}>
              <strong>Live Preview</strong>
            </header>
            <div style={{ padding: 20 }}>
              <FormRuntimeProvider runtime={runtime}>
                <FormRuntimeRoot
                  rootLayoutId="root-stack"
                  fieldRendererMap={rendererMaps.fieldRendererMap}
                  arrayFieldRendererMap={rendererMaps.arrayFieldRendererMap}
                  layoutRendererMap={rendererMaps.layoutRendererMap}
                />
              </FormRuntimeProvider>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
