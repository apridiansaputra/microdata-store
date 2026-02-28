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

  const handleRemove = (id: number) => {
    removeItem(id)
  }

  return (
    <div className="flex flex-col h-full">
      
      <div className="grow overflow-y-auto">
        {items.map((item) => (
          <CartItems
            key={item.id}
            name={item.name}
            description={item.description ?? ""}
            price={item.price}
            image={item.image}
            checked={selectedItems[item.id] ?? false}
            quantity={item.quantity}
            onCheckedChange={(v: boolean) =>
              setItemSelected(item.id, v)
            }
            onQuantityChange={(q: number) =>
              updateQuantity(item.id, q)
            }
            onRemove={() => handleRemove(item.id)}
          />
        ))}
      </div>

      <CartFooter totalItems={totalItems} totalPrice={totalPrice} />
    </div>
  )
}
