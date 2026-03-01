import { Checkbox } from "../ui/checkbox"
import React from "react"
import { Button } from "../ui/button"
import { MinusIcon, PlusIcon, TrashIcon } from "lucide-react"

type Props = {
  name: string
  description: string
  price: number
  image: string
  checked: boolean
  quantity: number
  onCheckedChange: (checked: boolean) => void
  onQuantityChange: (q: number) => void
  onRemove: () => void
}

export default function CartItems({
  name,
  description,
  price,
  image,
  checked,
  quantity,
  onCheckedChange,
  onQuantityChange,
  onRemove
}: Props) {
  return (
    <div className="bg-gray-100 p-4 rounded-lg mb-6 border border-gray-200">
      
      {/* Top Section */}
      <div className="flex justify-between items-start mb-4">
        <Checkbox checked={checked} onCheckedChange={onCheckedChange} />

        <Button
          variant="outline"
          size="xs"
          className="border-0 p-3 shadow-none text-gray-500"
          onClick={onRemove}
        >
          <TrashIcon size={16} />
          <span className="ml-1 text-xs">Hapus</span>
        </Button>
      </div>

      {/* Content */}
      <div className="flex gap-4">
        <div className="border border-gray-200 p-2 rounded-lg h-fit">
          <img src={image} alt={name} width={50} height={50} />
        </div>

        <div className="flex flex-col justify-between grow">
          <div className="space-y-2 mb-4">
            <p className="text-sm font-semibold">{name}</p>
            <p className="text-xs text-gray-500">{description}</p>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm font-semibold text-orange-600">
              Rp {price.toLocaleString("id-ID")}
            </p>

            <div className="flex h-fit">
              <Button
                variant="outline"
                size="icon-xs"
                className="border-r-0 p-3 rounded-l-full"
                onClick={() =>
                  onQuantityChange(Math.max(1, quantity - 1))
                }
              >
                <MinusIcon size={14} />
              </Button>

              <div className="px-3 flex items-center text-xs border-y border-gray-200">
                {quantity}
              </div>

              <Button
                variant="outline"
                size="icon-xs"
                className="border-l-0 p-3 rounded-r-full"
                onClick={() =>
                  onQuantityChange(quantity + 1)
                }
              >
                <PlusIcon size={14} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
