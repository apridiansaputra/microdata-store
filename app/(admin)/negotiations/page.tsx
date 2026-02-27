import Container from '@/components/admin-layout/container'
import Header from '@/components/admin-layout/header'  
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table"
import { ArrowUpRight } from 'lucide-react'

export default function Negotiations() {
  return (
    <div>
      <Header title='Negosiasi' />
      <Container>
            <div className="min-w-0 bg-white rounded-lg p-4 flex flex-col gap-7 overflow-y-auto transition-transform">
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
                            <SelectValue placeholder="Status Negosiasi" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="belum-diproses">Belum Diproses</SelectItem>
                                <SelectItem value="diproses">Diproses</SelectItem>
                                <SelectItem value="batal">Batal</SelectItem>
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
                            <TableHead>Status Negosiasi</TableHead>
                            <TableHead></TableHead>
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
                                <Button variant="outline" size="xs" className=' border-0 hover:bg-white hover:text-primary-orange cursor-pointer shadow-none'>
                                    Proses
                                    <ArrowUpRight className="size-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </Container>
      </div>
  )
}
