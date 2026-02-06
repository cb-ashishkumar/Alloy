export type ApiLogEventDetail = {
  endpoint: string;
  ts: number;
};

const EVENT_NAME = "alloy:api-call";

export function emitApiCall(endpoint: string) {
  if (typeof window === "undefined") return;
  const detail: ApiLogEventDetail = { endpoint, ts: Date.now() };
  window.dispatchEvent(new CustomEvent<ApiLogEventDetail>(EVENT_NAME, { detail }));
}

export function onApiCall(handler: (detail: ApiLogEventDetail) => void) {
  if (typeof window === "undefined") return () => {};
  const listener = (ev: Event) => {
    const e = ev as CustomEvent<ApiLogEventDetail>;
    if (!e.detail?.endpoint) return;
    handler(e.detail);
  };
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}

