import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import type { FormDefinition } from "@formwright/contract";
import { createFormRuntime } from "@formwright/core";
import { registerAsyncPlugins } from "@formwright/plugins-async";
import { registerBasicPlugins } from "@formwright/plugins-basic";
import { FormRuntimeProvider, FormRuntimeRoot } from "@formwright/react-rhf";
import { createDefaultRendererMaps } from "@formwright/renderers-default";
import {
  buildCustomerOnboardingSchema,
  buildCustomerOnboardingSource,
  defaultCustomerOnboardingDraft,
  type CustomFieldKind,
  type CustomerOnboardingDraft,
  type OptionalFieldKey,
} from "./examples/customer-onboarding";
import { MonacoJsonEditor } from "./components/monaco-json-editor";
import type { MonacoJsonEditorHandle } from "./components/monaco-json-editor";
import { deriveDraftFromSchema, validateFormDefinitionShape, type SchemaIssue } from "./schema-tools";

const optionalFieldLabels: Record<OptionalFieldKey, string> = {
  companyName: "Company Name",
  country: "Country",
  contactEmail: "Contact Email",
  addresses: "Addresses",
};

const contractHints: Array<{ title: string; description: string; code: string }> = [
  {
    title: "Required root shape",
    description: "Every form must include these top-level keys.",
    code: '{ "version": "1.0", "formId": "...", "dataSchema": {...}, "uiSchema": {...} }',
  },
  {
    title: "Data field contract",
    description: "Each data field needs a valid `valueType` and optional constraints.",
    code: '{ "dataSchema": { "fields": { "customer.email": { "valueType": "string", "format": "email" } } } }',
  },
  {
    title: "UI node mapping",
    description: "Every field in `dataSchema.fields` should exist in `uiSchema.nodes`.",
    code: '{ "uiSchema": { "nodes": { "customer.email": { "fieldType": "email", "label": "Email" } } } }',
  },
  {
    title: "Layout references",
    description: "Layout `field` refs must point to existing data field paths.",
    code: '{ "uiSchema": { "layout": { "type": "stack", "children": [{ "type": "field", "ref": "customer.email" }] } } }',
  },
];

interface SortableFieldItemProps {
  keyName: OptionalFieldKey;
  index: number;
  checked: boolean;
  onToggle: (checked: boolean) => void;
}

interface SchemaSnapshot {
  id: string;
  createdAtIso: string;
  source: "manual" | "apply";
  content: string;
}

const AUTOSAVE_KEY = "formwright.schemaLab.autosave.v1";
const SNAPSHOTS_KEY = "formwright.schemaLab.snapshots.v1";

function normalizeDraftDraft(input: Partial<CustomerOnboardingDraft>): CustomerOnboardingDraft {
  return {
    ...defaultCustomerOnboardingDraft,
    ...input,
    enabledFields: {
      ...defaultCustomerOnboardingDraft.enabledFields,
      ...(input.enabledFields ?? {}),
    },
    fieldOrder: input.fieldOrder ?? defaultCustomerOnboardingDraft.fieldOrder,
    customFields: input.customFields ?? [],
  };
}

function SortableFieldItem({ keyName, index, checked, onToggle }: SortableFieldItemProps): React.JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: keyName });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`grid items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 sm:grid-cols-[auto_1fr_auto_auto] ${
        isDragging ? "opacity-60" : "opacity-100"
      }`}
    >
      <button
        type="button"
        className="cursor-grab select-none rounded-md border border-slate-700 px-2 py-1 font-mono text-xs text-slate-400 active:cursor-grabbing"
        aria-label={`Reorder ${optionalFieldLabels[keyName]}`}
        {...attributes}
        {...listeners}
      >
        ::
      </button>
      <label className="inline-flex items-center gap-2 text-base text-slate-200">
        <input type="checkbox" checked={checked} onChange={(event) => onToggle(event.target.checked)} />
        <span>{optionalFieldLabels[keyName]}</span>
      </label>
      <span className="rounded-md bg-slate-800 px-2 py-1 font-mono text-xs text-slate-300">{keyName}</span>
      <span className="font-mono text-xs text-slate-400">#{index + 1}</span>
    </div>
  );
}

