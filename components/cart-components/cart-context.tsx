"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useUserAuth } from "@/components/auth/user-auth-context";

export type CartItem = {
  id: string;
  productId: string;
  slug: string;
  name: string;
  description?: string | null;
  price: number;
  image: string;
  quantity: number;
  stock: number;
  isOutOfStock: boolean;
  isSelected: boolean;
};

type CartPayload = {
  cartId: string | null;
  items: CartItem[];
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: { productId: string; quantity?: number }) => Promise<{ ok: boolean; error?: string }>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  selectedItems: Record<string, boolean>;
  setItemSelected: (id: string, selected: boolean) => Promise<void>;
  isCartOpen: boolean;
  isSyncing: boolean;
  refreshCart: () => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

function toSelectedMap(items: CartItem[]) {
  return items.reduce<Record<string, boolean>>((map, item) => {
    map[item.id] = item.isSelected && !item.isOutOfStock;
    return map;
  }, {});
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUserAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const applyCartPayload = useCallback((payload: CartPayload | null | undefined) => {
    const nextItems = payload?.items ?? [];
    setItems(nextItems);
    setSelectedItems(toSelectedMap(nextItems));
  }, []);

  const refreshCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      setSelectedItems({});
      return;
    }

    setIsSyncing(true);
    try {
      const response = await fetch("/api/cart", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { cart?: CartPayload };
      applyCartPayload(data.cart ?? null);
    } catch {
      // Best effort. Keep current state on transient network failure.
    } finally {
      setIsSyncing(false);
    }
  }, [applyCartPayload, user]);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setSelectedItems({});
      return;
    }

    void refreshCart();
  }, [refreshCart, user]);

  const addItem: CartContextValue["addItem"] = useCallback(
    async (item) => {
      if (!user) {
        return { ok: false, error: "Silakan login terlebih dahulu." };
      }

      setIsSyncing(true);
      try {
        const response = await fetch("/api/cart/items", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: item.productId,
            quantity: item.quantity ?? 1,
          }),
        });

        const data = (await response.json().catch(() => ({}))) as {
          cart?: CartPayload;
          error?: string;
        };

        if (!response.ok) {
          return { ok: false, error: data.error ?? "Gagal menambahkan produk ke keranjang." };
        }

        applyCartPayload(data.cart ?? null);
        return { ok: true };
      } catch {
        return { ok: false, error: "Terjadi gangguan jaringan. Coba lagi." };
      } finally {
        setIsSyncing(false);
      }
    },
    [applyCartPayload, user],
  );

  const removeItem: CartContextValue["removeItem"] = useCallback(
    async (id) => {
      if (!user) return;

      try {
        const response = await fetch(`/api/cart/items/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        const data = (await response.json().catch(() => ({}))) as { cart?: CartPayload };
        if (response.ok) {
          applyCartPayload(data.cart ?? null);
          return;
        }
        await refreshCart();
      } catch {
        await refreshCart();
      }
    },
    [applyCartPayload, refreshCart, user],
  );

  const updateQuantity: CartContextValue["updateQuantity"] = useCallback(
    async (id, quantity) => {
      if (!user) return;

      try {
        const response = await fetch(`/api/cart/items/${id}`, {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quantity: Math.max(1, quantity),
          }),
        });
        const data = (await response.json().catch(() => ({}))) as { cart?: CartPayload };
        if (response.ok) {
          applyCartPayload(data.cart ?? null);
          return;
        }
        await refreshCart();
      } catch {
        await refreshCart();
      }
    },
    [applyCartPayload, refreshCart, user],
  );

  const setItemSelected: CartContextValue["setItemSelected"] = useCallback(
    async (id, selected) => {
      if (!user) return;

      setSelectedItems((prev) => ({ ...prev, [id]: selected }));

      try {
        const response = await fetch(`/api/cart/items/${id}`, {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isSelected: selected,
          }),
        });

        if (!response.ok) {
          await refreshCart();
          return;
        }

        const data = (await response.json().catch(() => ({}))) as { cart?: CartPayload };
        applyCartPayload(data.cart ?? null);
      } catch {
        await refreshCart();
      }
    },
    [applyCartPayload, refreshCart, user],
  );

  const openCart = useCallback(() => {
    setIsCartOpen(true);
    void refreshCart();
  }, [refreshCart]);
  const closeCart = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  const contextValue = useMemo<CartContextValue>(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      selectedItems,
      setItemSelected,
      isCartOpen,
      isSyncing,
      refreshCart,
      openCart,
      closeCart,
    }),
    [
      addItem,
      items,
      isCartOpen,
      isSyncing,
      refreshCart,
      removeItem,
      selectedItems,
      setItemSelected,
      updateQuantity,
      openCart,
      closeCart,
    ],
  );

  return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
