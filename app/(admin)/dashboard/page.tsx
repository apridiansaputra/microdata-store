"use client";

import Container from "@/components/admin-layout/container";
import Header from "@/components/admin-layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  ArrowUp,
  ArrowUpRight,
  BadgeDollarSign,
  ShoppingCart,
  UserRoundPlus,
  WalletCards,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

type ProductPanelView = "produk" | "lokasi";

const dashboardDateFilters = [
  { value: "today", label: "Hari ini" },
  { value: "last-7-days", label: "7 hari terakhir" },
  { value: "this-month", label: "Bulan ini" },
  { value: "this-year", label: "Tahun ini" },
];

const summaryCards = [
  {
    title: "Total Pendapatan",
    value: 5000000,
    trend: "12%",
    icon: WalletCards,
  },
  {
    title: "Total Pesanan",
    value: 3,
    trend: "12%",
    icon: ShoppingCart,
  },
  {
    title: "Pelanggan Terbaru",
    value: 3,
    trend: "12%",
    icon: UserRoundPlus,
  },
  {
    title: "Net Profit",
    value: 1500000,
    trend: "12%",
    icon: BadgeDollarSign,
  },
] as const;

const salesData = [
  { month: "January", pendapatan: 1400000 },
  { month: "February", pendapatan: 1850000 },
  { month: "March", pendapatan: 1650000 },
  { month: "April", pendapatan: 2500000 },
  { month: "May", pendapatan: 1350000 },
  { month: "June", pendapatan: 2600000 },
];

