export interface LoadRemoteFormOptions {
  url: string;
  fetcher?: typeof fetch;
  headers?: HeadersInit;
  init?: RequestInit;
}
