const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tornei = await prisma.torneo.findMany({
        select: { id: true, nome: true }
    });
    console.log(JSON.stringify(tornei, null, 2));
    await prisma.$disconnect();
}

main();