const chartConfig = {
  pendapatan: {
    label: "Pendapatan",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const topProducts = [
  {
    id: "P001",
    name: "Laptop Infinix X1 book RAM 600 GB 7000 SSD",
    category: "Hardware",
    price: 123456,
    sold: 20,
    image: "/lenovo.png",
  },
  {
    id: "P002",
    name: "Laptop Infinix X1 book RAM 600 GB 7000 SSD",
    category: "Hardware",
    price: 123456,
    sold: 25,
    image: "/lenovo.png",
  },
  {
    id: "P003",
    name: "Laptop Infinix X1 book RAM 600 GB 7000 SSD",
    category: "Hardware",
    price: 123456,
    sold: 25,
    image: "/lenovo.png",
  },
] as const;

const topLocations = [
  { id: "L001", city: "Jakarta", users: 120 },
  { id: "L002", city: "Surabaya", users: 96 },
  { id: "L003", city: "Bandung", users: 74 },
  { id: "L004", city: "Yogyakarta", users: 65 },
] as const;

const orders = [
  {
    id: "PO1251",
    customer: "Dian Nugroho Saputro",
    total: 200000,
    paymentStatus: "Approval Pending",
    shippingStatus: "Terkirim",
  },
  {
    id: "PO1242",
    customer: "Wahyu Kusuma Prabowo",
    total: 200000,
    paymentStatus: "Completed",
    shippingStatus: "Terkirim",
  },
  {
    id: "PO1238",
    customer: "Dewi Permata Dewanti",
    total: 1000000,
    paymentStatus: "Completed",
    shippingStatus: "Terkirim",
  },
  {
    id: "PO1250",
    customer: "Adi Setiawan Putra",
    total: 1000000,
    paymentStatus: "Declined",
    shippingStatus: "Terkirim",
  },
  {
    id: "PO1235",
    customer: "Nia Fitriani Utami",
    total: 1000000,
    paymentStatus: "In Progress",
    shippingStatus: "Terkirim",
  },
  {
    id: "PO1252",
    customer: "Dodi Hermawan Saputra",
    total: 200000,
    paymentStatus: "In Progress",
    shippingStatus: "Terkirim",
  },
  {
    id: "PO1234",
    customer: "Budi Santoso Utomo",
    total: 200000,
    paymentStatus: "Completed",
    shippingStatus: "Terkirim",
  },
] as const;

const formatRupiah = (value: number) => `Rp. ${value.toLocaleString("id-ID")}`;

export default function Dashboard() {
  const [dateFilter, setDateFilter] = useState("today");
  const [productPanelView, setProductPanelView] = useState<ProductPanelView>("produk");

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        title="Dashboard"
        rightContent={
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="h-9 min-w-32 border-border-grey bg-white text-sm text-secondary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectGroup>
                {dashboardDateFilters.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        }
      />

      <Container className="space-y-5 py-5 pb-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((metric) => {
            const Icon = metric.icon;
            const metricValue =
              metric.title.includes("Pendapatan") || metric.title === "Net Profit"
                ? formatRupiah(metric.value)
                : metric.value.toLocaleString("id-ID");

            return (
              <Card
                key={metric.title}
                className="gap-5 border-border-grey/90 bg-white py-4 shadow-none"
              >
                <CardHeader className="flex flex-row items-center justify-between px-4 pb-0">
                  <span className="flex size-9 items-center justify-center rounded-md bg-primary-orange/10 text-primary-orange">
                    <Icon className="size-5" />
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-secondary">
                    <ArrowUp className="size-3.5" />
                    {metric.trend}
                  </span>
                </CardHeader>

                <CardContent className="px-4">
                  <p className="text-xs text-dark-grey">{metric.title}</p>
                  <p className="mt-1 text-xl font-semibold tracking-tight text-secondary">
                    {metricValue}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <Card className="gap-3 border-border-grey/90 bg-white py-4 shadow-none">
            <CardHeader className="px-4 pb-0">
              <CardTitle className="text-sm font-semibold text-secondary">
                Performa Penjualan
              </CardTitle>
              <p className="text-xs text-dark-grey">Total Pendapatan</p>
            </CardHeader>

            <CardContent className="px-3">
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <LineChart
                  accessibilityLayer
                  data={salesData}
                  margin={{ top: 18, right: 8, bottom: 10, left: 8 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value: string) => value.slice(0, 3)}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        indicator="line"
                        formatter={(value) => formatRupiah(Number(value))}
                      />
                    }
                  />
                  <Line
                    dataKey="pendapatan"
                    type="natural"
                    stroke="var(--color-pendapatan)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="gap-4 border-border-grey/90 bg-white py-4 shadow-none">
            <CardHeader className="space-y-0 px-4 pb-0">
              <div className="flex items-center gap-6 border-b border-border-grey">
                <button
                  type="button"
                  onClick={() => setProductPanelView("produk")}
                  className={cn(
                    "cursor-pointer border-b-2 pb-3 text-sm font-semibold transition-colors",
                    productPanelView === "produk"
                      ? "border-secondary text-secondary"
                      : "border-transparent text-dark-grey hover:text-secondary"
                  )}
                >
                  Produk Terlaris
                </button>

                <button
                  type="button"
                  onClick={() => setProductPanelView("lokasi")}
                  className={cn(
                    "cursor-pointer border-b-2 pb-3 text-sm font-semibold transition-colors",
                    productPanelView === "lokasi"
                      ? "border-secondary text-secondary"
                      : "border-transparent text-dark-grey hover:text-secondary"
                  )}
                >
                  Top Lokasi Pelanggan
                </button>
              </div>
            </CardHeader>

            <CardContent className="px-4">
              {productPanelView === "produk" ? (
                <div className="overflow-x-auto">
                  <div className="min-w-[640px] space-y-6">
                    <div className="grid grid-cols-[minmax(0,1fr)_120px_100px_70px] gap-3 text-xs font-semibold text-secondary">
                      <p>Nama Produk</p>
                      <p>Kategori</p>
                      <p>Harga</p>
                      <p>Terjual</p>
                    </div>

                    <div className="space-y-4">
                      {topProducts.map((product) => (
                        <div
                          key={product.id}
                          className="grid grid-cols-[minmax(0,1fr)_120px_100px_70px] items-center gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <Image
                              src={product.image}
                              alt={product.name}
                              width={46}
                              height={34}
                              className="h-9 w-12 rounded-md border border-border-grey object-cover"
                            />
                            <p className="line-clamp-2 text-xs text-secondary">{product.name}</p>
                          </div>
                          <p className="text-xs text-secondary">{product.category}</p>
                          <p className="text-xs text-secondary">{formatRupiah(product.price)}</p>
                          <p className="text-xs text-secondary">{product.sold}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-1">
                  {topLocations.map((location) => {
                    const progress = (location.users / topLocations[0].users) * 100;

                    return (
                      <div key={location.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-secondary">
                          <p>{location.city}</p>
                          <p>{location.users} pelanggan</p>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-border-grey/70">
                          <div
                            className="h-full rounded-full bg-primary-orange"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <Card className="gap-0 border-border-grey/90 bg-white py-0 shadow-none">
          <div className="flex flex-col gap-3 border-b border-border-grey px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-md font-semibold text-secondary">
              Pesanan Terbaru
            </CardTitle>
          </div>

          <CardContent className="px-0 pb-3 pt-2">
            <Table>
              <TableHeader>
                <TableRow className="border-border-grey">
                  <TableHead>
                    ID Pesanan
                  </TableHead>
                  <TableHead>
                    Pelanggan
                  </TableHead>
                  <TableHead>
                    Total Belanja
                  </TableHead>
                  <TableHead>
                    Status Pembayaran
                  </TableHead>
                  <TableHead>
                    Status Pengiriman
                  </TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="border-border-grey">
                    <TableCell className="text-xs text-secondary">
                      {order.id}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-secondary">
                      {order.customer}
                    </TableCell>
                    <TableCell className="text-xs text-secondary">
                      {formatRupiah(order.total)}
                    </TableCell>
                    <TableCell className="text-xs text-secondary">
                      {order.paymentStatus}
                    </TableCell>
                    <TableCell className="text-xs text-secondary">
                      {order.shippingStatus}
                    </TableCell>
                    <TableCell className="text-xs text-secondary">
                      <Button
                        variant="outline"
                        size="xs"
                        className="cursor-pointer border-0 text-secondary shadow-none hover:bg-white hover:text-primary-orange"
                      >
                        Detail
                        <ArrowUpRight className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}
