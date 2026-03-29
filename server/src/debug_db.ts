import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const g = await prisma.giocatore.findFirst({
        where: { numeroTessera: { equals: "ac3818", mode: 'insensitive' } }
    });
    console.log("GIOCATORE:", JSON.stringify(g, null, 2));

    const t = await prisma.torneo.findFirst({
        where: { nome: { contains: "SINGOLO FASE 2" } },
        include: { sedi: true }
    });
    console.log("TORNEO:", JSON.stringify(t, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
