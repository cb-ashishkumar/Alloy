"use client";

import { emitApiCall } from "@/lib/apiLog";

type ApiFetchOptions = {
  /**
   * Endpoint string to show in the UI chips. Use a templated path for dynamic routes.
   * Example: "/api/chargebee/subscriptions/:id/entitlements"
   */
  logEndpoint?: string;
};

export async function apiFetch(
  input: string,
  init?: RequestInit,
  options?: ApiFetchOptions,
) {
  emitApiCall(options?.logEndpoint ?? input);
  return fetch(input, init);
}

