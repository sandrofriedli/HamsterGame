// src/app/api/shop/buy/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type BuyPayload = {
  email: string;    // dev-auth: identify user
  itemId: string;   // AssetCatalogItem.id
  quantity?: number; // optional, default 1
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BuyPayload | undefined;
    if (!body || !body.email || !body.itemId) {
      return NextResponse.json({ error: "Invalid payload; require email and itemId" }, { status: 400 });
    }
    const qty = Math.max(1, Math.floor(body.quantity ?? 1));

    // Find user + player
    const user = await prisma.user.findUnique({ where: { email: body.email }, include: { player: true } });
    if (!user || !user.player) {
      return NextResponse.json({ error: "User or player not found" }, { status: 404 });
    }
    const player = user.player;

    // Find item in catalog
    const item = await prisma.assetCatalogItem.findUnique({ where: { id: body.itemId } });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Total price
    const totalPrice = item.basePriceCents * qty;

    // Check balance
    if (player.cashCents < totalPrice) {
      return NextResponse.json({ error: "Insufficient funds", balanceCents: player.cashCents, requiredCents: totalPrice }, { status: 402 });
    }

    // Prepare inventory entries & transaction
    const now = new Date();

    // Use a DB transaction for atomicity:
    const result = await prisma.$transaction(async (tx) => {
      // 1) create ledger transaction (negative amount for purchase)
      const txn = await tx.transaction.create({
        data: {
          playerId: player.id,
          amountCents: -totalPrice,
          type: "purchase",
          meta: { itemId: item.id, itemName: item.name, quantity: qty, when: now.toISOString() } as any
        }
      });

      // 2) create inventory items (one row per quantity)
      const invCreates = [];
      for (let i = 0; i < qty; i++) {
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

      // 3) update player cash
      const updatedPlayer = await tx.player.update({
        where: { id: player.id },
        data: {
          cashCents: player.cashCents - totalPrice
        }
      });

      return {
        transaction: txn,
        inventory: createdInventory,
        player: updatedPlayer
      };
    });

    return NextResponse.json({
      ok: true,
      message: `Bought ${qty} × ${item.name}`,
      item: { id: item.id, name: item.name, category: item.category },
      quantity: qty,
      totalPrice,
      newBalance: result.player.cashCents,
      createdInventoryIds: result.inventory.map(i => i.id),
      transactionId: result.transaction.id
    });
  } catch (err: any) {
    console.error("Shop buy error:", err);
    return NextResponse.json({ error: "Internal server error", detail: err?.message ?? String(err) }, { status: 500 });
  }
}
