"use client";

import Container from "@/components/admin-layout/container";
import Header from "@/components/admin-layout/header";
import { DashboardPrintView } from "@/components/admin-dashboard/dashboard-print-view";
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
  Printer,
  ShoppingCart,
  UserRoundPlus,
  WalletCards,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

type ProductPanelView = "produk" | "lokasi";
type DashboardRange = "today" | "last-7-days" | "this-month" | "this-year" | "custom";

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
  { value: "custom", label: "Custom" },
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

// Format date ke YYYY-MM-DD untuk input[type=date]
function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function Dashboard() {
  const [dateFilter, setDateFilter] = useState<DashboardRange>("today");
  const [customFrom, setCustomFrom] = useState<string>(() => toInputDate(new Date()));
  const [customTo, setCustomTo] = useState<string>(() => toInputDate(new Date()));
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
    async (range: DashboardRange, from?: string, to?: string, silent = false) => {
      if (!silent) {
        setIsLoading(true);
      }

      let url = `/api/admin/dashboard?range=${range}`;
      if (range === "custom" && from && to) {
        url += `&from=${from}&to=${to}`;
      }

      const response = await fetch(url, {
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
    // Jangan load otomatis jika custom (tunggu user klik Terapkan)
    if (dateFilter === "custom") return;

    const timer = window.setTimeout(() => {
      void loadDashboard(dateFilter);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [dateFilter, loadDashboard]);

  useEffect(() => {
    const runRefresh = () => {
      if (document.visibilityState !== "visible") {
        return;
      }
      if (dateFilter === "custom") return;
      void loadDashboard(dateFilter, undefined, undefined, true);
    };

    const intervalId = window.setInterval(runRefresh, 60000);
    window.addEventListener("focus", runRefresh);
    document.addEventListener("visibilitychange", runRefresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", runRefresh);
      document.removeEventListener("visibilitychange", runRefresh);
    };
  }, [dateFilter, loadDashboard]);

  const highestLocationUsers = useMemo(
    () => dashboardData.topLocations[0]?.users ?? 0,
    [dashboardData.topLocations],
  );

  return (
    <>
      <div className="no-print flex min-h-screen flex-col">
        <Header
          title="Dashboard"
          rightContent={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-border-grey bg-white px-3 text-xs font-medium text-secondary shadow-none transition-colors hover:bg-light-grey"
              >
                <Printer className="h-4 w-4" />
                Cetak
              </button>
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
            </div>
          }
        />

        {/* Custom date range picker */}
        {dateFilter === "custom" && (
          <div className="border-b border-border-grey bg-white px-4 py-3">
            <div className="mx-auto flex max-w-screen-xl flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-dark-grey">Dari</span>
              <input
                type="date"
                value={customFrom}
                max={customTo}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-8 rounded-md border border-border-grey bg-white px-2 text-xs text-secondary focus:border-primary-orange focus:outline-none"
              />
              <span className="text-xs font-medium text-dark-grey">Sampai</span>
              <input
                type="date"
                value={customTo}
                min={customFrom}
                max={toInputDate(new Date())}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-8 rounded-md border border-border-grey bg-white px-2 text-xs text-secondary focus:border-primary-orange focus:outline-none"
              />
              <Button
                size="sm"
                className="h-8 cursor-pointer bg-primary-orange px-4 text-xs font-semibold text-white hover:bg-primary-orange/90"
                onClick={() => void loadDashboard("custom", customFrom, customTo)}
                disabled={!customFrom || !customTo}
              >
                Terapkan
              </Button>
            </div>
          </div>
        )}

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

      {/* Print view — hanya tampil saat window.print() */}
      <DashboardPrintView
        range={dateFilter === "custom" ? `${customFrom} s/d ${customTo}` : dateFilter}
        summaryCards={dashboardData.summaryCards}
        salesData={dashboardData.salesData}
        topProducts={dashboardData.topProducts}
        topLocations={dashboardData.topLocations}
        orders={dashboardData.orders}
      />
    </>
  );
}
