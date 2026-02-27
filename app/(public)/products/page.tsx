'use client'

import React from 'react'
import Link from 'next/link'

import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox"
import { ProductCard } from "@/components/ui/product-card"
import { ADMIN_PRODUCTS, getAdminProductSlug } from "@/constants/data"

const periode = [
    "Terbaru",
    "Terlama",
] as const

const price = [
    "Tertinggi",
    "Terendah",
] as const

export default function AllProducts() {
    return (
        <div className="space-y-12">
            <div className="flex w-full items-center justify-between">
                <h1 className="text-xl font-semibold">Semua Produk</h1>

                <div className="flex gap-4">
                    <div className="w-32">
                        <Combobox items={periode}>
                            <ComboboxInput
                                placeholder="Periode"
                                inputClassName="text-light-grey placeholder:text-light-grey"/>
                            <ComboboxContent>
                                <ComboboxEmpty>Tidak ada opsi.</ComboboxEmpty>
                                <ComboboxList>
                                    {(item) => (
                                        <ComboboxItem key={item} value={item}>
                                            {item}
                                        </ComboboxItem>
                                    )}
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
                    </div>

                    <div className="w-32">
                        <Combobox items={price}>
                            <ComboboxInput
                                placeholder="Harga"
                                inputClassName="text-light-grey placeholder:text-light-grey"/>
                            <ComboboxContent>
                                <ComboboxEmpty>Tidak ada opsi.</ComboboxEmpty>
                                <ComboboxList>
                                    {(item) => (
                                        <ComboboxItem key={item} value={item}>
                                            {item}
                                        </ComboboxItem>
                                    )}
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {ADMIN_PRODUCTS.map((product) => (
                    <Link
                        key={product.id}
                        href={`/product/${product.id}`}
                        className="block h-full"
                    >
                        <ProductCard
                            image={product.imageSrc}
                            name={product.title}
                            price={product.price}
                            isNew={product.isNew}
                        />
                    </Link>
                ))}
            </div>
        </div>
    )
}
