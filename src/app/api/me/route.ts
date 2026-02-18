import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email") || "sandro@local";

  const user = await prisma.user.findUnique({
    where: { email },
    include: { player: true, groups: true }
  });
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(user);
}
