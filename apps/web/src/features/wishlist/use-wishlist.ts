"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { addToWishlist, listWishlist, removeFromWishlist } from "@/features/auth/api";
import { useAccessToken } from "@/features/auth/session";
import type { ProductListItem } from "@/types/catalog";

export const WISHLIST_QUERY_KEY = ["wishlist"] as const;

export function useWishlist() {
  const { token } = useAccessToken();

  const query = useQuery({
    queryKey: [...WISHLIST_QUERY_KEY, token],
    queryFn: listWishlist,
    enabled: Boolean(token),
    retry: false,
  });

  return { ...query, isAuthenticated: Boolean(token) };
}

export function useWishlistToggle() {
  const { token } = useAccessToken();
  const queryClient = useQueryClient();
  const { data } = useWishlist();

  const ids = useMemo(() => new Set((data ?? []).map((item) => item.id)), [data]);

  const mutation = useMutation({
    mutationFn: ({ productId, next }: { productId: string; next: boolean }) =>
      next ? addToWishlist(productId) : removeFromWishlist(productId),
    onSuccess: (items: ProductListItem[]) => {
      queryClient.setQueriesData({ queryKey: WISHLIST_QUERY_KEY }, items);
    },
  });

  const toggle = useCallback(
    (productId: string) => mutation.mutateAsync({ productId, next: !ids.has(productId) }),
    [mutation, ids],
  );

  return {
    isAuthenticated: Boolean(token),
    contains: (productId: string) => ids.has(productId),
    toggle,
    isPending: mutation.isPending,
  };
}
