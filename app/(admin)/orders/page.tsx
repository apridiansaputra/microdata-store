"use client"

import { useState } from 'react'
import Container from '@/components/ui/admin/container'
import Header from '@/components/ui/admin/header'  
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table"
import {MoreHorizontalIcon} from "lucide-react"
import OrderDetailPanel from '@/components/ui/admin/order-detail-pannel'

export default function OrdersPage() {
    const [isDetailOpen, setIsDetailOpen] = useState(false)

  return (
    <div className='flex flex-col h-screen'>
        <Header title='Pesanan' />
        <Container className='flex justify-between gap-5 flex-1 overflow-hidden w-full'>
            <div className='bg-white rounded-lg p-4 flex flex-col gap-7 w-full overflow-y-auto'>
                <div className='flex justify-end gap-2 py-4 '>
                    <Select>
                        <SelectTrigger className="max-w-48 text-xs">
                            <SelectValue placeholder="Semua Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Status Pembayaran</SelectLabel>
                                <SelectItem value="pending">Lunas</SelectItem>
                                <SelectItem value="processing">Menunggu Pembayaran</SelectItem>
                            </SelectGroup>

                            <SelectGroup>
                                <SelectLabel>Status Pengiriman</SelectLabel>
                                <SelectItem value="pending">Belum Dikirim</SelectItem>
                                <SelectItem value="pending">Dalam Pengiriman</SelectItem>
                                <SelectItem value="processing">Selesai</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    
                    <Select>
                        <SelectTrigger className="max-w-48 text-xs">
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
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell>ORD-001</TableCell>
                            <TableCell>John Doe</TableCell>
                            <TableCell>Rp 150.000</TableCell>
                            <TableCell>Lunas</TableCell>
                            <TableCell>Dalam Pengiriman</TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="size-8">
                                    <MoreHorizontalIcon />
                                    <span className="sr-only">Open menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={() => setIsDetailOpen(true)}>Detail</DropdownMenuItem>
                                </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>

                        {isDetailOpen ? <OrderDetailPanel onClose={() => setIsDetailOpen(false)} /> : null}
        </Container>
    </div>
  )
}

