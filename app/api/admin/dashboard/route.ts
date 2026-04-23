import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/api-guard";
import { syncExpiredPendingOrders } from "@/lib/orders/expiration";
import {
  getPaymentStatusLabel,
  getShippingStatusLabel,
} from "@/lib/orders/serializers";
import { toSafeNumber } from "@/lib/products/utils";
import { prisma } from "@/lib/prisma";

type DashboardRange = "today" | "last-7-days" | "this-month" | "this-year";

type DateRange = {
  currentStart: Date;
  currentEnd: Date;
  previousStart: Date;
  previousEnd: Date;
};

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function addDays(date: Date, value: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + value);
  return next;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
}

function addMonths(date: Date, value: number) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + value,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
}

function addYears(date: Date, value: number) {
  return new Date(
    date.getFullYear() + value,
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  );
}

function resolveDateRange(range: DashboardRange, now: Date): DateRange {
  if (range === "today") {
    const currentStart = startOfDay(now);
    const currentEnd = now;
    const previousStart = startOfDay(addDays(now, -1));
    const previousEnd = endOfDay(addDays(now, -1));
    return { currentStart, currentEnd, previousStart, previousEnd };
  }

  if (range === "last-7-days") {
    const currentStart = startOfDay(addDays(now, -6));
    const currentEnd = now;
    const previousStart = startOfDay(addDays(now, -13));
    const previousEnd = endOfDay(addDays(now, -7));
    return { currentStart, currentEnd, previousStart, previousEnd };
  }

  if (range === "this-month") {
    const currentStart = startOfMonth(now);
    const currentEnd = now;
    const previousStart = startOfMonth(addMonths(now, -1));
    const previousEnd = endOfDay(addDays(currentStart, -1));
    return { currentStart, currentEnd, previousStart, previousEnd };
  }

  const currentStart = startOfYear(now);
  const currentEnd = now;
  const previousStart = startOfYear(addYears(now, -1));
  const previousEnd = endOfDay(addDays(currentStart, -1));
  return { currentStart, currentEnd, previousStart, previousEnd };
}

function normalizeRange(raw: string | null): DashboardRange {
  if (
    raw === "today" ||
    raw === "last-7-days" ||
    raw === "this-month" ||
    raw === "this-year"
  ) {
    return raw;
  }
  return "today";
}

function calculateTrend(currentValue: number, previousValue: number) {
  if (previousValue <= 0) {
    if (currentValue <= 0) return 0;
    return 100;
  }

  return ((currentValue - previousValue) / previousValue) * 100;
}

function toTrendLabel(value: number) {
  const rounded = Math.round(value * 10) / 10;
  if (Number.isNaN(rounded)) return "0%";
  return `${rounded >= 0 ? "+" : ""}${rounded.toLocaleString("id-ID", {
    minimumFractionDigits: Math.abs(rounded % 1) > 0 ? 1 : 0,
    maximumFractionDigits: 1,
  })}%`;
}

type ChartPoint = {
  label: string;
  pendapatan: number;
};

