"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

export type CartItem = {
  id: number
  name: string
  description?: string
  price: number
  image: string
  quantity: number
}

type CartContextValue = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void
  removeItem: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  selectedItems: Record<number, boolean>
  setItemSelected: (id: number, selected: boolean) => void
  isCartOpen: boolean
  openCart: () => void
  closeCart: () => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

const CART_ITEMS_KEY = "mds_cart_items"
const CART_SELECTED_KEY = "mds_cart_selected"

function loadItems(): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(CART_ITEMS_KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

function loadSelected(): Record<number, boolean> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(CART_SELECTED_KEY)
    return raw ? (JSON.parse(raw) as Record<number, boolean>) : {}
  } catch {
    return {}
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Mulai dengan state kosong di server & client agar markup awal sama,
  // lalu sinkronkan dengan localStorage hanya di client melalui useEffect.
  const [items, setItems] = useState<CartItem[]>([])
  const [selectedItems, setSelectedItems] = useState<Record<number, boolean>>({})
  const [isCartOpen, setIsCartOpen] = useState(false)

  useEffect(() => {
    const storedItems = loadItems()
    const storedSelected = loadSelected()

    if (storedItems.length > 0) {
      setItems(storedItems)
    }

    if (Object.keys(storedSelected).length > 0) {
      setSelectedItems(storedSelected)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    localStorage.setItem(CART_ITEMS_KEY, JSON.stringify(items))
  }, [items])

  useEffect(() => {
    if (typeof window === "undefined") return
    localStorage.setItem(CART_SELECTED_KEY, JSON.stringify(selectedItems))
  }, [selectedItems])

  const addItem: CartContextValue["addItem"] = (item) => {
    const quantity = item.quantity ?? 1

    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i,
        )
      }

      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          image: item.image,
          quantity,
        },
      ]
    })

    setSelectedItems((prev) => ({ ...prev, [item.id]: true }))
  }

  const removeItem: CartContextValue["removeItem"] = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
    setSelectedItems((prev) => {
      const updated = { ...prev }
      delete updated[id]
      return updated
    })
  }

  const updateQuantity: CartContextValue["updateQuantity"] = (id, quantity) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item,
      ),
    )
  }

  const setItemSelected: CartContextValue["setItemSelected"] = (id, selected) => {
    setSelectedItems((prev) => ({ ...prev, [id]: selected }))
  }

  const openCart = () => setIsCartOpen(true)
  const closeCart = () => setIsCartOpen(false)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        selectedItems,
        setItemSelected,
        isCartOpen,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return ctx
}
