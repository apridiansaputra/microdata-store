"use client"

import React from "react"
import { Button } from "../ui/button"
import Link from "next/link"
import { useCart } from "./cart-context"

type Props = {
  totalItems: number
  totalPrice: number
}

export default function CartFooter({ totalItems, totalPrice }: Props) {
  const { selectedItems } = useCart()

  const selectedIds = Object.entries(selectedItems ?? {})
    .filter(([, v]) => v)
    .map(([id]) => id)

  const checkoutHref =
    selectedIds.length > 0
      ? `/checkout?items=${encodeURIComponent(selectedIds.join(","))}`
      : "/checkout"

  const disabled = selectedIds.length === 0

  return (
    <div className="border-t pt-4 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <p className="text-sm">Total</p>
          <p className="text-sm font-semibold">({totalItems} Produk)</p>
        </div>
        <p className="text-base font-bold">Rp {totalPrice.toLocaleString("id-ID")}</p>
      </div>

      <div className="flex flex-col gap-2 text-center">
        <Link href={checkoutHref} className={disabled ? "pointer-events-none" : ""}>
          <Button
            disabled={disabled}
            className="w-full text-sm py-5 bg-primary-orange text-white hover:bg-orange-500"
          >
            Checkout
          </Button>
        </Link>

        <p className="text-xs text-muted-foreground">
          Pajak & ongkos kirim dihitung saat checkout
        </p>
      </div>
    </div>
  )
}
