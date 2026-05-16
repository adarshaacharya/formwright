// @vitest-environment jsdom
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { RemoteFormPayload } from "@formwright/contract";

import { useRemoteFormDefinition } from "./use-remote-form-definition";

afterEach(() => {
  vi.useRealTimers();
});

let keyCounter = 0;

function nextKey(prefix: string): string {
  keyCounter += 1;
  return `${prefix}-${keyCounter}`;
}

function makePayload(formId: string): RemoteFormPayload {
  return {
    version: "1.0",
    form: {
      version: "1.0",
      formId,
      dataSchema: {
        rootType: "object",
        fields: {
          name: { valueType: "string" },
        },
      },
      uiSchema: {
        nodes: {
          name: { fieldType: "text" },
        },
        layout: {
          type: "stack",
          id: "root",
          children: [{ type: "field", ref: "name" }],
        },
      },
    },
  };
}

describe("useRemoteFormDefinition", () => {
  it("loads payload on mount", async () => {
    const loader = vi.fn(async () => makePayload("profile"));
    const key = nextKey("autoload");

    const { result } = renderHook(() =>
      useRemoteFormDefinition({
        key,
        loader,
      }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("success");
    });

    expect(result.current.payload?.form.formId).toBe("profile");
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("dedupes in-flight requests for same key", async () => {
    const loader = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return makePayload("dedupe");
    });

    const key = nextKey("dedupe");
    const first = renderHook(() => useRemoteFormDefinition({ key, loader }));
    const second = renderHook(() => useRemoteFormDefinition({ key, loader }));

    await waitFor(() => {
      expect(first.result.current.status).toBe("success");
      expect(second.result.current.status).toBe("success");
    });

    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("retries failed loads and succeeds", async () => {
    const loader = vi.fn(async () => {
      if (loader.mock.calls.length < 3) {
        throw new Error("temporary error");
      }
      return makePayload("retry-success");
    });

    const key = nextKey("retry");
    const { result } = renderHook(() =>
      useRemoteFormDefinition({
        key,
        loader,
        retry: 2,
        retryDelayMs: 0,
      }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("success");
    });

    expect(loader).toHaveBeenCalledTimes(3);
    expect(result.current.payload?.form.formId).toBe("retry-success");
  });

  it("reuses fresh cached payload when staleTime is set", async () => {
    const loader = vi.fn(async () => makePayload("cache-hit"));
    const key = nextKey("cache");

    const first = renderHook(() =>
      useRemoteFormDefinition({
        key,
        loader,
        staleTimeMs: 60_000,
      }),
    );

    await waitFor(() => {
      expect(first.result.current.status).toBe("success");
    });

    first.unmount();

    const second = renderHook(() =>
      useRemoteFormDefinition({
        key,
        loader,
        staleTimeMs: 60_000,
      }),
    );

    await waitFor(() => {
      expect(second.result.current.status).toBe("success");
    });

    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("keeps latest reload result when reloads overlap", async () => {
    let resolveFirst: ((value: RemoteFormPayload) => void) | undefined;

    const loader = vi.fn(async ({ signal }: { signal: AbortSignal }) => {
      const callIndex = loader.mock.calls.length;
      if (callIndex === 1) {
        return await new Promise<RemoteFormPayload>((resolve, reject) => {
          resolveFirst = resolve;
          signal.addEventListener("abort", () => {
            reject(new DOMException("aborted", "AbortError"));
          });
        });
      }

      return makePayload("second");
    });

    const key = nextKey("race");
    const { result } = renderHook(() =>
      useRemoteFormDefinition({
        key,
        loader,
        autoLoad: false,
      }),
    );

    const firstReload = result.current.reload();
    await Promise.resolve();
    const secondReload = result.current.reload();

    resolveFirst?.(makePayload("first"));

    await secondReload;
    await firstReload.catch(() => undefined);

    await waitFor(() => {
      expect(result.current.status).toBe("success");
      expect(result.current.payload?.form.formId).toBe("second");
    });
  });
});
