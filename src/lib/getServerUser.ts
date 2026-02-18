// src/lib/getServerUser.ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import { cookies, headers } from "next/headers";

const prisma = new PrismaClient();

export async function getServerUser() {
  // Try standard call
  let session = await getServerSession(authOptions as any);
  // Fallback: provide headers/cookies explicitly (some environments)
  if (!session) {
    try {
      session = await getServerSession(
        {
          req: {
            headers: headers(),
            cookies: cookies()
          } as any
        } as any,
        authOptions as any
      );
    } catch (e) {
      // ignore
    }
  }
  if (!session?.user?.email) return { session: null, user: null };
  const email = (session.user.email as string).toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  return { session, user };
}
