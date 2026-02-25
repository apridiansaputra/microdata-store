'use client'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group'
import { Menu, SearchIcon, ShoppingCartIcon, UserIcon } from 'lucide-react'

export default function Header() {
  return (
    <div className="flex justify-between w-full">
      <h1 className="text-md font-semibold">MicrodataStore</h1>

      <InputGroup className="hidden w-1/3 rounded-full md:flex">
        <InputGroupInput placeholder="Search..." />
        <InputGroupAddon align="inline-start">
          <SearchIcon className="text-muted-foreground" />
        </InputGroupAddon>
      </InputGroup>

      <div className="flex gap-4 items-center">
        <SearchIcon className="md:hidden" />

        <Sheet>
          <SheetTrigger asChild>
            <ShoppingCartIcon className="cursor-pointer" />
          </SheetTrigger>

          <SheetContent className="p-6">
            <SheetHeader>
              <SheetTitle>Keranjang Belanja</SheetTitle>
            </SheetHeader>
          </SheetContent>
        </Sheet>

        <Menu className="cursor-pointer" />
      </div>
    </div>
  )
}