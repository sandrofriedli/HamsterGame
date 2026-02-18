// src/app/api/admin/items/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerUser } from "@/lib/getServerUser";
import { z } from "zod";

const prisma = new PrismaClient();

const ItemCreateSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  basePriceCents: z.number().int().nonnegative(),
  imageUrl: z.string().nullable().optional(),
  meta: z.any().optional()
});

const ItemUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  category: z.string().optional(),
  basePriceCents: z.number().int().nonnegative().optional(),
  imageUrl: z.string().nullable().optional(),
  meta: z.any().optional()
});

async function requireAdmin() {
  const { user } = await getServerUser();
  if (!user || !user.isAdmin) return null;
  return user;
}

export async function GET() {
  const items = await prisma.assetCatalogItem.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = ItemCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid payload", issues: parsed.error.format() }, { status: 400 });

  const created = await prisma.assetCatalogItem.create({
    data: {
      name: parsed.data.name,
      category: parsed.data.category ?? "misc",
      basePriceCents: Math.max(0, Math.floor(parsed.data.basePriceCents)),
      imageUrl: parsed.data.imageUrl ?? null,
      meta: parsed.data.meta ?? null
    }
  });
  return NextResponse.json({ ok: true, item: created });
}

export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = ItemUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid payload", issues: parsed.error.format() }, { status: 400 });

  const updateData: any = {};
  if (typeof parsed.data.name === "string") updateData.name = parsed.data.name;
  if (typeof parsed.data.category === "string") updateData.category = parsed.data.category;
  if (typeof parsed.data.basePriceCents === "number") updateData.basePriceCents = Math.max(0, Math.floor(parsed.data.basePriceCents));
  if ("imageUrl" in parsed.data) updateData.imageUrl = parsed.data.imageUrl ?? null;
  if ("meta" in parsed.data) updateData.meta = parsed.data.meta ?? null;

  const updated = await prisma.assetCatalogItem.update({ where: { id: parsed.data.id }, data: updateData });
  return NextResponse.json({ ok: true, item: updated });
}
