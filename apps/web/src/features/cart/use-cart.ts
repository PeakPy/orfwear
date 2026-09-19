"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { addCartLine, getCurrentCart, removeCartLine, updateCartLine } from "@/features/cart/api";
import { useAccessToken } from "@/features/auth/session";
import { ApiError } from "@/lib/api/client";
import { useCartStore } from "@/stores/cart-store";
import type { Cart } from "@/types/catalog";

export const CART_QUERY_KEY = ["cart"] as const;

export function useCart() {
  const { token } = useAccessToken();
  const setItemCount = useCartStore((state) => state.setItemCount);

  const query = useQuery({
    queryKey: [...CART_QUERY_KEY, token],
    queryFn: getCurrentCart,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (query.data) setItemCount(query.data.item_count);
  }, [query.data, setItemCount]);

  return query;
}

/** Shared write path so every surface updates the badge and cache identically. */
export function useCartMutations(options?: { onError?: (message: string) => void }) {
  const queryClient = useQueryClient();
  const setItemCount = useCartStore((state) => state.setItemCount);

  const apply = (cart: Cart) => {
    queryClient.setQueriesData({ queryKey: CART_QUERY_KEY }, cart);
    setItemCount(cart.item_count);
  };

  const handleError = (error: unknown) => {
    const message =
      error instanceof ApiError ? error.message : "انجام نشد. دوباره تلاش کنید.";
    options?.onError?.(message);
  };

  const add = useMutation({
    mutationFn: ({ variantId, quantity }: { variantId: string; quantity?: number }) =>
      addCartLine(variantId, quantity ?? 1),
    onSuccess: apply,
    onError: handleError,
  });

  const update = useMutation({
    mutationFn: ({ lineId, quantity }: { lineId: string; quantity: number }) =>
      updateCartLine(lineId, quantity),
    onSuccess: apply,
    onError: handleError,
  });

  const remove = useMutation({
    mutationFn: (lineId: string) => removeCartLine(lineId),
    onSuccess: apply,
    onError: handleError,
  });

  return { add, update, remove };
}
