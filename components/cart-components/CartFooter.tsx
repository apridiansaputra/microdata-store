import React from "react"
import { Button } from "../ui/button"
import Link from "next/link"

type Props = {
  totalItems: number
  totalPrice: number
}

export default function CartFooter({ totalItems, totalPrice }: Props) {
  return (
    <div className="border-t pt-4 flex flex-col gap-4">
      
      {/* Total Section */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <p className="text-sm">Total</p>
          <p className="text-sm font-semibold">
            ({totalItems} Produk)
          </p>
        </div>

        <p className="text-base font-bold text-orange-600">
          Rp {totalPrice.toLocaleString("id-ID")}
        </p>
      </div>

      {/* Action Section */}
      <div className="flex flex-col gap-2 text-center">
        <Link href="/checkout" className={totalItems === 0 ? "pointer-events-none" : ""}>
          <Button
            disabled={totalItems === 0}
            className="w-full text-sm py-5"
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
