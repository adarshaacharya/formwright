import type { RemoteFormPayload } from "@formwright/contract";

import type { LoadRemoteFormOptions } from "./types";
import { parseRemoteFormPayload } from "./parse-remote-form-payload";

export async function loadRemoteForm(options: LoadRemoteFormOptions): Promise<RemoteFormPayload> {
  const fetcher = options.fetcher ?? fetch;
  const headers = new Headers(options.init?.headers);
  const customHeaders = new Headers(options.headers);
  customHeaders.forEach((value, key) => headers.set(key, value));

  const response = await fetcher(options.url, {
    ...options.init,
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to load remote form (${response.status}) from ${options.url}`);
  }

  const payload = (await response.json()) as unknown;
  return parseRemoteFormPayload(payload);
}
