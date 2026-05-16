import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  RemoteFormRetryDelay,
  UseRemoteFormDefinitionOptions,
  UseRemoteFormDefinitionResult,
} from "../types/public-types";

interface RemoteFormCacheEntry {
  payload?: UseRemoteFormDefinitionResult["payload"];
  error?: Error;
  updatedAt?: number;
  expiresAt?: number;
  inFlight?: Promise<UseRemoteFormDefinitionResult["payload"]>;
}

const remoteFormCache = new Map<string, RemoteFormCacheEntry>();

function nowMs(): number {
  return Date.now();
}

function normalizeDelayMs(
  retryDelayMs: RemoteFormRetryDelay | undefined,
  attempt: number,
  error: Error,
): number {
  if (typeof retryDelayMs === "function") {
    return Math.max(0, retryDelayMs(attempt, error));
  }

  if (typeof retryDelayMs === "number") {
    return Math.max(0, retryDelayMs);
  }

  // Exponential backoff capped at 5s.
  return Math.min(5000, 250 * Math.pow(2, Math.max(0, attempt - 1)));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function pruneExpiredCacheEntries(): void {
  const current = nowMs();
  for (const [cacheKey, entry] of remoteFormCache.entries()) {
    if (!entry.inFlight && typeof entry.expiresAt === "number" && entry.expiresAt <= current) {
      remoteFormCache.delete(cacheKey);
    }
  }
}

function getOrCreateEntry(cacheKey: string): RemoteFormCacheEntry {
  const existing = remoteFormCache.get(cacheKey);
  if (existing) return existing;

  const next: RemoteFormCacheEntry = {};
  remoteFormCache.set(cacheKey, next);
  return next;
}

async function loadWithRetry(
  runner: () => Promise<UseRemoteFormDefinitionResult["payload"]>,
  retry: number,
  retryDelayMs: RemoteFormRetryDelay | undefined,
): Promise<UseRemoteFormDefinitionResult["payload"]> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retry; attempt += 1) {
    try {
      return await runner();
    } catch (error) {
      if (isAbortError(error)) throw error;

      lastError = error instanceof Error ? error : new Error("Failed to load remote form");
      if (attempt >= retry) {
        throw lastError;
      }

      await sleep(normalizeDelayMs(retryDelayMs, attempt + 1, lastError));
    }
  }

  throw lastError ?? new Error("Failed to load remote form");
}

async function loadFromSource(
  options: {
    loader: UseRemoteFormDefinitionOptions["loader"];
    retry: number;
    retryDelayMs?: RemoteFormRetryDelay;
    cacheTimeMs: number;
    staleTimeMs: number;
    cacheKey: string;
    force: boolean;
    signal: AbortSignal;
  },
): Promise<UseRemoteFormDefinitionResult["payload"]> {
  pruneExpiredCacheEntries();

  const entry = getOrCreateEntry(options.cacheKey);
  const current = nowMs();

  const isFresh =
    !options.force &&
    entry.payload !== undefined &&
    typeof entry.updatedAt === "number" &&
    current - entry.updatedAt <= options.staleTimeMs;

  if (isFresh) {
    return entry.payload;
  }

  if (!options.force && entry.inFlight) {
    return entry.inFlight;
  }

  const requestPromise = loadWithRetry(
    () => options.loader({ key: options.cacheKey, signal: options.signal }),
    options.retry,
    options.retryDelayMs,
  )
    .then((payload) => {
      const updatedAt = nowMs();
      entry.payload = payload;
      entry.error = undefined;
      entry.updatedAt = updatedAt;
      entry.expiresAt = options.cacheTimeMs > 0 ? updatedAt + options.cacheTimeMs : undefined;
      return payload;
    })
    .catch((error) => {
      if (!isAbortError(error)) {
        entry.error = error instanceof Error ? error : new Error("Failed to load remote form");
      }
      throw error;
    })
    .finally(() => {
      entry.inFlight = undefined;
    });

  entry.inFlight = requestPromise;
  return requestPromise;
}

export function useRemoteFormDefinition({
  key = "default",
  loader,
  autoLoad = true,
  staleTimeMs = 0,
  cacheTimeMs = 5 * 60 * 1000,
  retry = 0,
  retryDelayMs,
}: UseRemoteFormDefinitionOptions): UseRemoteFormDefinitionResult {
  const cacheKey = useMemo(() => `remote-form:${key}`, [key]);
  const [status, setStatus] = useState<UseRemoteFormDefinitionResult["status"]>(() => {
    const cached = remoteFormCache.get(cacheKey);
    return cached?.payload ? "success" : autoLoad ? "loading" : "idle";
  });
  const [isFetching, setIsFetching] = useState<boolean>(() => {
    const cached = remoteFormCache.get(cacheKey);
    return Boolean(cached?.inFlight) || (autoLoad && !cached?.payload);
  });
  const [payload, setPayload] = useState<UseRemoteFormDefinitionResult["payload"]>(() =>
    remoteFormCache.get(cacheKey)?.payload,
  );
  const [error, setError] = useState<Error | undefined>(() => remoteFormCache.get(cacheKey)?.error);
  const [updatedAt, setUpdatedAt] = useState<number | undefined>(() => remoteFormCache.get(cacheKey)?.updatedAt);

  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | undefined>(undefined);

  const executeLoad = useCallback(async (force: boolean): Promise<void> => {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsFetching(true);
    setError(undefined);
    setStatus((currentStatus) => (currentStatus === "success" ? "success" : "loading"));

    try {
      const loadedPayload = await loadFromSource({
        cacheKey,
        loader,
        staleTimeMs,
        cacheTimeMs,
        retry,
        retryDelayMs,
        force,
        signal: controller.signal,
      });

      if (!isMountedRef.current || requestId !== requestIdRef.current) return;

      const entry = remoteFormCache.get(cacheKey);
      setPayload(loadedPayload);
      setUpdatedAt(entry?.updatedAt);
      setStatus("success");
      setError(undefined);
    } catch (loadError) {
      if (!isMountedRef.current || requestId !== requestIdRef.current || isAbortError(loadError)) return;
      setStatus("error");
      setError(loadError instanceof Error ? loadError : new Error("Failed to load remote form"));
    } finally {
      if (!isMountedRef.current || requestId !== requestIdRef.current) return;
      setIsFetching(false);
    }
  }, [cacheKey, loader, staleTimeMs, cacheTimeMs, retry, retryDelayMs]);

  const reload = useCallback(async (): Promise<void> => {
    await executeLoad(true);
  }, [executeLoad]);

  const invalidate = useCallback(() => {
    const entry = remoteFormCache.get(cacheKey);
    if (entry?.inFlight) {
      abortRef.current?.abort();
    }

    remoteFormCache.delete(cacheKey);
    setPayload(undefined);
    setUpdatedAt(undefined);
    setError(undefined);
    setStatus("idle");
    setIsFetching(false);
  }, [cacheKey]);

  useEffect(() => {
    isMountedRef.current = true;
    const cached = remoteFormCache.get(cacheKey);
    if (cached?.payload) {
      setPayload(cached.payload);
      setUpdatedAt(cached.updatedAt);
      setStatus("success");
      setIsFetching(Boolean(cached.inFlight));
      setError(cached.error);
    }

    if (autoLoad) {
      void executeLoad(false);
    }

    return () => {
      isMountedRef.current = false;
      abortRef.current?.abort();
    };
  }, [autoLoad, cacheKey, executeLoad]);

  return {
    status,
    isFetching,
    payload,
    error,
    updatedAt,
    reload,
    invalidate,
  };
}
