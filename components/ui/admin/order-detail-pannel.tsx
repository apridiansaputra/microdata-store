import { MapPin, Phone, Printer, X } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type OrderItem = {
  id: string
  name: string
  price: string
  quantity: number
}

const ORDER_ITEMS: OrderItem[] = [
  {
    id: "item-1",
    name: 'Apple MacBook Pro 14" M3 Pro Chip - 16GB/512GB - Space Gray',
    price: "Rp. 20.000,00",
    quantity: 1,
  },
  {
    id: "item-2",
    name: 'Apple MacBook Pro 14" M3 Pro Chip - 16GB/512GB - Space Gray',
    price: "Rp. 20.000,00",
    quantity: 1,
  },
]

type OrderDetailPanelProps = {
  onClose: () => void
}

export default function OrderDetailPanel({ onClose }: OrderDetailPanelProps) {
  return (
    <aside className="h-full min-h-0 w-full max-w-107.5 rounded-lg bg-white flex flex-col overflow-hidden">
      <section className="shrink-0 flex items-start justify-between gap-4 p-5 ">
        <div>
          <p className="text-xs text-dark-grey">13 Nov, 2025</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h2 className="text-xs leading-none">
              ID Pesan <span>#MCD-001</span>
            </h2>
            <span className="rounded-full bg-[#EFF5F1] px-2 py-1 text-xs leading-none font-medium text-[#21B454]">
              Sudah dibayar
            </span>
          </div>
        </div>

        <button
          type="button"
          aria-label="Tutup detail"
          className="rounded-md p-1 cursor-pointer"
          onClick={onClose}
        >
          <X className="size-5" strokeWidth={1.8} />
        </button>
      </section>

      <div className="min-h-0 flex-1 overflow-y-auto p-5 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-light-grey hover:[&::-webkit-scrollbar-thumb]:bg-dark-grey">
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-3">
            <h3 className="text-sm leading-none font-semibold ">
              Ari Lukman Winawa
            </h3>

            <div className="flex flex-col gap-2">
                <div className="flex items-start gap-2 text-xs text-dark-grey">
                    <MapPin className="size-4 shrink-0" strokeWidth={1.8} />
                    <p>Jl. Pahlawan No. 4, Magelang Timur, Jawa Tengah</p>
                </div>
                <div className="flex items-start gap-2 text-xs text-dark-grey">
                    <Phone className="size-4 shrink-0" strokeWidth={1.8} />
                    <p>+62 81260217971</p>
                </div>
            </div>
          </section>

          <hr />

          <section className="flex flex-col gap-5">
            <h4 className="text-xs leading-none font-semibold">Rincian Belanja</h4>

            <div className="flex flex-col gap-5">
              {ORDER_ITEMS.map((item) => (
                <article key={item.id} className="flex justify-between items-start gap-4">
                  <Image src="/gambar-laptop.png" alt="Product thumbnail" width={40} height={40} className="size-8 rounded-sm"/>
                  <div className="flex-1">
                    <p className="text-xs leading-tight font-semibold ">
                      {item.name}
                    </p>
                    <p className="mt-2 text-xs leading-none ">{item.price}</p>
                  </div>
                  <p className="text-sm leading font-semibold">
                    x {item.quantity}
                  </p>
                </article>
              ))}
            </div>

            <hr />

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-4 text-xs text-dark-grey">
                  <p>Total Pesanan</p>
                  <p>Rp. 20.000.000,00</p>
                </div>
                <div className="flex items-center justify-between gap-4 text-xs text-dark-grey">
                  <p>Ongkos Kirim</p>
                  <p>Rp. 50.000,00</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 pt-1 text-xs font-semibold leading-none ">
                <p>Total Pembayaran</p>
                <p>Rp. 20.035.000,00</p>
              </div>
            </div>
          </section>

          <hr />

          <section className="flex flex-col gap-5">
            <div className="flex items-center justify-between gap-4">
              <h5 className="text-xs leading-none font-semibold">Status Pengiriman</h5>
              <Select defaultValue="pending">
                <SelectTrigger className="h-auto border-0 p-0 text-xs leading-none font-semibold text-primary-orange shadow-none focus-visible:ring-0 [&_svg]:size-5 [&_svg]:text-primary-orange">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Belum Diproses</SelectItem>
                  <SelectItem value="diproses">Diproses</SelectItem>
                  <SelectItem value="dikirim">Dikirim</SelectItem>
                  <SelectItem value="selesai">Selesai</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-3">
              <h5 className="text-xs leading-none font-semibold">Pelacakan Barang</h5>
              <div className="flex flex-col gap-2">
                <Input placeholder="Masukkan tautan ekspedisi" className=" placeholder:text-dark-grey placeholder:text-xs"/>
                <Input placeholder="Masukkan Nomor Resi" className=" placeholder:text-dark-grey placeholder:text-xs"/>
              </div>
            </div>
          </section>
        </div>
      </div>

      <section className="shrink-0 mt-4 pt-4 border-t flex items-center justify-between gap-4 p-5">
          <Button size="icon" variant="ghost" className="size-11 shrink-0 text-primary-orange cursor-pointer hover:bg-[#FFF2E8] hover:text-primary-orange">
            <Printer className="size-5" />
          </Button>
          <Button className="flex-1 rounded-sm bg-primary-orange text-xs font-semibold text-white hover:bg-primary-orange/90 cursor-pointer">
            Update Status
          </Button>
      </section>
    </aside>
  )
}