function buildChartPoints(range: DashboardRange, revenues: Array<{ placedAt: Date; amount: number }>) {
  if (range === "today") {
    const labels = ["00", "03", "06", "09", "12", "15", "18", "21"];
    const map = new Map<string, number>(labels.map((label) => [label, 0]));

    for (const item of revenues) {
      const hour = item.placedAt.getHours();
      const bucket = labels[Math.floor(hour / 3)] ?? "21";
      map.set(bucket, (map.get(bucket) ?? 0) + item.amount);
    }

    return labels.map<ChartPoint>((label) => ({
      label: `${label}.00`,
      pendapatan: map.get(label) ?? 0,
    }));
  }

  if (range === "last-7-days") {
    const dateFormatter = new Intl.DateTimeFormat("id-ID", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
    const labels: string[] = [];
    const map = new Map<string, number>();
    const now = new Date();
    const start = startOfDay(addDays(now, -6));

    for (let i = 0; i < 7; i += 1) {
      const date = addDays(start, i);
      const label = dateFormatter.format(date);
      labels.push(label);
      map.set(label, 0);
    }

    for (const item of revenues) {
      const label = dateFormatter.format(item.placedAt);
      map.set(label, (map.get(label) ?? 0) + item.amount);
    }

    return labels.map<ChartPoint>((label) => ({
      label,
      pendapatan: map.get(label) ?? 0,
    }));
  }

  if (range === "this-month") {
    const now = new Date();
    const currentDay = now.getDate();
    const labels: string[] = [];
    const map = new Map<string, number>();
    for (let day = 1; day <= currentDay; day += 1) {
      const label = day.toString();
      labels.push(label);
      map.set(label, 0);
    }

    for (const item of revenues) {
      const label = item.placedAt.getDate().toString();
      map.set(label, (map.get(label) ?? 0) + item.amount);
    }

    return labels.map<ChartPoint>((label) => ({
      label,
      pendapatan: map.get(label) ?? 0,
    }));
  }

  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const map = new Map<string, number>(monthLabels.map((label) => [label, 0]));

  for (const item of revenues) {
    const label = monthLabels[item.placedAt.getMonth()] ?? "Jan";
    map.set(label, (map.get(label) ?? 0) + item.amount);
  }

  return monthLabels.map<ChartPoint>((label) => ({
    label,
    pendapatan: map.get(label) ?? 0,
  }));
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  await syncExpiredPendingOrders();

  const range = normalizeRange(request.nextUrl.searchParams.get("range"));
  const now = new Date();
  const dateRange = resolveDateRange(range, now);

  const currentOrderWhere = {
    deletedAt: null,
    placedAt: {
      gte: dateRange.currentStart,
      lte: dateRange.currentEnd,
    },
  } as const;

  const previousOrderWhere = {
    deletedAt: null,
    placedAt: {
      gte: dateRange.previousStart,
      lte: dateRange.previousEnd,
    },
  } as const;

  const currentSettledWhere = {
    ...currentOrderWhere,
    paymentStatus: "SETTLED" as const,
  };

  const previousSettledWhere = {
    ...previousOrderWhere,
    paymentStatus: "SETTLED" as const,
  };

  const [
    currentRevenueAggregate,
    previousRevenueAggregate,
    currentOrderCount,
    previousOrderCount,
    currentNewCustomerCount,
    previousNewCustomerCount,
    chartOrders,
    topProductGroups,
    locationOrders,
    latestOrders,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: currentSettledWhere,
      _sum: {
        grandTotalAmount: true,
        subtotalAmount: true,
        discountAmount: true,
        taxAmount: true,
      },
    }),
    prisma.order.aggregate({
      where: previousSettledWhere,
      _sum: {
        grandTotalAmount: true,
        subtotalAmount: true,
        discountAmount: true,
        taxAmount: true,
      },
    }),
    prisma.order.count({ where: currentOrderWhere }),
    prisma.order.count({ where: previousOrderWhere }),
    prisma.user.count({
      where: {
        deletedAt: null,
        role: "USER",
        createdAt: {
          gte: dateRange.currentStart,
          lte: dateRange.currentEnd,
        },
      },
    }),
    prisma.user.count({
      where: {
        deletedAt: null,
        role: "USER",
        createdAt: {
          gte: dateRange.previousStart,
          lte: dateRange.previousEnd,
        },
      },
    }),
    prisma.order.findMany({
      where: currentSettledWhere,
      select: {
        placedAt: true,
        grandTotalAmount: true,
      },
    }),
    prisma.orderItem.groupBy({
      by: ["productId", "productName"],
      where: {
        order: currentSettledWhere,
      },
      _sum: {
        quantity: true,
        lineSubtotal: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 5,
    }),
    prisma.order.findMany({
      where: currentOrderWhere,
      select: {
        userId: true,
        shippingCityName: true,
        shippingProvinceName: true,
      },
    }),
    prisma.order.findMany({
      where: currentOrderWhere,
      orderBy: {
        placedAt: "desc",
      },
      take: 8,
      select: {
        orderNumber: true,
        user: {
          select: {
            fullName: true,
          },
        },
        grandTotalAmount: true,
        paymentStatus: true,
        shippingStatus: true,
      },
    }),
  ]);

  const topProductIds = topProductGroups
    .map((item) => item.productId)
    .filter((value): value is string => typeof value === "string");

  const topProductDetails =
    topProductIds.length > 0
      ? await prisma.product.findMany({
          where: {
            id: {
              in: topProductIds,
            },
          },
          select: {
            id: true,
            basePrice: true,
            category: {
              select: {
                name: true,
              },
            },
            images: {
              orderBy: {
                sortOrder: "asc",
              },
              select: {
                url: true,
                isPrimary: true,
              },
            },
          },
        })
      : [];

  const totalRevenue = toSafeNumber(currentRevenueAggregate._sum.grandTotalAmount) ?? 0;
  const previousRevenue = toSafeNumber(previousRevenueAggregate._sum.grandTotalAmount) ?? 0;

  const currentSubtotal = toSafeNumber(currentRevenueAggregate._sum.subtotalAmount) ?? 0;
  const currentDiscount = toSafeNumber(currentRevenueAggregate._sum.discountAmount) ?? 0;
  const currentTax = toSafeNumber(currentRevenueAggregate._sum.taxAmount) ?? 0;
  const previousSubtotal = toSafeNumber(previousRevenueAggregate._sum.subtotalAmount) ?? 0;
  const previousDiscount = toSafeNumber(previousRevenueAggregate._sum.discountAmount) ?? 0;
  const previousTax = toSafeNumber(previousRevenueAggregate._sum.taxAmount) ?? 0;

  const netProfit = Math.max(0, currentSubtotal - currentDiscount + currentTax);
  const previousNetProfit = Math.max(0, previousSubtotal - previousDiscount + previousTax);

  const chartPoints = buildChartPoints(
    range,
    chartOrders.map((item) => ({
      placedAt: item.placedAt,
      amount: toSafeNumber(item.grandTotalAmount) ?? 0,
    })),
  );

  const productMetaById = new Map(
    topProductDetails.map((item) => [item.id, item] as const),
  );

  const topProducts = topProductGroups.map((group, index) => {
    const productMeta =
      group.productId !== null ? productMetaById.get(group.productId) : null;
    const quantity = Math.max(0, group._sum.quantity ?? 0);
    const subtotal = toSafeNumber(group._sum.lineSubtotal) ?? 0;
    const averagePrice = quantity > 0 ? Math.round(subtotal / quantity) : 0;
    const imageUrl =
      productMeta?.images.find((image) => image.isPrimary)?.url ??
      productMeta?.images[0]?.url ??
      "/image.png";

    return {
      id: `TP-${index + 1}`,
      name: group.productName,
      category: productMeta?.category?.name ?? "-",
      price: toSafeNumber(productMeta?.basePrice ?? null) ?? averagePrice,
      sold: quantity,
      image: imageUrl,
    };
  });

  const locationMap = new Map<string, Set<string>>();
  for (const order of locationOrders) {
    const city = order.shippingCityName.trim();
    const province = order.shippingProvinceName.trim();
    if (!city) continue;
    const key = `${city}|${province}`;
    const existing = locationMap.get(key) ?? new Set<string>();
    existing.add(order.userId);
    locationMap.set(key, existing);
  }

  const topLocations = [...locationMap.entries()]
    .map(([key, users]) => {
      const [city, province] = key.split("|");
      return {
        id: key,
        city,
        province,
        users: users.size,
      };
    })
    .sort((left, right) => right.users - left.users)
    .slice(0, 5);

  const orders = latestOrders.map((order) => ({
    id: order.orderNumber,
    customer: order.user.fullName,
    total: toSafeNumber(order.grandTotalAmount) ?? 0,
    paymentStatus: getPaymentStatusLabel(order.paymentStatus),
    shippingStatus: getShippingStatusLabel(order.shippingStatus),
  }));

  return NextResponse.json(
    {
      range,
      summaryCards: [
        {
          title: "Total Pendapatan",
          value: totalRevenue,
          trend: toTrendLabel(calculateTrend(totalRevenue, previousRevenue)),
          trendValue: calculateTrend(totalRevenue, previousRevenue),
          icon: "WalletCards",
          isCurrency: true,
        },
        {
          title: "Total Pesanan",
          value: currentOrderCount,
          trend: toTrendLabel(calculateTrend(currentOrderCount, previousOrderCount)),
          trendValue: calculateTrend(currentOrderCount, previousOrderCount),
          icon: "ShoppingCart",
          isCurrency: false,
        },
        {
          title: "Pelanggan Terbaru",
          value: currentNewCustomerCount,
          trend: toTrendLabel(
            calculateTrend(currentNewCustomerCount, previousNewCustomerCount),
          ),
          trendValue: calculateTrend(
            currentNewCustomerCount,
            previousNewCustomerCount,
          ),
          icon: "UserRoundPlus",
          isCurrency: false,
        },
        {
          title: "Net Profit",
          value: netProfit,
          trend: toTrendLabel(calculateTrend(netProfit, previousNetProfit)),
          trendValue: calculateTrend(netProfit, previousNetProfit),
          icon: "BadgeDollarSign",
          isCurrency: true,
        },
      ],
      salesData: chartPoints,
      topProducts,
      topLocations,
      orders,
    },
    { status: 200 },
  );
}
