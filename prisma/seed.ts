import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const group = await prisma.group.upsert({
    where: { inviteCode: "HAMSTER-INIT" },
    update: {},
    create: {
      name: "HamsterGame Testgruppe",
      inviteCode: "HAMSTER-INIT"
    }
  });

  const user = await prisma.user.upsert({
    where: { email: "sandro@local" },
    update: {},
    create: {
      email: "sandro@local",
      name: "Sandro"
    }
  });

  await prisma.player.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      groupId: group.id,
      job: "Banker",
      cashCents: 5000000
    }
  });

  await prisma.question.createMany({
    data: [
      {
        category: "Allgemeinwissen",
        difficulty: "leicht",
        prompt: "Wie viele Kontinente gibt es?",
        answers: JSON.stringify(["5", "6", "7", "8"]),
        correctIndex: 2
      },
      {
        category: "Autos",
        difficulty: "mittel",
        prompt: "Welches Unternehmen produziert den 911?",
        answers: JSON.stringify(["Ferrari", "Porsche", "Lamborghini", "Audi"]),
        correctIndex: 1
      }
    ],
    skipDuplicates: true
  });

  await prisma.assetCatalogItem.createMany({
    data: [
      { name: "Porsche 911 (Beispiel)", category: "Auto", basePriceCents: 18000000 },
      { name: "Stadtwohnung (Beispiel)", category: "Haus", basePriceCents: 35000000 }
    ],
    skipDuplicates: true
  });

  console.log("Seed finished");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
