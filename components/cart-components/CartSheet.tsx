"use client"

import React, { useMemo } from "react"
import CartItems from "./CartItems"
import CartFooter from "./CartFooter"
import { useCart } from "./cart-context"

export default function CartSheet() {
  const {
    items,
    removeItem,
    updateQuantity,
    selectedItems,
    setItemSelected,
    isSyncing,
  } = useCart()

  const totalItems = useMemo(() => {
    return items.reduce((sum, item) => {
      if (!selectedItems[item.id]) return sum
      return sum + item.quantity
    }, 0)
  }, [items, selectedItems])

  const totalPrice = useMemo(() => {
    return items.reduce((sum, item) => {
      if (!selectedItems[item.id]) return sum
      return sum + item.price * item.quantity
    }, 0)
  }, [items, selectedItems])

  const handleRemove = (id: string) => {
    void removeItem(id)
  }

  return (
    <div className="flex flex-col h-full">
      
      <div className="cart-scroll grow h-80 overflow-y-auto">
        {isSyncing && items.length === 0 ? (
          <p className="py-8 text-center text-xs text-dark-grey/70">Memuat keranjang...</p>
        ) : null}

        {items.map((item) => (
          <CartItems
            key={item.id}
            name={item.name}
            price={item.price}
            image={item.image}
            checked={selectedItems[item.id] ?? false}
            stock={item.stock}
            isOutOfStock={item.isOutOfStock}
            quantity={item.quantity}
            onCheckedChange={(v: boolean) =>
              void setItemSelected(item.id, v)
            }
            onQuantityChange={(q: number) =>
              void updateQuantity(item.id, q)
            }
            onRemove={() => handleRemove(item.id)}
          />
        ))}
      </div>

      <CartFooter totalItems={totalItems} totalPrice={totalPrice} />
    </div>
  )
}
