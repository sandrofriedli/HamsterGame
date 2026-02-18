// src/app/api/me/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email") || "sandro@local";
  const user = await prisma.user.findUnique({ where: { email }, include: { player: { include: { inventory: true, ledger: true } }, groups: true } });
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(user);
}
