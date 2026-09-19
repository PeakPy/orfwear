import { siteConfig } from "@/config/site";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const CART_KEY_STORAGE = "orf_cart_key";
const TOKEN_STORAGE = "orf_access_token";

export const AUTH_CHANGED_EVENT = "orf:auth-changed";

export function getCartKey(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CART_KEY_STORAGE);
}

export function setCartKey(key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_KEY_STORAGE, key);
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_STORAGE);
}

export function setAccessToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_STORAGE, token);
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function clearAccessToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_STORAGE);
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

function ensureCartKey(): string {
  const existing = getCartKey();
  if (existing) return existing;
  const key =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "")
      : `anon${Date.now().toString(36)}`;
  setCartKey(key);
  return key;
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  idempotencyKey?: string;
  /** Bypass the stored token (server components pass nothing). */
  anonymous?: boolean;
};

const GENERIC_ERROR = "درخواست انجام نشد. دوباره تلاش کنید.";

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (typeof window !== "undefined") {
    headers.set("X-Cart-Key", ensureCartKey());
    if (!options.anonymous) {
      const token = getAccessToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }
  }

  if (options.idempotencyKey) {
    headers.set("Idempotency-Key", options.idempotencyKey);
  }

  const { body, ...rest } = options;
  delete rest.idempotencyKey;
  delete rest.anonymous;

  let response: Response;
  try {
    response = await fetch(`${siteConfig.apiBaseUrl}${path}`, {
      ...rest,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("اتصال به سرور برقرار نشد.", 0, "network_error");
  }

  if (!response.ok) {
    let code: string | undefined;
    let message = GENERIC_ERROR;
    try {
      const data = (await response.json()) as { code?: string; message?: string };
      code = data.code;
      if (data.message) message = data.message;
    } catch {
      // Non-JSON error bodies fall back to the generic message.
    }
    if (response.status === 401) {
      clearAccessToken();
    }
    throw new ApiError(message, response.status, code);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = (await response.json()) as T & { cart_key?: string };
  if (typeof window !== "undefined" && data && typeof data === "object" && data.cart_key) {
    setCartKey(String(data.cart_key));
  }
  return data as T;
}