export function App(): React.JSX.Element {
  const [mode, setMode] = useState<"create" | "view">("create");
  const [draft, setDraft] = useState<CustomerOnboardingDraft>(defaultCustomerOnboardingDraft);
  const [schemaOverrideText, setSchemaOverrideText] = useState("");
  const [schemaOverride, setSchemaOverride] = useState<FormDefinition | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [schemaIssues, setSchemaIssues] = useState<SchemaIssue[]>([]);
  const [editorTab, setEditorTab] = useState<"source" | "schema">("schema");
  const [newCustomKind, setNewCustomKind] = useState<CustomFieldKind>("text");
  const [newCustomPath, setNewCustomPath] = useState("custom.notes");
  const [newCustomLabel, setNewCustomLabel] = useState("Notes");
  const [newCustomPlaceholder, setNewCustomPlaceholder] = useState("");
  const [newCustomDefault, setNewCustomDefault] = useState("");
  const [newCustomRequired, setNewCustomRequired] = useState(false);
  const [newCustomOptions, setNewCustomOptions] = useState("Option A:option_a, Option B:option_b");
  const [snapshots, setSnapshots] = useState<SchemaSnapshot[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>("");
  const [lastAutosaveIso, setLastAutosaveIso] = useState<string | null>(null);
  const schemaEditorRef = useRef<MonacoJsonEditorHandle | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const rendererMaps = useMemo(() => createDefaultRendererMaps(), []);
  const generatedSchema = useMemo(() => buildCustomerOnboardingSchema(draft), [draft]);
  const source = useMemo(() => buildCustomerOnboardingSource(draft), [draft]);
  const schema = schemaOverride ?? generatedSchema;
  const compiledSchema = useMemo(() => JSON.stringify(schema, null, 2), [schema]);
  const jsonEditorValue = schemaOverrideText || compiledSchema;
  const liveSchemaIssues = useMemo(() => {
    try {
      const parsed = JSON.parse(jsonEditorValue) as unknown;
      return validateFormDefinitionShape(parsed);
    } catch {
      return [];
    }
  }, [jsonEditorValue]);
  const selectedSnapshot = useMemo(
    () => snapshots.find((snapshot) => snapshot.id === selectedSnapshotId) ?? null,
    [selectedSnapshotId, snapshots],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const rawAutosave = window.localStorage.getItem(AUTOSAVE_KEY);
    if (rawAutosave) {
      try {
        const parsed = JSON.parse(rawAutosave) as {
          draft?: CustomerOnboardingDraft;
          schemaOverrideText?: string;
          mode?: "create" | "view";
          savedAtIso?: string;
        };
        if (parsed.draft) {
          setDraft(normalizeDraftDraft(parsed.draft));
        }
        if (typeof parsed.schemaOverrideText === "string") {
          setSchemaOverrideText(parsed.schemaOverrideText);
        }
        if (parsed.mode === "create" || parsed.mode === "view") {
          setMode(parsed.mode);
        }
        if (typeof parsed.savedAtIso === "string") {
          setLastAutosaveIso(parsed.savedAtIso);
        }
      } catch {
        // Ignore invalid local cache and continue with defaults.
      }
    }

    const rawSnapshots = window.localStorage.getItem(SNAPSHOTS_KEY);
    if (rawSnapshots) {
      try {
        const parsed = JSON.parse(rawSnapshots) as SchemaSnapshot[];
        if (Array.isArray(parsed)) {
          setSnapshots(parsed);
          if (parsed[0]) {
            setSelectedSnapshotId(parsed[0].id);
          }
        }
      } catch {
        // Ignore invalid history cache.
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const timeout = window.setTimeout(() => {
      const savedAtIso = new Date().toISOString();
      const payload = JSON.stringify({
        draft,
        schemaOverrideText,
        mode,
        savedAtIso,
      });
      window.localStorage.setItem(AUTOSAVE_KEY, payload);
      setLastAutosaveIso(savedAtIso);
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [draft, mode, schemaOverrideText]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
  }, [snapshots]);

  function pushSnapshot(source: SchemaSnapshot["source"], content: string): void {
    const next: SchemaSnapshot = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAtIso: new Date().toISOString(),
      source,
      content,
    };
    setSnapshots((previous) => [next, ...previous].slice(0, 20));
    setSelectedSnapshotId(next.id);
  }

  async function importSchemaFromFile(file: File): Promise<void> {
    const content = await file.text();
    setSchemaOverrideText(content);
    setEditorTab("schema");
    setSchemaError(null);
    setSchemaIssues([]);
  }

  function exportSchemaJson(): void {
    const blob = new Blob([jsonEditorValue], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${schema.formId || "form-schema"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

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

  function onDragEnd(event: DragEndEvent): void {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    setDraft((previous) => {
      const from = previous.fieldOrder.indexOf(active.id as OptionalFieldKey);
      const to = previous.fieldOrder.indexOf(over.id as OptionalFieldKey);
      if (from < 0 || to < 0) {
        return previous;
      }

      return {
        ...previous,
        fieldOrder: arrayMove(previous.fieldOrder, from, to),
      };
    });
  }

  function addCustomField(): void {
    const path = newCustomPath.trim();
    const label = newCustomLabel.trim();
    if (!path || !label) {
      return;
    }

    setDraft((previous) => {
      if (previous.customFields.some((fieldDraft) => fieldDraft.path === path)) {
        return previous;
      }

      return {
        ...previous,
        customFields: [
          ...previous.customFields,
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            path,
            kind: newCustomKind,
            label,
            required: newCustomRequired,
            placeholder: newCustomPlaceholder || undefined,
            defaultValue: newCustomDefault || undefined,
            selectOptions:
              newCustomKind === "select"
                ? newCustomOptions
                    .split(",")
                    .map((entry) => entry.trim())
                    .filter(Boolean)
                    .map((entry) => {
                      const [optionLabel, optionValue] = entry.split(":").map((item) => item.trim());
                      return { label: optionLabel || entry, value: optionValue || optionLabel || entry };
                    })
                : undefined,
          },
        ],
      };
    });
  }

  function removeCustomField(id: string): void {
    setDraft((previous) => ({
      ...previous,
      customFields: previous.customFields.filter((fieldDraft) => fieldDraft.id !== id),
    }));
  }

  return (
    <div className="min-h-screen px-5 py-8 lg:px-10">
      <div className="mx-auto grid max-w-[1800px] gap-6">
        <div className="grid gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Authoring Lab</span>
          <h1 className="text-5xl font-semibold leading-tight text-slate-100 lg:text-7xl">Formwright Schema Lab</h1>
          <p className="max-w-5xl text-base leading-7 text-slate-300 lg:text-lg">
            Editor-first workspace inspired by modern form builders: large schema/code panels, fast field composition,
            and always-on runtime preview.
          </p>
        </div>

        <section className="panel grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <label className="grid gap-1.5 text-sm text-slate-300">
              <span>Form title</span>
              <input
                className="input-base"
                value={draft.formTitle}
                onChange={(event) => setDraft((previous) => ({ ...previous, formTitle: event.target.value }))}
              />
            </label>
            <label className="grid gap-1.5 text-sm text-slate-300">
              <span>Company label</span>
              <input
                className="input-base"
                value={draft.companyLabel}
                onChange={(event) => setDraft((previous) => ({ ...previous, companyLabel: event.target.value }))}
              />
            </label>
            <label className="grid gap-1.5 text-sm text-slate-300">
              <span>Email placeholder</span>
              <input
                className="input-base"
                value={draft.emailPlaceholder}
                onChange={(event) => setDraft((previous) => ({ ...previous, emailPlaceholder: event.target.value }))}
              />
            </label>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 p-1.5">
            <button type="button" className="button-base" onClick={() => setMode("create")} disabled={mode === "create"}>
              create
            </button>
            <button type="button" className="button-base" onClick={() => setMode("view")} disabled={mode === "view"}>
              view
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 lg:col-span-2">
            <label className="grid gap-1.5 text-sm text-slate-300">
              <span>Default account type</span>
              <select
                className="input-base"
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
            <label className="grid gap-1.5 text-sm text-slate-300">
              <span>Contact grid columns</span>
              <select
                className="input-base"
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
            <label className="inline-flex h-10 items-center gap-2 text-sm text-slate-300">
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
              <span>Require company for company type</span>
            </label>
          </div>

          <div className="grid gap-2 lg:col-span-2">
            <strong className="text-sm uppercase tracking-wide text-slate-300">Field Composition (Drag handle to reorder)</strong>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={draft.fieldOrder} strategy={verticalListSortingStrategy}>
                <div className="grid gap-2">
                  {draft.fieldOrder.map((key, index) => (
                    <SortableFieldItem
                      key={key}
                      keyName={key}
                      index={index}
                      checked={draft.enabledFields[key]}
                      onToggle={(checked) =>
                        setDraft((previous) => ({
                          ...previous,
                          enabledFields: {
                            ...previous.enabledFields,
                            [key]: checked,
                          },
                        }))
                      }
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <div className="grid gap-3 lg:col-span-2">
            <strong className="text-sm uppercase tracking-wide text-slate-300">Visual Custom Field Builder</strong>
            <div className="grid gap-3 rounded-xl border border-slate-700 bg-slate-900/70 p-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="grid gap-1 text-sm text-slate-300">
                <span>Type</span>
                <select className="input-base" value={newCustomKind} onChange={(event) => setNewCustomKind(event.target.value as CustomFieldKind)}>
                  <option value="text">text</option>
                  <option value="textarea">textarea</option>
                  <option value="email">email</option>
                  <option value="number">number</option>
                  <option value="checkbox">checkbox</option>
                  <option value="date">date</option>
                  <option value="select">select</option>
                </select>
              </label>
              <label className="grid gap-1 text-sm text-slate-300">
                <span>Path</span>
                <input className="input-base" value={newCustomPath} onChange={(event) => setNewCustomPath(event.target.value)} />
              </label>
              <label className="grid gap-1 text-sm text-slate-300">
                <span>Label</span>
                <input className="input-base" value={newCustomLabel} onChange={(event) => setNewCustomLabel(event.target.value)} />
              </label>
              <label className="grid gap-1 text-sm text-slate-300">
                <span>Placeholder</span>
                <input
                  className="input-base"
                  value={newCustomPlaceholder}
                  onChange={(event) => setNewCustomPlaceholder(event.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm text-slate-300">
                <span>Default</span>
                <input className="input-base" value={newCustomDefault} onChange={(event) => setNewCustomDefault(event.target.value)} />
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={newCustomRequired} onChange={(event) => setNewCustomRequired(event.target.checked)} />
                <span>Required</span>
              </label>
              {newCustomKind === "select" ? (
                <label className="grid gap-1 text-sm text-slate-300 md:col-span-2 xl:col-span-2">
                  <span>Options (`label:value, label:value`)</span>
                  <input className="input-base" value={newCustomOptions} onChange={(event) => setNewCustomOptions(event.target.value)} />
                </label>
              ) : null}
              <div className="flex items-end">
                <button type="button" className="button-base" onClick={addCustomField}>
                  Add Field
                </button>
              </div>
            </div>
            {draft.customFields.length > 0 ? (
              <div className="grid gap-2">
                {draft.customFields.map((fieldDraft) => (
                  <div
                    key={fieldDraft.id}
                    className="grid items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-300 sm:grid-cols-[1fr_auto]"
                  >
                    <span>
                      <strong>{fieldDraft.label}</strong> ({fieldDraft.kind}) - <code>{fieldDraft.path}</code>
                    </span>
                    <button type="button" className="button-base h-8" onClick={() => removeCustomField(fieldDraft.id)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-sm text-slate-400">No custom fields added yet.</span>
            )}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
          <section className="panel overflow-hidden">
            <header className="panel-header flex items-center justify-between bg-slate-900">
              <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 p-1">
                <button
                  type="button"
                  className={`button-base ${editorTab === "schema" ? "border-cyan-400 bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30" : ""}`}
                  onClick={() => setEditorTab("schema")}
                >
                  Schema JSON
                </button>
                <button
                  type="button"
                  className={`button-base ${editorTab === "source" ? "border-cyan-400 bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30" : ""}`}
                  onClick={() => setEditorTab("source")}
                >
                  Builder Source
                </button>
              </div>
              <span className="font-mono text-xs text-slate-400">{editorTab === "schema" ? "Editable override" : "Generated"}</span>
            </header>

            <div className="p-4">
              {editorTab === "source" ? (
                  <MonacoJsonEditor value={source} onChange={() => undefined} readOnly height="72vh" />
                ) : (
                <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="grid gap-3">
                    <MonacoJsonEditor
                      ref={schemaEditorRef}
                      value={jsonEditorValue}
                      onChange={(next) => {
                        setSchemaOverrideText(next);
                        setSchemaError(null);
                      }}
                      issues={liveSchemaIssues}
                      height="72vh"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className="button-base"
                        onClick={() => {
                          try {
                            const parsed = JSON.parse(jsonEditorValue) as FormDefinition;
                            const issues = validateFormDefinitionShape(parsed);
                            setSchemaIssues(issues);
                            if (issues.length > 0) {
                              setSchemaOverride(null);
                              setSchemaError("Schema structure validation failed");
                              return;
                            }
                            setSchemaOverride(parsed);
                            setDraft((previous) => deriveDraftFromSchema(parsed, previous));
                            setSchemaError(null);
                            pushSnapshot("apply", jsonEditorValue);
                          } catch (error) {
                            setSchemaIssues([]);
                            setSchemaError(error instanceof Error ? error.message : "Invalid JSON");
                          }
                        }}
                      >
                        Apply JSON Override
                      </button>
                      <button type="button" className="button-base" onClick={() => schemaEditorRef.current?.format()}>
                        Format JSON
                      </button>
                      <button
                        type="button"
                        className="button-base"
                        onClick={() => {
                          pushSnapshot("manual", jsonEditorValue);
                        }}
                      >
                        Save Snapshot
                      </button>
                      <button
                        type="button"
                        className="button-base"
                        onClick={() => {
                          setSchemaOverride(null);
                          setSchemaOverrideText("");
                          setSchemaError(null);
                          setSchemaIssues([]);
                        }}
                      >
                        Reset to Generated
                      </button>
                      <button type="button" className="button-base" onClick={exportSchemaJson}>
                        Export JSON
                      </button>
                      <label className="button-base cursor-pointer">
                        Import JSON
                        <input
                          type="file"
                          accept="application/json,.json"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              void importSchemaFromFile(file);
                            }
                            event.currentTarget.value = "";
                          }}
                        />
                      </label>
                    </div>
                    <div className="grid gap-2 rounded-lg border border-slate-700 bg-slate-900/70 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">History</span>
                        {lastAutosaveIso ? (
                          <span className="text-xs text-slate-400">Autosaved: {new Date(lastAutosaveIso).toLocaleTimeString()}</span>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          className="input-base h-9 max-w-[420px]"
                          value={selectedSnapshotId}
                          onChange={(event) => setSelectedSnapshotId(event.target.value)}
                        >
                          <option value="">Select snapshot</option>
                          {snapshots.map((snapshot) => (
                            <option key={snapshot.id} value={snapshot.id}>
                              {new Date(snapshot.createdAtIso).toLocaleString()} ({snapshot.source})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="button-base"
                          disabled={!selectedSnapshot}
                          onClick={() => {
                            if (!selectedSnapshot) {
                              return;
                            }
                            setSchemaOverrideText(selectedSnapshot.content);
                            setSchemaOverride(null);
                            setSchemaError(null);
                            setSchemaIssues([]);
                          }}
                        >
                          Restore
                        </button>
                        <button
                          type="button"
                          className="button-base"
                          disabled={snapshots.length === 0}
                          onClick={() => {
                            setSnapshots([]);
                            setSelectedSnapshotId("");
                          }}
                        >
                          Clear History
                        </button>
                      </div>
                    </div>
                    {schemaError ? <span className="text-sm text-red-600">{schemaError}</span> : null}
                    {schemaIssues.length > 0 ? (
                      <ul className="grid gap-1 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {schemaIssues.map((issue) => (
                          <li key={`${issue.path}:${issue.message}`}>
                            <code>{issue.path}</code>: {issue.message}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <aside className="grid content-start gap-2 rounded-xl border border-slate-700 bg-slate-900/70 p-3">
                    <strong className="text-sm uppercase tracking-wide text-slate-300">Contract Hints</strong>
                    {contractHints.map((hint) => (
                      <div key={hint.title} className="grid gap-1 rounded-lg border border-slate-700 bg-slate-950 p-3">
                        <span className="text-sm font-semibold text-slate-200">{hint.title}</span>
                        <p className="text-xs leading-5 text-slate-400">{hint.description}</p>
                        <pre className="overflow-auto rounded-md bg-slate-900 p-2 font-mono text-[11px] text-slate-100">
                          {hint.code}
                        </pre>
                      </div>
                    ))}
                  </aside>
                </div>
              )}
            </div>
          </section>

          <section className="panel bg-slate-900/80">
            <header className="panel-header bg-slate-900">Live Preview</header>
            <div className="runtime-theme max-h-[95vh] min-h-[72vh] overflow-auto p-6">
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
