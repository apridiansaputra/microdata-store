import React, { useMemo, useState } from "react"
import CartItems from "./CartItems"
import CartFooter from "./CartFooter"

type Item = {
  id: number
  name: string
  description: string
  price: number
  image: string
}

export default function CartSheet() {
  const [items, setItems] = useState<Item[]>([
    {
      id: 1,
      name: 'Apple MacBook Pro 14" M3 Pro Chip',
      description: "RAM 16GB/512GB, Color Space Gray",
      price: 20000000,
      image: "/lenovo.png",
    },
    {
      id: 2,
      name: "ASUS ROG Strix G16 G614JV",
      description: "i7 RTX 4060 16GB/512GB, Color Black",
      price: 18000000,
      image: "/levono.png",
    },
    {
      id: 3,
      name: "ThinkPad E14 Gen 4 Laptop",
      description: "i5 Gen 12 16GB/512GB, Color Black",
      price: 15000000,
      image: "/levono.png",
    },
  ])

  const [selectedItems, setSelectedItems] = useState<Record<number, boolean>>(
    {}
  )

  const [quantities, setQuantities] = useState<Record<number, number>>(
    {}
  )

  const totalItems = useMemo(() => {
    return items.reduce((sum, item) => {
      if (!selectedItems[item.id]) return sum
      return sum + (quantities[item.id] ?? 1)
    }, 0)
  }, [items, selectedItems, quantities])

  const totalPrice = useMemo(() => {
    return items.reduce((sum, item) => {
      if (!selectedItems[item.id]) return sum
      return sum + item.price * (quantities[item.id] ?? 1)
    }, 0)
  }, [items, selectedItems, quantities])

  const handleRemove = (id: number) => {
    setItems(prev => prev.filter(item => item.id !== id))

    setSelectedItems(prev => {
      const updated = { ...prev }
      delete updated[id]
      return updated
    })

    setQuantities(prev => {
      const updated = { ...prev }
      delete updated[id]
      return updated
    })
  }

  return (
    <div className="flex flex-col h-full">
      
      <div className="grow overflow-y-auto">
        {items.map((item) => (
          <CartItems
            key={item.id}
            name={item.name}
            description={item.description}
            price={item.price}
            image={item.image}
            checked={selectedItems[item.id] ?? false}
            quantity={quantities[item.id] ?? 1}
            onCheckedChange={(v: boolean) =>
              setSelectedItems(prev => ({ ...prev, [item.id]: v }))
            }
            onQuantityChange={(q: number) =>
              setQuantities(prev => ({ ...prev, [item.id]: q }))
            }
            onRemove={() => handleRemove(item.id)}
          />
        ))}
      </div>

      <CartFooter totalItems={totalItems} totalPrice={totalPrice} />
    </div>
  )
}
