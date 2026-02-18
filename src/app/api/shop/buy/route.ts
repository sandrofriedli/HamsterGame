// src/app/api/shop/buy/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const BuySchema = z.object({
  email: z.string().email(),
  itemId: z.string(),
  quantity: z.number().int().min(1).optional()
});

export async function POST(request: Request) {
  const bodyRaw = await request.json().catch(() => null);
  const parsed = BuySchema.safeParse(bodyRaw);
  if (!parsed.success) return NextResponse.json({ error: "invalid payload", issues: parsed.error.format() }, { status: 400 });

  const { email, itemId } = parsed.data;
  const quantity = parsed.data.quantity ?? 1;

  const user = await prisma.user.findUnique({ where: { email }, include: { player: true } });
  if (!user || !user.player) return NextResponse.json({ error: "User or player not found" }, { status: 404 });

  const player = user.player;
  const item = await prisma.assetCatalogItem.findUnique({ where: { id: itemId } });
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const totalPrice = item.basePriceCents * quantity;
  if (player.cashCents < totalPrice) {
    return NextResponse.json({ error: "Insufficient funds", balanceCents: player.cashCents, requiredCents: totalPrice }, { status: 402 });
  }

  const now = new Date();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const txn = await tx.transaction.create({
        data: {
          playerId: player.id,
          amountCents: -totalPrice,
          type: "purchase",
          meta: { itemId: item.id, itemName: item.name, quantity, when: now.toISOString() } as any
        }
      });

      const invCreates = [];
      for (let i = 0; i < quantity; i++) {
        invCreates.push(
          tx.inventoryItem.create({
            data: {
              playerId: player.id,
              catalogId: item.id,
              acquiredAt: now
            }
          })
        );
      }
      const createdInventory = await Promise.all(invCreates);

      const updatedPlayer = await tx.player.update({
        where: { id: player.id },
        data: { cashCents: player.cashCents - totalPrice }
      });

      return { transaction: txn, inventory: createdInventory, player: updatedPlayer };
    });

    return NextResponse.json({
      ok: true,
      message: `Bought ${quantity} × ${item.name}`,
      item: { id: item.id, name: item.name, category: item.category },
      quantity,
      totalPrice,
      newBalance: result.player.cashCents,
      createdInventoryIds: result.inventory.map((i) => i.id),
      transactionId: result.transaction.id
    });
  } catch (err: any) {
    console.error("Shop buy error:", err);
    return NextResponse.json({ error: "Internal server error", detail: err?.message ?? String(err) }, { status: 500 });
  }
}
