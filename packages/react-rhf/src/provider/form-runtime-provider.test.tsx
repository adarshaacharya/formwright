// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import type { FormDefinition } from "@formwright/contract";
import { createFormRuntime, type FormPlugin } from "@formwright/core";
import { FormRuntimeProvider } from "./form-runtime-provider";
import { FormRuntimeRoot } from "../components/form-runtime-root";
import { useRuntimeContext } from "./runtime-context";
import { useFormContext } from "react-hook-form";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function makeForm(overrides?: Partial<FormDefinition>): FormDefinition {
  return {
    version: "1.0",
    formId: "test-form",
    dataSchema: {
      rootType: "object",
      fields: {
        accountType: {
          valueType: "string",
          default: "individual",
          enum: ["individual", "company"],
        },
        "company.name": {
          valueType: "string",
          default: "",
        },
        tags: {
          valueType: "array",
          itemType: "string",
          default: [],
        },
      },
    },
    uiSchema: {
      nodes: {
        accountType: {
          fieldType: "select",
          label: "Account Type",
          options: [
            { label: "Individual", value: "individual" },
            { label: "Company", value: "company" },
          ],
        },
        "company.name": {
          fieldType: "text",
          label: "Company Name",
        },
        tags: {
          fieldType: "array",
          label: "Tags",
        },
      },
      layout: {
        type: "stack",
        id: "root",
        children: [
          { type: "field", ref: "accountType" },
          { type: "field", ref: "company.name" },
          { type: "field", ref: "tags" },
        ],
      },
    },
    behaviorSchema: {
      rules: [
        {
          id: "hide-company-name-when-individual",
          when: { eq: [{ var: "accountType" }, "individual"] },
          effects: [{ type: "hide", target: "company.name" }],
        },
        {
          id: "show-company-name-when-company",
          when: { eq: [{ var: "accountType" }, "company"] },
          effects: [{ type: "show", target: "company.name" }],
        },
      ],
    },
    ...overrides,
  };
}

function ValuesProbe(): React.JSX.Element {
  const { evaluation } = useRuntimeContext();
  return <pre data-testid="values">{JSON.stringify(evaluation.values)}</pre>;
}

function renderForm(hiddenFieldPolicy: "keep" | "clear" | "unregister") {
  const runtime = createFormRuntime({
    form: makeForm(),
    context: { mode: "create" },
  });

  return render(
    <FormRuntimeProvider runtime={runtime} hiddenFieldPolicy={hiddenFieldPolicy}>
      <FormRuntimeRoot rootLayoutId="root" />
      <ValuesProbe />
    </FormRuntimeProvider>,
  );
}

function makeRemoteDatasourceForm(): FormDefinition {
  return makeForm({
    dataSchema: {
      rootType: "object",
      fields: {
        country: {
          valueType: "string",
          default: "",
        },
      },
    },
    uiSchema: {
      nodes: {
        country: {
          fieldType: "select",
          label: "Country",
          dataSource: "countries",
        },
      },
      layout: {
        type: "stack",
        id: "remote-root",
        children: [{ type: "field", ref: "country" }],
      },
    },
    behaviorSchema: {
      dataSources: {
        countries: {
          type: "remote",
          endpoint: "/api/countries",
          dependsOn: [],
        },
      },
    },
  });
}

function createDelayedDatasourcePlugin(): FormPlugin {
  return {
    kind: "datasource",
    identity: { name: "@formwright/test/remote-datasource", version: "0.0.0" },
    sourceType: "remote",
    async load() {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return {
        options: [
          { label: "Canada", value: "CA" },
          { label: "Japan", value: "JP" },
        ],
      };
    },
  };
}

function changeTextInput(element: HTMLElement, value: string): void {
  fireEvent.change(element, { target: { value } as any });
}

function UnrelatedSetter(): React.JSX.Element {
  const form = useFormContext<Record<string, unknown>>();
  return (
    <button type="button" onClick={() => form.setValue("company.name" as never, "Acme" as never)}>
      set unrelated
    </button>
  );
}

describe("@formwright/react-rhf adapter", () => {
  it("keeps hidden values when policy is keep", async () => {
    renderForm("keep");

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "company" } });
    changeTextInput(screen.getByRole("textbox"), "Acme");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "individual" } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "company" } });

    await waitFor(() =>
      expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("Acme"),
    );
    const values = JSON.parse(screen.getByTestId("values").textContent ?? "{}") as Record<string, unknown>;
    expect(values["company.name"]).toBe("Acme");
  });

  it("clears hidden values when policy is clear", async () => {
    renderForm("clear");

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "company" } });
    changeTextInput(screen.getByRole("textbox"), "Acme");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "individual" } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "company" } });

    await waitFor(() =>
      expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe(""),
    );
    const values = JSON.parse(screen.getByTestId("values").textContent ?? "{}") as Record<string, unknown>;
    expect(values["company.name"]).toBeUndefined();
  });

  it("supports array append and editing through the default array renderer", async () => {
    renderForm("keep");

    fireEvent.click(screen.getByRole("button", { name: "add item" }));
    const tagsInput = screen.getAllByRole("textbox")[0];
    changeTextInput(tagsInput, "alpha");

    await waitFor(() => {
      const values = JSON.parse(screen.getByTestId("values").textContent ?? "{}") as Record<string, unknown>;
      expect(values.tags).toEqual(["alpha"]);
    });
  });

  it("does not re-evaluate when a non-dependent field changes", async () => {
    const evaluate = vi.fn(() => ({
      fieldState: {},
      layoutState: {},
      values: {},
      valueMutations: [],
    }));
    const runtime = {
      getFormDefinition: () => makeForm(),
      getResolvedFields: () => ({}),
      getResolvedLayout: () => ({ type: "stack", rendererKey: "stack", node: { type: "stack", children: [] } }),
      getEvaluationDependencies: () => ["accountType" as const],
      evaluate,
    };

    render(
      <FormRuntimeProvider runtime={runtime as never}>
        <UnrelatedSetter />
      </FormRuntimeProvider>,
    );

    const initialCalls = evaluate.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "set unrelated" }));
    await waitFor(() => expect(evaluate.mock.calls.length).toBe(initialCalls));
  });

  it("shows loading and then remote datasource options", async () => {
    vi.useFakeTimers();
    const runtime = createFormRuntime({
      form: makeRemoteDatasourceForm(),
      context: { mode: "create" },
      plugins: [createDelayedDatasourcePlugin()],
    });

    render(
      <FormRuntimeProvider runtime={runtime}>
        <FormRuntimeRoot rootLayoutId="remote-root" />
      </FormRuntimeProvider>,
    );

    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getAllByText(/Loading options/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("combobox").getAttribute("aria-busy")).toBe("true");

    await act(async () => {
      vi.advanceTimersByTime(60);
    });

    expect(screen.queryByRole("option", { name: "Canada" })).not.toBeNull();
    expect(screen.getByRole("combobox").getAttribute("aria-busy")).toBe("false");
  });
});
