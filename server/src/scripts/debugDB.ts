import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debug() {
    const resultsCount = await prisma.risultatoTorneo.count();
    const jugadoresCount = await prisma.giocatore.count();
    const torneiCount = await prisma.torneo.count();
    const partiteCount = await prisma.partitaTorneo.count();

    console.log(`TOTAL_RESULTS: ${resultsCount}`);
    console.log(`TOTAL_GIOCATORI: ${jugadoresCount}`);
    console.log(`TOTAL_TORNEI: ${torneiCount}`);
    console.log(`TOTAL_PARTITE: ${partiteCount}`);

    if (resultsCount > 0) {
        const sample = await prisma.risultatoTorneo.findFirst({
            include: { giocatore: true, torneo: true, partite: true }
        });
        console.log('SAMPLE_RESULT:', JSON.stringify(sample, null, 2));
    }

    // Controlla se i giocatori hanno birilli e partite
    const jugadoresWithData = await prisma.giocatore.findMany({
        where: { OR: [{ totaleBirilli: { gt: 0 } }, { mediaAttuale: { gt: 0 } }] },
        select: { nome: true, cognome: true, totaleBirilli: true, mediaAttuale: true }
    });
    console.log(`GIOCATORI WITH DATA: ${jugadoresWithData.length}`);
    jugadoresWithData.slice(0, 5).forEach(g => {
        console.log(`- ${g.cognome} ${g.nome}: ${g.totaleBirilli} birilli, media ${g.mediaAttuale}`);
    });

    await prisma.$disconnect();
}

debug().catch(console.error);
