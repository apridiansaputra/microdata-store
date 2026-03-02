"use client"

import React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group'
import { Menu, SearchIcon, ShoppingCartIcon } from 'lucide-react'
import Image from 'next/image'
import Container from './Container'
import CartSheet from '@/components/cart-components/CartSheet'
import { useCart } from '@/components/cart-components/cart-context'

export default function Header() {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const { isCartOpen, openCart, closeCart } = useCart()

  return (
    <Container>
      <div className="flex w-full items-center justify-between">
        <Image src="/logo.png" alt="Logo" width={120} height={40} />

        <div className="relative hidden w-1/3 md:block">
          <InputGroup className="rounded-full bg-white">
            <InputGroupInput
              placeholder="Cari produk impianmu"
              onFocus={() => setIsSearchOpen(true)}
            />
            <InputGroupAddon align="inline-start">
              <SearchIcon className="h-5 w-5 text-muted-foreground" />
            </InputGroupAddon>
          </InputGroup>

          {isSearchOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsSearchOpen(false)}
              />
              <div className="absolute top-full z-50 mt-2 max-h-96 w-full overflow-y-auto rounded-lg border bg-white shadow-lg">
                <div className="p-4">
                  <h3 className="mb-3 text-sm font-semibold text-gray-500">
                    Pencarian Terpopuler
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-gray-100">
                      <SearchIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">Laptop Gaming</span>
                    </li>
                    <li className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-gray-100">
                      <SearchIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">Mouse Wireless</span>
                    </li>
                    <li className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-gray-100">
                      <SearchIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">Keyboard Mechanical</span>
                    </li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center justify-center"
            >
              <SearchIcon className="h-6 w-6 cursor-pointer" />
            </button>

            {isSearchOpen && (
              <div className="fixed inset-0 z-50 flex flex-col gap-4 bg-white p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Cari Produk</h2>
                  <button
                    onClick={() => setIsSearchOpen(false)}
                    className="cursor-pointer p-2"
                  >
                    ✕
                  </button>
                </div>
                <InputGroup className="w-full rounded-full">
                  <InputGroupInput placeholder="Cari Produk" autoFocus />
                  <InputGroupAddon align="inline-start">
                    <SearchIcon className="h-5 w-5 cursor-pointer" />
                  </InputGroupAddon>
                </InputGroup>
              </div>
            )}
          </div>

          <Sheet open={isCartOpen} onOpenChange={(open) => (open ? openCart() : closeCart())}>
            <SheetTrigger asChild>
              <ShoppingCartIcon className="h-6 w-6 cursor-pointer" />
            </SheetTrigger>

            <SheetContent className="p-6">
              <SheetHeader>
                <SheetTitle className="text-lg font-semibold mb-8">Keranjang Belanja</SheetTitle>
              </SheetHeader>
              <CartSheet />
            </SheetContent>
          </Sheet>

          <Menu className="h-6 w-6 cursor-pointer" />
        </div>
      </div>
    </Container>
  )
}