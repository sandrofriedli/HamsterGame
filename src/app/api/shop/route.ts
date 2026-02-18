// src/app/api/shop/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  // Liefert alle AssetCatalogItems (mit Preisen in USD-Cents)
  const items = await prisma.assetCatalogItem.findMany({
    orderBy: { category: "asc" }
  });

  // Optional: map to friendlier shape
  const out = items.map(i => ({
    id: i.id,
    name: i.name,
    category: i.category,
    basePriceCents: i.basePriceCents,
    imageUrl: i.imageUrl,
    meta: i.meta
  }));

  return NextResponse.json({ items: out });
}
