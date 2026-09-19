"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { getMe } from "@/features/auth/api";
import { AUTH_CHANGED_EVENT, clearAccessToken, getAccessToken } from "@/lib/api/client";

/** Tracks the bearer token in localStorage and keeps every consumer in sync. */
export function useAccessToken(): { token: string | null; ready: boolean } {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const read = () => setToken(getAccessToken());
    read();
    setReady(true);
    window.addEventListener(AUTH_CHANGED_EVENT, read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, read);
      window.removeEventListener("storage", read);
    };
  }, []);

  return { token, ready };
}

export function useSession() {
  const { token, ready } = useAccessToken();
  const queryClient = useQueryClient();
  const router = useRouter();

  const profile = useQuery({
    queryKey: ["me", token],
    queryFn: getMe,
    enabled: Boolean(token),
    retry: false,
    staleTime: 60_000,
  });

  const signOut = useCallback(() => {
    clearAccessToken();
    queryClient.removeQueries({ queryKey: ["me"] });
    queryClient.removeQueries({ queryKey: ["orders"] });
    queryClient.removeQueries({ queryKey: ["addresses"] });
    queryClient.removeQueries({ queryKey: ["wishlist"] });
    queryClient.invalidateQueries({ queryKey: ["cart"] });
    router.push("/account");
  }, [queryClient, router]);

  return {
    ready,
    isAuthenticated: Boolean(token) && !profile.isError,
    isLoading: Boolean(token) && profile.isLoading,
    customer: profile.data ?? null,
    signOut,
  };
}
