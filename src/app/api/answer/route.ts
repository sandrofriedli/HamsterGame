import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

type AnswerPayload = {
  email: string;
  answers: { questionId: string; chosenIndex: number }[];
};

function normalizeDateToISODay(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function rewardForDifficulty(diff: string) {
  if (!diff) return 1000;
  const df = diff.toLowerCase();
  if (df === "leicht" || df === "easy") return 1000;
  if (df === "mittel" || df === "medium") return 2000;
  if (df === "schwer" || df === "hard") return 5000;
  return 1500;
}

export async function POST(req: Request) {
  const body = (await req.json()) as AnswerPayload | undefined;
  if (!body || !body.email || !Array.isArray(body.answers)) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }
  const email = body.email;
  const user = await prisma.user.findUnique({ where: { email }, include: { player: true } });
  if (!user || !user.player) return NextResponse.json({ error: "user not found" }, { status: 404 });
  const player = user.player;

  const todayKey = normalizeDateToISODay(new Date());
  const existing = await prisma.dailyTask.findFirst({
    where: {
      userId: user.id,
      date: {
        gte: new Date(`${todayKey}T00:00:00.000Z`),
        lte: new Date(`${todayKey}T23:59:59.999Z`),
      }
    }
  });

  if (existing && existing.completed) {
    return NextResponse.json({ error: "Daily already completed today", reward: existing.reward }, { status: 409 });
  }

  const qIds = body.answers.map(a => a.questionId);
  const questions = await prisma.question.findMany({ where: { id: { in: qIds } } });
  const qMap = new Map(questions.map(q => [q.id, q]));

  let totalReward = 0;
  let correctCount = 0;
  const perQuestionResults: any[] = [];

  for (const ans of body.answers) {
    const q = qMap.get(ans.questionId);
    const chosen = ans.chosenIndex;
    if (!q) {
      perQuestionResults.push({ questionId: ans.questionId, correctIndex: null, chosenIndex: chosen, correct: false, rewardCents: 0 });
      continue;
    }
    const correct = q.correctIndex === chosen;
    const rewardCents = correct ? rewardForDifficulty(q.difficulty) : 0;
    if (correct) {
      correctCount++;
      totalReward += rewardCents;
    }
    perQuestionResults.push({ questionId: q.id, correctIndex: q.correctIndex, chosenIndex: chosen, correct, rewardCents });
  }

  let dailyTask;
  if (existing) {
    dailyTask = await prisma.dailyTask.update({ where: { id: existing.id }, data: { completed: true, reward: totalReward, questions: perQuestionResults as any } });
  } else {
    dailyTask = await prisma.dailyTask.create({ data: { userId: user.id, date: new Date(), questions: perQuestionResults as any, completed: true, reward: totalReward } });
  }

  if (totalReward > 0) {
    await prisma.transaction.create({ data: { playerId: player.id, amountCents: totalReward, type: "daily_reward", meta: { correctCount, date: new Date().toISOString() } as any } });
  }

  await prisma.player.update({ where: { id: player.id }, data: { cashCents: player.cashCents + totalReward, lastDailyAt: new Date() } });

  return NextResponse.json({ ok: true, correctCount, totalReward, perQuestionResults });
}
