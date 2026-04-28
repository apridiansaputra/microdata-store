import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({
    where: {
      deletedAt: null,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      sortOrder: true,
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(
    {
      categories,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=120, s-maxage=120, stale-while-revalidate=600",
      },
    },
  );
}
