/**
 * Staff session helpers.
 * Cookie holds display info + API bearer token from POST /admin/auth/login.
 */

export const ADMIN_SESSION_COOKIE = "orf_admin_session";

export type StaffSession = {
  email: string;
  displayName: string;
  issuedAt: string;
  token: string;
};

export function encodeSession(session: StaffSession): string {
  return encodeURIComponent(JSON.stringify(session));
}

export function decodeSession(raw: string | undefined | null): StaffSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as StaffSession;
    if (!parsed?.email || !parsed?.displayName || !parsed?.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function createSession(input: {
  email: string;
  displayName: string;
  token: string;
}): StaffSession {
  return {
    email: input.email.trim().toLowerCase(),
    displayName: input.displayName,
    token: input.token,
    issuedAt: new Date().toISOString(),
  };
}

/** Client-only cookie write. */
export function writeSessionCookie(session: StaffSession): void {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 12;
  document.cookie = `${ADMIN_SESSION_COOKIE}=${encodeSession(session)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export function clearSessionCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${ADMIN_SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function readSessionCookie(): StaffSession | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${ADMIN_SESSION_COOKIE}=`));
  if (!match) return null;
  return decodeSession(match.slice(ADMIN_SESSION_COOKIE.length + 1));
}
