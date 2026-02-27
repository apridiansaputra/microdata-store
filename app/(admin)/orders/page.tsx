"use client"

import { useState } from 'react'
import Container from '@/components/admin-layout/container'
import Header from '@/components/admin-layout/header'  
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table"
import { ArrowUpRight } from "lucide-react"
import OrderDetailPanel from '@/components/admin-layout/order-detail-pannel'

export default function OrdersPage() {
    const [isDetailOpen, setIsDetailOpen] = useState(false)

  return (
    <div className='flex flex-col h-screen'>
        <Header title='Pesanan' />
        <Container
            className={`grid w-full flex-1 overflow-hidden transition-[grid-template-columns] duration-300 ease-out grid-cols-1 ${
                isDetailOpen
                  ? "md:grid-cols-[minmax(0,1fr)_430px]"
                  : "md:grid-cols-[minmax(0,1fr)_0px]"
            }`}
        >
            <div className={`min-w-0 w-full bg-white rounded-lg p-4 flex flex-col gap-7 overflow-y-auto transition-transform duration-300 ease-out ${
                isDetailOpen ? "hidden md:flex -translate-x-1" : "flex translate-x-0"
            }`}>
                <div className='flex justify-end gap-2 py-4 '>
                    <Select>
                        <SelectTrigger className="w-48 text-xs">
                            <SelectValue placeholder="Status Pembayaran" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="lunas">Lunas</SelectItem>
                                <SelectItem value="menunggu-pembayaran">Menunggu Pembayaran</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>

                    <Select>
                        <SelectTrigger className="w-48 text-xs">
                            <SelectValue placeholder="Status Pengiriman" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="belum-dikirim">Belum Dikirim</SelectItem>
                                <SelectItem value="dalam-pengiriman">Dalam Pengiriman</SelectItem>
                                <SelectItem value="selesai">Selesai</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>

                    
                    <Select>
                        <SelectTrigger className="w-48 text-xs">
                            <SelectValue placeholder="Urutkan dari Tanggal" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="pending">Tanggal Terbaru</SelectItem>
                                <SelectItem value="processing">Tanggal Terlama</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID Pesanan</TableHead>
                            <TableHead>Pelanggan</TableHead>
                            <TableHead>Total Belanja</TableHead>
                            <TableHead>Status Pembayaran</TableHead>
                            <TableHead>Status Pengiriman</TableHead>
                            <TableHead>Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell>ORD-001</TableCell>
                            <TableCell>John Doe</TableCell>
                            <TableCell>Rp 150.000</TableCell>
                            <TableCell>Lunas</TableCell>
                            <TableCell>Dalam Pengiriman</TableCell>
                            <TableCell>
                                <Button variant="outline" size="xs" onClick={() => setIsDetailOpen(true)} className=' border-0 hover:bg-white hover:text-primary-orange cursor-pointer shadow-none'>
                                    Detail
                                    <ArrowUpRight className="size-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>

            <div className={`min-w-0 w-full overflow-hidden transition-all duration-300 ease-out ${
                isDetailOpen
                  ? "translate-x-0 opacity-100"
                  : "pointer-events-none translate-x-6 opacity-0 hidden md:block"
            }`}>
                <OrderDetailPanel onClose={() => setIsDetailOpen(false)} />
            </div>
        </Container>
    </div>
  )
}

