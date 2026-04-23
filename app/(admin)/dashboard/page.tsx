"use client";

import Container from "@/components/admin-layout/container";
import Header from "@/components/admin-layout/header";
import { AuthFeedbackDialog } from "@/components/ui/auth-feedback-dialog";
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
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  BadgeDollarSign,
  Loader2,
  ShoppingCart,
  UserRoundPlus,
  WalletCards,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

type ProductPanelView = "produk" | "lokasi";
type DashboardRange = "today" | "last-7-days" | "this-month" | "this-year";

type SummaryCardItem = {
  title: string;
  value: number;
  trend: string;
  trendValue: number;
  icon: "WalletCards" | "ShoppingCart" | "UserRoundPlus" | "BadgeDollarSign";
  isCurrency: boolean;
};

type SalesDataItem = {
  label: string;
  pendapatan: number;
};

type TopProductItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  sold: number;
  image: string;
};

type TopLocationItem = {
  id: string;
  city: string;
  province: string;
  users: number;
};

type LatestOrderItem = {
  id: string;
  customer: string;
  total: number;
  paymentStatus: string;
  shippingStatus: string;
};

type DashboardPayload = {
  range: DashboardRange;
  summaryCards: SummaryCardItem[];
  salesData: SalesDataItem[];
  topProducts: TopProductItem[];
  topLocations: TopLocationItem[];
  orders: LatestOrderItem[];
  error?: string;
};

const dashboardDateFilters: Array<{ value: DashboardRange; label: string }> = [
  { value: "today", label: "Hari ini" },
  { value: "last-7-days", label: "7 hari terakhir" },
  { value: "this-month", label: "Bulan ini" },
  { value: "this-year", label: "Tahun ini" },
];

const chartConfig = {
  pendapatan: {
    label: "Pendapatan",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const ICON_MAP = {
  WalletCards,
  ShoppingCart,
  UserRoundPlus,
  BadgeDollarSign,
} as const;

const EMPTY_DASHBOARD: DashboardPayload = {
  range: "today",
  summaryCards: [],
  salesData: [],
  topProducts: [],
  topLocations: [],
  orders: [],
};

const formatRupiah = (value: number) => `Rp. ${Math.max(0, value).toLocaleString("id-ID")}`;

export default function Dashboard() {
  const [dateFilter, setDateFilter] = useState<DashboardRange>("today");
  const [productPanelView, setProductPanelView] = useState<ProductPanelView>("produk");
  const [dashboardData, setDashboardData] = useState<DashboardPayload>(EMPTY_DASHBOARD);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    open: boolean;
    variant: "success" | "error";
    title: string;
    description: string;
  } | null>(null);

  const loadDashboard = useCallback(
    async (range: DashboardRange, silent = false) => {
      if (!silent) {
        setIsLoading(true);
      }

      const response = await fetch(`/api/admin/dashboard?range=${range}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      const data = (await response.json().catch(() => ({}))) as DashboardPayload;

      if (!response.ok) {
        if (!silent) {
          setIsLoading(false);
        }
        setFeedback({
          open: true,
          variant: "error",
          title: "Gagal Memuat Dashboard",
          description: data.error ?? "Data dashboard belum dapat ditampilkan.",
        });
        return;
      }

      setDashboardData({
        range,
        summaryCards: data.summaryCards ?? [],
        salesData: data.salesData ?? [],
        topProducts: data.topProducts ?? [],
        topLocations: data.topLocations ?? [],
        orders: data.orders ?? [],
      });
      if (!silent) {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard(dateFilter);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [dateFilter, loadDashboard]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadDashboard(dateFilter, true);
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [dateFilter, loadDashboard]);

  const highestLocationUsers = useMemo(
    () => dashboardData.topLocations[0]?.users ?? 0,
    [dashboardData.topLocations],
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        title="Dashboard"
        rightContent={
          <Select
            value={dateFilter}
            onValueChange={(value) => setDateFilter(value as DashboardRange)}
          >
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
        {isLoading ? (
          <div className="flex items-center gap-2 rounded-md bg-white px-4 py-3 text-sm text-dark-grey">
            <Loader2 className="size-4 animate-spin" />
            Memuat data dashboard...
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {dashboardData.summaryCards.map((metric) => {
            const Icon = ICON_MAP[metric.icon];
            const metricValue = metric.isCurrency
              ? formatRupiah(metric.value)
              : metric.value.toLocaleString("id-ID");
            const isPositiveTrend = metric.trendValue >= 0;

            return (
              <Card
                key={metric.title}
                className="gap-5 border-border-grey/90 bg-white py-4 shadow-none"
              >
                <CardHeader className="flex flex-row items-center justify-between px-4 pb-0">
                  <span className="flex size-9 items-center justify-center rounded-md bg-primary-orange/10 text-primary-orange">
                    <Icon className="size-5" />
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-xs",
                      isPositiveTrend ? "text-[#16A34A]" : "text-[#DC2626]",
                    )}
                  >
                    {isPositiveTrend ? (
                      <ArrowUp className="size-3.5" />
                    ) : (
                      <ArrowDown className="size-3.5" />
                    )}
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
                  data={dashboardData.salesData}
                  margin={{ top: 18, right: 8, bottom: 10, left: 8 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
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
                      : "border-transparent text-dark-grey hover:text-secondary",
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
                      : "border-transparent text-dark-grey hover:text-secondary",
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
                      {dashboardData.topProducts.length === 0 ? (
                        <p className="text-xs text-dark-grey">Belum ada data produk terlaris.</p>
                      ) : (
                        dashboardData.topProducts.map((product) => (
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
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-1">
                  {dashboardData.topLocations.length === 0 ? (
                    <p className="text-xs text-dark-grey">Belum ada data lokasi pelanggan.</p>
                  ) : (
                    dashboardData.topLocations.map((location) => {
                      const progress =
                        highestLocationUsers > 0
                          ? (location.users / highestLocationUsers) * 100
                          : 0;

                      return (
                        <div key={location.id} className="space-y-2">
                          <div className="flex items-center justify-between text-sm text-secondary">
                            <p>
                              {location.city}
                              <span className="ml-1 text-xs text-dark-grey/80">
                                ({location.province})
                              </span>
                            </p>
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
                    })
                  )}
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
                  <TableHead>ID Pesanan</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Total Belanja</TableHead>
                  <TableHead>Status Pembayaran</TableHead>
                  <TableHead>Status Pengiriman</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboardData.orders.length === 0 ? (
                  <TableRow className="border-border-grey">
                    <TableCell colSpan={6} className="text-center text-xs text-dark-grey">
                      Belum ada pesanan terbaru pada periode ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  dashboardData.orders.map((order) => (
                    <TableRow key={order.id} className="border-border-grey">
                      <TableCell className="text-xs text-secondary">{order.id}</TableCell>
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
                          asChild
                          variant="outline"
                          size="xs"
                          className="cursor-pointer border-0 text-secondary shadow-none hover:bg-white hover:text-primary-orange"
                        >
                          <a href="/orders">
                            Detail
                            <ArrowUpRight className="size-4" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Container>

      <AuthFeedbackDialog
        open={feedback?.open ?? false}
        onOpenChange={(open) => {
          if (!open) {
            setFeedback(null);
          }
        }}
        variant={feedback?.variant ?? "success"}
        title={feedback?.title ?? ""}
        description={feedback?.description ?? ""}
      />
    </div>
  );
}
