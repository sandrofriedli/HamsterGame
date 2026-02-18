// src/app/api/admin/items/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type ItemCreate = {
  name: string;
  category?: string;
  basePriceCents: number;
  imageUrl?: string | null;
  meta?: any;
};

export async function GET() {
  const items = await prisma.assetCatalogItem.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ItemCreate;
    if (!body?.name || typeof body.basePriceCents !== "number") {
      return NextResponse.json({ error: "name and basePriceCents required" }, { status: 400 });
    }
    const created = await prisma.assetCatalogItem.create({
      data: {
        name: body.name,
        category: body.category ?? "misc",
        basePriceCents: Math.max(0, Math.floor(body.basePriceCents)),
        imageUrl: body.imageUrl ?? null,
        meta: body.meta ?? null
      }
    });
    return NextResponse.json({ ok: true, item: created });
  } catch (err: any) {
    console.error("admin/items POST", err);
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const id = body?.id;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updateData: any = {};
  if (typeof parsed.data.name === "string") updateData.name = parsed.data.name;
  if (typeof parsed.data.category === "string") updateData.category = parsed.data.category;
  if (typeof parsed.data.basePriceCents === "number") updateData.basePriceCents = Math.max(0, Math.floor(parsed.data.basePriceCents));
  if ("imageUrl" in parsed.data) updateData.imageUrl = parsed.data.imageUrl ?? null;
  if ("meta" in parsed.data) updateData.meta = parsed.data.meta ?? null;

    const updated = await prisma.assetCatalogItem.update({
      where: { id },
      data: updateData
    });
    return NextResponse.json({ ok: true, item: updated });
  } catch (err: any) {
    console.error("admin/items PUT", err);
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
