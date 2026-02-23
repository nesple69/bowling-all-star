import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function cleanup() {
    console.log('--- PULIZIA DUPLICATI ---');

    // Trova tutti i tornei
    const tornei = await prisma.torneo.findMany({
        include: { _count: { select: { risultati: true } } }
    });

    const seenNames = new Set();

    for (const t of tornei) {
        if (t.nome === 'Torneo FISB' || seenNames.has(t.nome)) {
            console.log(`Elimino torneo duplicato o errato: ${t.nome} (ID: ${t.id})`);
            await prisma.$transaction([
                prisma.risultatoTorneo.deleteMany({ where: { torneoId: t.id } }),
                prisma.iscrizioneTorneo.deleteMany({ where: { torneoId: t.id } }),
                prisma.giorniOrariTorneo.deleteMany({ where: { torneoId: t.id } }),
                prisma.torneo.delete({ where: { id: t.id } })
            ]);
        } else {
            seenNames.add(t.nome);
        }
    }

    console.log('Verifica finale Tornei:');
    const finalTornei = await prisma.torneo.findMany({
        include: { _count: { select: { risultati: true } } }
    });
    finalTornei.forEach(t => {
        console.log(`- ${t.nome}: ${t._count.risultati} risultati`);
    });
}

cleanup().finally(() => prisma.$disconnect());
