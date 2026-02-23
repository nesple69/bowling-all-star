const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const torneo = await prisma.torneo.findFirst({
        where: { nome: { contains: 'Fisbb Cup' } }
    });

    if (!torneo) {
        console.log('Torneo non trovato');
        return;
    }

    const divisions = await prisma.risultatoTorneo.groupBy({
        by: ['divisione'],
        where: { torneoId: torneo.id },
        _count: { id: true }
    });

    console.log(`Divisioni trovate per ${torneo.nome}:`);
    console.log(JSON.stringify(divisions, null, 2));

    await prisma.$disconnect();
}

main();
