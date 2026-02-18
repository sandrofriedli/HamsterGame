// src/app/api/daily/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const questions = await prisma.question.findMany();
  const shuffled = questions.sort(() => Math.random() - 0.5).slice(0, 3).map((q) => ({
    id: q.id,
    prompt: q.prompt,
    answers: q.answers
  }));
  return NextResponse.json({ questions: shuffled });
}
