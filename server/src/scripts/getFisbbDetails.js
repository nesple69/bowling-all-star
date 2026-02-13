const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const torneo = await prisma.torneo.findFirst({
        where: { nome: { contains: 'Fisbb Cup' } },
        include: { risultati: { take: 1 } }
    });
    console.log(JSON.stringify(torneo, null, 2));
    await prisma.$disconnect();
}

main();
