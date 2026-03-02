"use client"

import { Button } from "@/components/ui/button"
import { useCart } from "./cart-context"

type Props = {
  id: number
  title: string
  price: number
  imageSrc: string
}

export function AddToCartButton({ id, title, price, imageSrc }: Props) {
  const { addItem, openCart } = useCart()

  const handleClick = () => {
    addItem({
      id,
      name: title,
      price,
      image: imageSrc,
      description: undefined,
      quantity: 1,
    })

    openCart()
  }

  return (
    <Button className="mt-12 cursor-pointer py-6 text-sm bg-gray-600" onClick={handleClick}>
      Masukkan Keranjang
    </Button>
  )
}
