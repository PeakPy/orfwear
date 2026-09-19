import { siteConfig } from "@/config/site";
import { readSessionCookie } from "@/lib/auth/session";

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

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const useAuth = options.auth !== false;
  if (useAuth) {
    const session = readSessionCookie();
    if (session?.token) {
      headers.set("Authorization", `Bearer ${session.token}`);
    }
  }

  const response = await fetch(`${siteConfig.apiBaseUrl}${path}`, {
    ...options,
    headers,
    credentials: "include",
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    let code: string | undefined;
    let message = response.statusText;
    try {
      const data = (await response.json()) as { code?: string; message?: string };
      code = data.code;
      message = data.message ?? message;
    } catch {
      // ignore non-json error bodies
    }
    throw new ApiError(message, response.status, code);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
